import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

class HttpRequestInfo {
  final Uri url;
  const HttpRequestInfo(this.url);
}

class HttpResponse {
  final int statusCode;
  final Map<String, String> headers;
  final String body;
  final Uint8List bodyBytes;
  final String? reasonPhrase;
  final HttpRequestInfo? request;

  HttpResponse(
    this.statusCode,
    this.body, {
    Map<String, String>? headers,
    Uint8List? bodyBytes,
    this.reasonPhrase,
    this.request,
  })  : headers = headers ?? {},
        bodyBytes = bodyBytes ?? Uint8List.fromList(utf8.encode(body));

  dynamic get json {
    ensureSuccess();
    if (body.trimLeft().startsWith('<')) {
      throw Exception(
        'Expected JSON but received HTML (status $statusCode). '
        'The server may be behind a Cloudflare challenge.',
      );
    }
    return jsonDecode(body);
  }

  /// Throws a descriptive [HttpException] unless the status is 2xx.
  /// Providers should call this right after fetching HTML pages so
  /// Cloudflare blocks / dead mirrors fail fast with context instead of
  /// producing empty selector results downstream.
  void ensureSuccess([String? what]) {
    if (statusCode < 200 || statusCode >= 300) {
      final snippet = body.length > 160 ? '${body.substring(0, 160)}...' : body;
      throw HttpException(
        'HTTP $statusCode${what != null ? ' for $what' : ''}'
        '${reasonPhrase != null ? ' ($reasonPhrase)' : ''}. Body: $snippet',
      );
    }
    if (body.trim().isEmpty) {
      throw HttpException(
        'Empty response body${what != null ? ' for $what' : ''} (status $statusCode).',
      );
    }
  }

  /// True when the body looks like a Cloudflare / anti-bot challenge page.
  bool get looksLikeChallenge {
    final b = body.toLowerCase();
    return statusCode == 403 ||
        b.contains('just a moment') ||
        b.contains('attention required') ||
        b.contains('cf-challenge') ||
        b.contains('cf_challenge') ||
        b.contains('cf_clearance') && b.contains('challenge');
  }
}

typedef Response = HttpResponse;
