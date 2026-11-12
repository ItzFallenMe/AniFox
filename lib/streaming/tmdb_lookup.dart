import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:anifox/core/utils/env.dart';

/// TMDB API key supplied at build time.
///
/// Builds without a key still support metadata and playback paths that do not
/// require a TMDB lookup.
const anifoxTmdbApiKey = Env.TMDB_API_KEY;

final Map<String, String?> _cache = {};

/// Resolves a TMDB id for a movie or TV title that arrived without one.
///
/// Stream hosts address movies and shows by TMDB id, while the anime
/// trackers only supply AniList/MAL ids. Results are cached per title so
/// switching servers does not repeat the search.
Future<String?> resolveTmdbId({
  required String title,
  required bool isMovie,
  int? year,
}) async {
  final cleanTitle = title.trim();
  if (cleanTitle.isEmpty) return null;
  if (anifoxTmdbApiKey.isEmpty) return null;

  final cacheKey = '${isMovie ? 'movie' : 'tv'}:$cleanTitle:${year ?? ''}';
  if (_cache.containsKey(cacheKey)) return _cache[cacheKey];

  try {
    final uri = Uri.https(
      'api.themoviedb.org',
      isMovie ? '/3/search/movie' : '/3/search/tv',
      {
        'api_key': anifoxTmdbApiKey,
        'query': cleanTitle,
        if (year != null) 'year': '$year',
      },
    );
    final response = await http.get(uri).timeout(const Duration(seconds: 8));
    if (response.statusCode != 200) return _cache[cacheKey] = null;

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) return _cache[cacheKey] = null;
    final results = decoded['results'];
    if (results is! List || results.isEmpty) return _cache[cacheKey] = null;

    final first = results.first;
    if (first is! Map<String, dynamic>) return _cache[cacheKey] = null;
    final id = first['id'];
    return _cache[cacheKey] = id is int ? '$id' : null;
  } catch (_) {
    return null;
  }
}
