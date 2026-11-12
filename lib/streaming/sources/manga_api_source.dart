import 'dart:convert';

import 'package:anifox/common/models/unified_chapter.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/core/utils/env.dart';
import 'package:anifox/streaming/models/chapter_page.dart';
import 'package:anifox/streaming/models/stream_source.dart';
import 'package:anifox/streaming/state/manga_source.dart';
import 'package:http/http.dart' as http;

/// Client for the separately deployable AniFox manga API.
///
/// The service URL is supplied using `--dart-define=MANGA_API_URL=...`; the
/// application never contacts the scraped content host directly.
class MangaApiSource extends MangaSource {
  static const sourceId = 'anifox-manga-api';
  static const sourceName = 'AniFox Manga';
  static const _requestTimeout = Duration(seconds: 18);
  static final http.Client _defaultClient = http.Client();
  static final _chapterNumberPattern = RegExp(
    r'(?:chapter|ch\.?|episode)\s*([\d]+(?:\.[\d]+)?)',
    caseSensitive: false,
  );

  @override
  final StreamSource sourceInfo;

  final http.Client _client;

  MangaApiSource(this.sourceInfo, {http.Client? client})
    : _client = client ?? _defaultClient;

  static MangaApiSource? fromSource(
    StreamSource source, {
    http.Client? client,
  }) {
    if (source.id != sourceId || source.baseUrl.trim().isEmpty) return null;
    return MangaApiSource(source, client: client);
  }

  static StreamSource? get configuredSource {
    final rawUrl = Env.MANGA_API_URL.trim();
    final uri = Uri.tryParse(rawUrl);
    if (uri == null ||
        !uri.hasAuthority ||
        !(const {'http', 'https'}).contains(uri.scheme)) {
      return null;
    }

    return StreamSource(
      id: sourceId,
      name: sourceName,
      kind: StreamSourceKind.builtin,
      mediaType: MediaType.MANGA,
      baseUrl: rawUrl.replaceFirst(RegExp(r'/+$'), ''),
      tagline: 'Manga catalog and chapter reader',
    );
  }

  Uri _endpoint(List<String> segments, {Map<String, String>? query}) {
    final root = Uri.parse(sourceInfo.baseUrl);
    final rootSegments = root.pathSegments.where(
      (segment) => segment.isNotEmpty,
    );
    return root.replace(
      pathSegments: [...rootSegments, ...segments],
      queryParameters: query,
    );
  }

  Future<dynamic> _getJson(Uri uri) async {
    final response = await _client
        .get(uri, headers: const {'accept': 'application/json'})
        .timeout(_requestTimeout);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      String message = 'Manga service request failed (${response.statusCode}).';
      try {
        final body = jsonDecode(response.body);
        if (body is Map && body['message'] is String) {
          message = body['message'] as String;
        } else if (body is Map && body['error'] is String) {
          message = body['error'] as String;
        }
      } catch (_) {
        // Preserve the readable status fallback for non-JSON errors.
      }
      throw MangaApiException(message);
    }

