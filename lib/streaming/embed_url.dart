import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/core/utils/env.dart';
import 'package:anifox/streaming/models/stream_source.dart';

/// Builds a same-origin AniFox API URL that redirects to a bundled host.
///
/// Every host expects a different identifier. We prefer native anime IDs for
/// anime, and TMDB IDs for movies and TV shows. Returning `null` means the
/// selected host cannot play this title with the metadata we have; the player
/// then shows a helpful message instead of a broken iframe.
String? buildEmbedUrl({
  required StreamSource source,
  required UnifiedMedia media,
  required int episode,
  int season = 1,
  String? tmdbIdOverride,
}) {
  final apiBase = Env.ANIFOX_API_URL.trim().replaceAll(RegExp(r'/+$'), '');
  if (apiBase.isEmpty) return null;
  final tmdb = _nonEmpty(tmdbIdOverride) ?? _nonEmpty(media.externalIds.tmdb);
  final anilist =
      _nonEmpty(media.externalIds.anilist) ??
      (media.type == MediaType.ANIME ? _numericId(media.id) : null);
  final mal = _nonEmpty(media.externalIds.mal) ?? _nonEmpty(media.idMal);
  if (!const {'vidly', 'vidbolt', 'vidy', 'embedwave'}.contains(source.id)) {
    return null;
  }

  final query = <String, String>{
    'source': source.id,
    'type': switch (media.type) {
      MediaType.MOVIE => 'movie',
      MediaType.TV => 'tv',
      MediaType.ANIME => 'anime',
      _ => '',
    },
    'episode': '$episode',
    'season': '$season',
    if (tmdb != null) 'tmdbId': tmdb,
    if (anilist != null) 'anilistId': anilist,
    if (mal != null) 'malId': mal,
  };
  if (query['type'] == '') return null;

  return Uri.parse('$apiBase/api/stream')
      .replace(queryParameters: query)
      .toString();
}

String? _nonEmpty(String? value) {
  if (value == null) return null;
  final trimmed = value.trim();
  return trimmed.isEmpty ? null : trimmed;
}

String? _numericId(String value) {
  final number = int.tryParse(value);
  return number?.toString();
}
