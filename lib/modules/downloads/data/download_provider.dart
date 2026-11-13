import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/core/utils/env.dart';

/// Builds pages for the operator's licensed download provider.
///
/// The provider is configured at build time with
/// `--dart-define=DOWNLOAD_URL=...`. Its pages authorise the caller by allowed
/// domain, so there is no key or API call involved.
class DownloadProvider {
  static String get _base => Env.DOWNLOAD_URL.trim().replaceAll(
        RegExp(r'/+$'),
        '',
      );

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

    switch (media.type) {
      case MediaType.MOVIE:
        final tmdbId = media.externalIds.tmdb;
        return tmdbId == null || tmdbId.isEmpty
            ? null
            : '$base/movie/$tmdbId';
      case MediaType.TV:
        final tmdbId = media.externalIds.tmdb;
        if (tmdbId == null || tmdbId.isEmpty) return null;
        final s = season == null || season < 1 ? 1 : season;
        final e = episode == null || episode < 1 ? 1 : episode;
        return '$base/tv/$tmdbId/$s/$e';
      case MediaType.ANIME:
        final anilistId = media.externalIds.anilist ?? media.id;
        if (anilistId.isEmpty) return null;
        final e = episode == null || episode < 1 ? 1 : episode;
        return '$base/anime/$anilistId/$e';
      case MediaType.MANGA:
      case MediaType.NOVEL:
        return null;
    }
  }
}
