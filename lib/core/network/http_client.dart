import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

export 'package:http/http.dart' hide Response, Client, get, post, put, patch, delete, head;

import 'package:anifox/core/app/values.dart';
import 'package:anifox/core/network/caching/cache_manager.dart';
import 'package:anifox/core/network/caching/domain/cache_entry.dart';
import 'package:anifox/core/network/http_response.dart';

class HTTP {
  HTTP._internal({CacheManager? cacheManager})
      : _client = HttpClient(),
        _cache = cacheManager ?? CacheManager();

  static HTTP? _instance;

  factory HTTP({CacheManager? cacheManager}) {
    return _instance ??= HTTP._internal(cacheManager: cacheManager);
  }

  /// Max automatic retries for transient failures (socket errors, timeouts,
  /// HTTP 429/5xx). Total attempts = 1 + [maxRetries].
  static int maxRetries = 2;

  /// Base delay between retries (exponential backoff: base * 2^attempt).
  static Duration retryBaseDelay = const Duration(milliseconds: 800);

  final HttpClient _client;
  final CacheManager? _cache;

  String _normalizeBody(String input) {
    return input.replaceAll(RegExp(r'(\s+|\\r|\\n|\\t)+'), ' ').trim();
  }

  String _buildKey(String url, Map<String, String>? query, Object? body) {
    final buffer = StringBuffer(url);

    if (query != null && query.isNotEmpty) {
      buffer.write('?');

      final keys = query.keys.toList()..sort();
      for (var i = 0; i < keys.length; i++) {
        if (i > 0) buffer.write('&');
        final key = keys[i];
        buffer
          ..write(key)
          ..write('=')
          ..write(query[key]);
      }
    }

    if (body != null) {
      buffer.write(query == null || query.isEmpty ? '?' : '&');
      buffer.write('body=');

      if (body is String) {
        buffer.write(_normalizeBody(body));
      } else {
        buffer.write(_normalizeBody(jsonEncode(body)));
      }
    }

    return buffer.toString();
  }

