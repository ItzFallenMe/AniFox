import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/core/utils/env.dart';

/// Builds a same-origin AniFox API URL that redirects to the configured
/// licensed download provider.
///
/// Provider configuration stays server-side; only `ANIFOX_API_URL` is needed
/// in the app build.
class DownloadProvider {
  static String get _base =>
      Env.ANIFOX_API_URL.trim().replaceAll(RegExp(r'/+$'), '');

  static bool get isConfigured => _base.isNotEmpty;

  /// Returns null when the provider is not configured or the title cannot be
  /// addressed with the ids AniFox has.
  static String? urlFor(
    UnifiedMedia media, {
    int? season,
    int? episode,
  }) {
    final base = _base;
    if (base.isEmpty) return null;

    String? type;
    String? tmdbId;
    String? anilistId;
    final resolvedSeason = season == null || season < 1 ? 1 : season;
    final resolvedEpisode = episode == null || episode < 1 ? 1 : episode;

    switch (media.type) {
      case MediaType.MOVIE:
        type = 'movie';
        tmdbId = media.externalIds.tmdb;
        break;
      case MediaType.TV:
        type = 'tv';
        tmdbId = media.externalIds.tmdb;
        break;
      case MediaType.ANIME:
        type = 'anime';
        anilistId = media.externalIds.anilist ?? media.id;
        break;
      case MediaType.MANGA:
      case MediaType.NOVEL:
        return null;
    }

    if ((type == 'movie' || type == 'tv') &&
        (tmdbId == null || tmdbId.isEmpty)) {
      return null;
    }
    if (type == 'anime' && (anilistId == null || anilistId.isEmpty)) {
      return null;
    }

    return Uri.parse('$base/api/download')
        .replace(queryParameters: {
          'type': type,
          if (tmdbId != null) 'tmdbId': tmdbId,
          if (anilistId != null) 'anilistId': anilistId,
          'season': '$resolvedSeason',
          'episode': '$resolvedEpisode',
        })
        .toString();
  }
}
