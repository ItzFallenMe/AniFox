import 'dart:convert';

import 'package:http/http.dart' as http;

import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/core/utils/env.dart';

/// Reads TMDB catalogs the same way the website does.
///
/// Requests go through the shared website `/api/tmdb` proxy when a site origin
/// is configured, so the API key can stay server-side. Builds without a site
/// origin fall back to the build-time [Env.TMDB_API_KEY].
class TmdbApi {
  static const _base = 'https://api.themoviedb.org/3';
  static const _imageBase = 'https://image.tmdb.org/t/p';
  static const _timeout = Duration(seconds: 18);

  static String get _siteOrigin =>
      Env.ANIFOX_API_URL.trim().replaceAll(RegExp(r'/+$'), '');

  static String get _apiKey => Env.TMDB_API_KEY.trim();

  static bool get isConfigured => _apiKey.isNotEmpty || _siteOrigin.isNotEmpty;

  static Future<Map<String, dynamic>> _request(
    String path, {
    Map<String, String> query = const {},
  }) async {
    Object? lastError;

    if (_siteOrigin.isNotEmpty) {
      try {
        return await _requestProxy(path, query);
      } catch (error) {
        lastError = error;
      }
    }
    if (_apiKey.isNotEmpty) {
      try {
        return await _requestDirect(path, query);
      } catch (error) {
        lastError = error;
      }
    }

    throw TmdbException(lastError?.toString() ?? 'TMDB is not configured.');
  }

  static Future<Map<String, dynamic>> _requestProxy(
    String path,
    Map<String, String> query,
  ) async {
    final uri = Uri.parse('$_siteOrigin/api/tmdb$path').replace(
      queryParameters: query.isEmpty ? null : query,
    );
    return _decode(await http.get(uri, headers: const {
      'Accept': 'application/json',
    }).timeout(_timeout));
  }

  static Future<Map<String, dynamic>> _requestDirect(
    String path,
    Map<String, String> query,
  ) async {
    final bearer = _apiKey.startsWith('eyJ');
    final uri = Uri.parse('$_base$path').replace(
      queryParameters: {
        ...query,
        if (!bearer) 'api_key': _apiKey,
      },
    );
    return _decode(await http.get(uri, headers: {
      'Accept': 'application/json',
      if (bearer) 'Authorization': 'Bearer $_apiKey',
    }).timeout(_timeout));
  }

  static Map<String, dynamic> _decode(http.Response response) {
    Map<String, dynamic> payload = const {};
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) payload = decoded;
    } on FormatException {
      // Fall through to the status/error handling below.
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = payload['message'] ?? payload['status_message'];
      throw TmdbException(
        message is String && message.isNotEmpty
            ? message
            : 'TMDB request failed (HTTP ${response.statusCode}).',
      );
    }
    return payload;
  }

  /// Fetches a TMDB list endpoint such as `/movie/popular`.
  static Future<List<UnifiedMedia>> list(
    String path,
    MediaType type, {
    Map<String, String> query = const {},
  }) async {
    final payload = await _request(path, query: query);
    final results = payload['results'];
    if (results is! List) return const [];

    return [
      for (final item in results)
        if (item is Map<String, dynamic>) _map(item, type),
    ];
  }

  /// Searches movies and TV shows in one TMDB request.
  static Future<List<UnifiedMedia>> searchMulti(String query) async {
    final cleaned = query.trim();
    if (cleaned.isEmpty) return const [];

    final payload = await _request(
      '/search/multi',
      query: {'query': cleaned, 'include_adult': 'false'},
    );
    final results = payload['results'];
    if (results is! List) return const [];

    final items = <UnifiedMedia>[];
    for (final item in results) {
      if (item is! Map<String, dynamic>) continue;
      switch (item['media_type']) {
        case 'movie':
          items.add(_map(item, MediaType.MOVIE));
        case 'tv':
          items.add(_map(item, MediaType.TV));
      }
    }
    return items;
  }

  static Future<UnifiedMedia?> details(MediaType type, String id) async {
    if (type != MediaType.MOVIE && type != MediaType.TV) return null;
    final cleanId = id.replaceFirst(RegExp(r'^tmdb-(?:movie|tv)-'), '');
    final payload = await _request('/${type == MediaType.MOVIE ? 'movie' : 'tv'}/$cleanId');
    return _map(payload, type, detailed: true);
  }

  static UnifiedMedia _map(
    Map<String, dynamic> item,
    MediaType type, {
    bool detailed = false,
  }) {
    final id = item['id']?.toString() ?? '';
    final date = (item['release_date'] ?? item['first_air_date'] ?? '') as String;
    final vote = item['vote_average'];
    final genres = item['genres'];
    final genreNames = <String>[
      if (genres is List)
        for (final genre in genres)
          if (genre is Map<String, dynamic> && genre['name'] is String)
            genre['name'] as String,
    ];
    final runtime = item['runtime'] ?? item['episode_run_time'];
    final seasons = item['number_of_seasons'];

    return UnifiedMedia(
      id: 'tmdb-${type.name.toLowerCase()}-$id',
      type: type,
      providerId: 'tmdb',
      title: MediaTitle(
        english: (item['title'] ??
                item['name'] ??
                item['original_title'] ??
                item['original_name'] ??
                'Untitled')
            as String,
      ),
      cover: _image(item['poster_path'], 'w500'),
      banner: _image(item['backdrop_path'], 'w1280'),
      description: (item['overview'] as String?)?.trim(),
      year: date.length >= 4 ? int.tryParse(date.substring(0, 4)) : null,
      score: vote is num && vote > 0 ? double.parse(vote.toStringAsFixed(1)) : null,
      format: type == MediaType.MOVIE ? 'MOVIE' : 'TV',
      genres: genreNames,
      episodes: type == MediaType.TV && seasons is int ? seasons : null,
      duration: detailed && runtime is int ? runtime : null,
      externalIds: MediaExternalIds(tmdb: id),
    );
  }

  static String? _image(Object? path, String size) {
    if (path is! String || path.isEmpty) return null;
    return '$_imageBase/$size$path';
  }
}

class TmdbException implements Exception {
  final String message;

  const TmdbException(this.message);

  @override
  String toString() => message;
}