  Future<HttpResponse> _request(
    String method,
    Object urlInput, {
    Map<String, String>? headers,
    Map<String, String>? queryParameters,
    Object? body,
    Duration? cacheDuration,
  }) async {
    final urlString = urlInput.toString();
    final shouldCache = _shouldCache(cacheDuration);
    final key = _buildKey(urlString, queryParameters, body);
    final uri = Uri.parse(urlString).replace(queryParameters: queryParameters);

    if (shouldCache && _cache != null && !_cache.cacheConfig.bypassCache && (method == 'GET' || method == 'POST')) {
      final cached = await _cache.get(key);
      if (cached != null) {
        final bodyStr = utf8.decode(cached.bodyBytes);
        return HttpResponse(
          200,
          bodyStr,
          bodyBytes: Uint8List.fromList(cached.bodyBytes),
          headers: {'content-type': 'application/json'},
          request: HttpRequestInfo(uri),
        );
      }
    }

    Object? lastError;
    for (int attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        await Future.delayed(retryBaseDelay * (1 << (attempt - 1)));
      }
      try {
        final response = await _singleRequest(method, uri,
            headers: headers, body: body);
        // Retry rate-limits and server errors; don't cache them.
        if (_isRetryableStatus(response.statusCode) && attempt < maxRetries) {
          lastError = HttpException('HTTP ${response.statusCode} for $uri');
          continue;
        }
        if (shouldCache &&
            _cache != null &&
            (method == 'GET' || method == 'POST') &&
            response.statusCode >= 200 &&
            response.statusCode < 300 &&
            response.body.trim().isNotEmpty) {
          await _cache.put(
            key,
            CacheEntry(
              key: key,
              bodyBytes: response.bodyBytes,
              etag: null,
              lastModified: null,
              expiry: DateTime.now().add(cacheDuration!),
            ),
            cacheDuration,
          );
        }
        return response;
      } on HttpException catch (e) {
        lastError = e;
        if (!_isRetryableError(e) || attempt >= maxRetries) rethrow;
      } on SocketException catch (e) {
        lastError = e;
        if (attempt >= maxRetries) rethrow;
      } on TimeoutException catch (e) {
        lastError = e;
        if (attempt >= maxRetries) rethrow;
      }
    }
    final err = lastError;
    if (err is Exception) throw err;
    throw Exception('Request failed for $uri: $err');
  }

  static bool _isRetryableStatus(int status) =>
      status == 429 || (status >= 500 && status < 600);

  static bool _isRetryableError(HttpException e) {
    final msg = e.message.toLowerCase();
    return msg.contains('timeout') ||
        msg.contains('connection') ||
        msg.contains('socket') ||
        msg.contains('http 429') ||
        msg.contains('http 5');
  }

  Future<HttpResponse> _singleRequest(
    String method,
    Uri uri, {
    Map<String, String>? headers,
    Object? body,
  }) async {
    final req = await _client.openUrl(method, uri);

    if (AppValues.defaultClientUserAgent.isNotEmpty &&
        !(headers?.keys.any((k) => k.toLowerCase() == 'user-agent') ?? false)) {
      req.headers.set(
        HttpHeaders.userAgentHeader,
        AppValues.defaultClientUserAgent,
      );
    }

    // Browser-like defaults: many anime CDNs/anti-bot layers reject
    // requests without Accept headers, or serve challenge pages.
    bool hasHeader(String name) =>
        headers?.keys.any((k) => k.toLowerCase() == name.toLowerCase()) ?? false;
    if (!hasHeader('accept')) {
      req.headers.set('Accept',
          'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7');
    }
    if (!hasHeader('accept-language')) {
      req.headers.set('Accept-Language', 'en-US,en;q=0.9');
    }

    headers?.forEach(req.headers.set);

    if (body != null) {
      final contentTypeEntry = headers?.entries.where((e) => e.key.toLowerCase() == 'content-type').firstOrNull;
      final contentType = contentTypeEntry?.value.toLowerCase() ?? '';

      if (contentType.contains('application/x-www-form-urlencoded') && body is Map) {
        final queryStr = Uri(
          queryParameters: body.map(
            (k, v) => MapEntry(k.toString(), v.toString()),
          ),
        ).query;
        req.write(queryStr);
      } else {
        if (contentTypeEntry == null) {
          req.headers.set(HttpHeaders.contentTypeHeader, 'application/json');
        }
        req.write(body is String ? body : jsonEncode(body));
      }
    }

    final res = await req.close().timeout(const Duration(seconds: 30));

    final bytes = await res.fold<List<int>>(
      <int>[],
      (buffer, element) => buffer..addAll(element),
    );
    final resBody = utf8.decode(bytes, allowMalformed: true);
    return HttpResponse(
      res.statusCode,
      resBody,
      bodyBytes: Uint8List.fromList(bytes),
      reasonPhrase: res.reasonPhrase,
      headers: res.headers.contentType == null ? {} : {'content-type': res.headers.contentType!.mimeType},
      request: HttpRequestInfo(uri),
    );
  }

  Future<HttpResponse> get(
    Object url, {
    Map<String, String>? headers,
    Map<String, String>? queryParameters,
    Duration? cacheDuration = Duration.zero,
  }) {
    return _request(
      'GET',
      url,
      headers: headers,
      queryParameters: queryParameters,
      cacheDuration: cacheDuration,
    );
  }

  Future<HttpResponse> post(
    Object url, {
    Map<String, String>? headers,
    Map<String, String>? queryParameters,
    Object? body,
    Duration? cacheDuration,
  }) {
    return _request(
      'POST',
      url,
      headers: headers,
      body: body,
      queryParameters: queryParameters,
      cacheDuration: cacheDuration,
    );
  }

  Future<HttpResponse> put(
    Object url, {
    Map<String, String>? headers,
    Map<String, String>? queryParameters,
    Object? body,
  }) {
    return _request(
      'PUT',
      url,
      headers: headers,
      body: body,
      queryParameters: queryParameters,
    );
  }

  Future<HttpResponse> patch(
    Object url, {
    Map<String, String>? headers,
    Map<String, String>? queryParameters,
    Object? body,
  }) {
    return _request(
      'PATCH',
      url,
      headers: headers,
      body: body,
      queryParameters: queryParameters,
    );
  }

  Future<HttpResponse> delete(
    Object url, {
    Map<String, String>? headers,
    Map<String, String>? queryParameters,
  }) {
    return _request(
      'DELETE',
      url,
      headers: headers,
      queryParameters: queryParameters,
    );
  }

  Future<HttpResponse> head(
    Object url, {
    Map<String, String>? headers,
    Map<String, String>? queryParameters,
  }) {
    return _request(
      'HEAD',
      url,
      headers: headers,
      queryParameters: queryParameters,
    );
  }

  void close() {}

  bool _shouldCache(Duration? cacheDuration) {
    if (_cache != null && !_cache.cacheConfig.enableCaching) {
      return false;
    }
    return cacheDuration != null && cacheDuration > Duration.zero;
  }
}

final httpClient = HTTP();

typedef Client = HTTP;

Future<HttpResponse> get(
  Object url, {
  Map<String, String>? headers,
  Map<String, String>? queryParameters,
  Duration? cacheDuration = Duration.zero,
}) =>
    httpClient.get(
      url,
      headers: headers,
      queryParameters: queryParameters,
      cacheDuration: cacheDuration,
    );

Future<HttpResponse> post(
  Object url, {
  Map<String, String>? headers,
  Map<String, String>? queryParameters,
  Object? body,
  Duration? cacheDuration,
}) =>
    httpClient.post(
      url,
      headers: headers,
      queryParameters: queryParameters,
      body: body,
      cacheDuration: cacheDuration,
    );

Future<HttpResponse> put(
  Object url, {
  Map<String, String>? headers,
  Map<String, String>? queryParameters,
  Object? body,
}) =>
    httpClient.put(
      url,
      headers: headers,
      queryParameters: queryParameters,
      body: body,
    );

Future<HttpResponse> patch(
  Object url, {
  Map<String, String>? headers,
  Map<String, String>? queryParameters,
  Object? body,
}) =>
    httpClient.patch(
      url,
      headers: headers,
      queryParameters: queryParameters,
      body: body,
    );

Future<HttpResponse> delete(
  Object url, {
  Map<String, String>? headers,
  Map<String, String>? queryParameters,
}) =>
    httpClient.delete(
      url,
      headers: headers,
      queryParameters: queryParameters,
    );

Future<HttpResponse> head(
  Object url, {
  Map<String, String>? headers,
  Map<String, String>? queryParameters,
}) =>
    httpClient.head(
      url,
      headers: headers,
      queryParameters: queryParameters,
    );
