import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/streaming/models/stream_source.dart';

/// Builds the player URL for one of the bundled stream hosts.
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
  final cleanBaseUrl = source.baseUrl.replaceAll(RegExp(r'/+$'), '');
  final tmdb = _nonEmpty(tmdbIdOverride) ?? _nonEmpty(media.externalIds.tmdb);
  final anilist =
      _nonEmpty(media.externalIds.anilist) ??
      (media.type == MediaType.ANIME ? _numericId(media.id) : null);
  final mal = _nonEmpty(media.externalIds.mal) ?? _nonEmpty(media.idMal);
  final isMovie = media.type == MediaType.MOVIE;
  final isAnime = media.type == MediaType.ANIME;

  switch (source.id) {
    case 'vidly':
      if (isAnime) {
        if (anilist != null) {
          return '$cleanBaseUrl/anime/$anilist/$episode';
        }
        if (mal != null) return '$cleanBaseUrl/anime/mal/$mal/$episode';
      }
      if (isMovie && tmdb != null) return '$cleanBaseUrl/movie/$tmdb';
      if (tmdb != null) {
        return '$cleanBaseUrl/tv/$tmdb/$season/$episode';
      }
      return null;

    case 'vidy':
      if (isAnime && anilist != null) {
        return '$cleanBaseUrl/anime/$anilist/$episode';
      }
      if (isMovie && tmdb != null) return '$cleanBaseUrl/movie/$tmdb';
      if (tmdb != null) {
        return '$cleanBaseUrl/tv/$tmdb/$season/$episode';
      }
      return null;

    case 'embedwave':
      if (tmdb == null) return null;
      if (isMovie) return '$cleanBaseUrl/embed/movie/$tmdb';
      return '$cleanBaseUrl/embed/tv/$tmdb/$season/$episode';

    case 'vidbolt':
      if (isAnime) {
        if (anilist != null) {
          return '$cleanBaseUrl/anime/$anilist/$episode';
        }
        if (mal != null) return '$cleanBaseUrl/anime/mal/$mal/$episode';
      }
      if (isMovie && tmdb != null) return '$cleanBaseUrl/movie/$tmdb';
      if (tmdb != null) {
        return '$cleanBaseUrl/tv/$tmdb/$season/$episode';
      }
      return null;
  }

  return null;
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