    try {
      return jsonDecode(response.body);
    } on FormatException {
      throw const MangaApiException('The manga service returned invalid data.');
    }
  }

  @override
  Future<List<UnifiedMedia>> search(
    String query,
    MediaType type, {
    int page = 1,
    bool isAdult = false,
    List<String> sort = const ['SEARCH_MATCH'],
    List<String> genres = const [],
    List<String> tags = const [],
    bool forceRefresh = false,
  }) async {
    if (type != MediaType.MANGA || query.trim().isEmpty) return const [];

    final result = await _getJson(
      _endpoint(
        ['api', 'search', query.trim()],
        query: {'page': '${page < 1 ? 1 : page}'},
      ),
    );
    final root = _asMap(result);
    return _asList(
      root['mangaList'],
    ).map(_mapCatalogItem).whereType<UnifiedMedia>().toList(growable: false);
  }

  @override
  Future<List<UnifiedMedia>> getTrending({int page = 1}) async {
    final result = await _getJson(
      _endpoint(
        ['api', 'mangaList'],
        query: {'page': '${page < 1 ? 1 : page}'},
      ),
    );
    final root = _asMap(result);
    return _asList(
      root['mangaList'],
    ).map(_mapCatalogItem).whereType<UnifiedMedia>().toList(growable: false);
  }

  @override
  Future<UnifiedMedia> getDetails(String providerId, MediaType type) async {
    if (type != MediaType.MANGA) {
      throw const MangaApiException('AniFox Manga only supports manga titles.');
    }
    return _mapDetails(await _fetchDetails(providerId), providerId);
  }

  @override
  Future<List<UnifiedChapter>> getChapters(
    String mangaId, {
    bool forceRefresh = false,
  }) async {
    final details = _asMap(await _fetchDetails(mangaId));
    final chapters = _asList(details['chapterList']);
    final result = <UnifiedChapter>[];

    for (var index = 0; index < chapters.length; index++) {
      final chapter = _asMap(chapters[index]);
      final chapterId = _readString(chapter['id']);
      final title = _readString(chapter['name']);
      if (chapterId == null || title == null) continue;

      final numberMatch = _chapterNumberPattern.firstMatch(title);
      final parsedNumber = numberMatch == null
          ? null
          : double.tryParse(numberMatch.group(1)!);
      result.add(
        UnifiedChapter(
          // Keep the manga id with each chapter because the page endpoint
          // needs both path parameters when the reader opens the chapter.
          id: '$mangaId::$chapterId',
          number: parsedNumber ?? (chapters.length - index).toDouble(),
          title: title,
          uploadDate: _readString(chapter['createdAt']),
        ),
      );
    }

    return result;
  }

  @override
  Future<List<ChapterPage>> getPages(String chapterId) async {
    final separator = chapterId.indexOf('::');
    if (separator <= 0 || separator + 2 >= chapterId.length) {
      throw const MangaApiException('This chapter link is invalid.');
    }

    final mangaId = chapterId.substring(0, separator);
    final sourceChapterId = chapterId.substring(separator + 2);
    final result = _asMap(
      await _getJson(_endpoint(['api', 'manga', mangaId, sourceChapterId])),
    );

    return _asList(result['images'])
        .map((entry) {
          final image = _asMap(entry);
          final url = _readString(image['image']);
          if (url == null) return null;
          return ChapterPage(url: _normalizeImageUrl(url));
        })
        .whereType<ChapterPage>()
        .toList(growable: false);
  }

  Future<dynamic> _fetchDetails(String providerId) {
    if (providerId.trim().isEmpty) {
      throw const MangaApiException('A manga source id is required.');
    }
    return _getJson(_endpoint(['api', 'manga', providerId]));
  }

  UnifiedMedia? _mapCatalogItem(dynamic raw) {
    final item = _asMap(raw);
    final id = _readString(item['id']);
    final title = _readString(item['title']);
    if (id == null || title == null) return null;

    return UnifiedMedia(
      id: id,
      providerId: id,
      sourceId: sourceInfo.id,
      sourceName: sourceInfo.name,
      url: _readString(item['url']),
      type: MediaType.MANGA,
      title: MediaTitle(english: title, romaji: title),
      cover: _readString(item['image']) == null
          ? null
          : _normalizeImageUrl(_readString(item['image'])!),
      description: _readString(item['description']),
      chapters: _parseChapterCount(_readString(item['chapter'])),
      source: sourceInfo.name,
    );
  }

  UnifiedMedia _mapDetails(dynamic raw, String mangaId) {
    final details = _asMap(raw);
    final title = _readString(details['name']) ?? 'Unknown manga';
    final genreValues = _asList(
      details['genres'],
    ).map(_readString).whereType<String>().toList(growable: false);
    final chapters = _asList(details['chapterList']);

    return UnifiedMedia(
      id: mangaId,
      providerId: mangaId,
      sourceId: sourceInfo.id,
      sourceName: sourceInfo.name,
      type: MediaType.MANGA,
      title: MediaTitle(english: title, romaji: title),
      cover: _readString(details['imageUrl']) == null
          ? null
          : _normalizeImageUrl(_readString(details['imageUrl'])!),
      description: _readString(details['description']),
      genres: genreValues,
      chapters: chapters.isEmpty ? null : chapters.length,
      status: _readString(details['status']),
      source: sourceInfo.name,
    );
  }

  String _normalizeImageUrl(String value) {
    if (value.isEmpty) return value;
    if (value.startsWith('//')) return 'https:$value';
    final uri = Uri.tryParse(value);
    if (uri != null && uri.hasScheme) return value;
    if (value.startsWith('/')) return 'https://ww6.mangakakalot.tv$value';
    return 'https://ww6.mangakakalot.tv/$value';
  }

  int? _parseChapterCount(String? value) {
    if (value == null) return null;
    final match = RegExp(r'[\d,]+').firstMatch(value);
    return match == null
        ? null
        : int.tryParse(match.group(0)!.replaceAll(',', ''));
  }

  static Map<String, dynamic> _asMap(dynamic value) =>
      value is Map<String, dynamic> ? value : <String, dynamic>{};

  static List<dynamic> _asList(dynamic value) =>
      value is List<dynamic> ? value : const [];

  static String? _readString(dynamic value) {
    if (value == null) return null;
    final text = value.toString().trim();
    return text.isEmpty ? null : text;
  }
}

class MangaApiException implements Exception {
  final String message;

  const MangaApiException(this.message);

  @override
  String toString() => message;
}
