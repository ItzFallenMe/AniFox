import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/common/state/content_prefs_provider.dart';
import 'package:anifox/modules/browse/data/tmdb_api.dart';
import 'package:anifox/modules/tracking/engine/remote_tracker.dart';
import 'package:anifox/modules/tracking/models/models/tracker_category.dart';
import 'package:anifox/modules/tracking/state/tracker_registry.dart';
import 'package:anifox/streaming/streaming_providers.dart';

/// One horizontal rail on a Movies, TV or Anime feed.
@immutable
class MediaFeedRow {
  final String id;
  final String title;
  final MediaType mediaType;
  final String? tmdbPath;
  final TrackerCategory? trackerCategory;

  const MediaFeedRow({
    required this.id,
    required this.title,
    required this.mediaType,
    this.tmdbPath,
    this.trackerCategory,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MediaFeedRow &&
          other.id == id &&
          other.mediaType == mediaType &&
          other.tmdbPath == tmdbPath &&
          other.trackerCategory == trackerCategory;

  @override
  int get hashCode =>
      Object.hash(id, mediaType, tmdbPath, trackerCategory);
}

/// The rails mirrored from the website home feed for each media type.
final mediaFeedRowsProvider =
    Provider.family<List<MediaFeedRow>, MediaType>((ref, type) {
      switch (type) {
        case MediaType.MOVIE:
          return const [
            MediaFeedRow(
              id: 'trending',
              title: 'Trending Movies',
              mediaType: MediaType.MOVIE,
              tmdbPath: '/trending/movie/week',
            ),
            MediaFeedRow(
              id: 'new',
              title: 'New Movies',
              mediaType: MediaType.MOVIE,
              tmdbPath: '/movie/now_playing',
            ),
            MediaFeedRow(
              id: 'popular',
              title: 'Popular Movies',
              mediaType: MediaType.MOVIE,
              tmdbPath: '/movie/popular',
            ),
            MediaFeedRow(
              id: 'top_rated',
              title: 'Top Rated Movies',
              mediaType: MediaType.MOVIE,
              tmdbPath: '/movie/top_rated',
            ),
            MediaFeedRow(
              id: 'upcoming',
              title: 'Upcoming Movies',
              mediaType: MediaType.MOVIE,
              tmdbPath: '/movie/upcoming',
            ),
          ];
        case MediaType.TV:
          return const [
            MediaFeedRow(
              id: 'trending',
              title: 'Trending TV Shows',
              mediaType: MediaType.TV,
              tmdbPath: '/trending/tv/week',
            ),
            MediaFeedRow(
              id: 'popular',
              title: 'Popular TV Shows',
              mediaType: MediaType.TV,
              tmdbPath: '/tv/popular',
            ),
            MediaFeedRow(
              id: 'top_rated',
              title: 'Top Rated TV Shows',
              mediaType: MediaType.TV,
              tmdbPath: '/tv/top_rated',
            ),
            MediaFeedRow(
              id: 'airing_today',
              title: 'Airing Today',
              mediaType: MediaType.TV,
              tmdbPath: '/tv/airing_today',
            ),
            MediaFeedRow(
              id: 'on_the_air',
              title: 'On The Air',
              mediaType: MediaType.TV,
              tmdbPath: '/tv/on_the_air',
            ),
          ];
        case MediaType.ANIME:
          return const [
            MediaFeedRow(
              id: 'trending',
              title: 'Trending Anime',
              mediaType: MediaType.ANIME,
              trackerCategory: TrackerCategory.trending,
            ),
            MediaFeedRow(
              id: 'season',
              title: 'Popular This Season',
              mediaType: MediaType.ANIME,
              trackerCategory: TrackerCategory.popularThisSeason,
            ),
            MediaFeedRow(
              id: 'top_rated',
              title: 'Top Rated Anime',
              mediaType: MediaType.ANIME,
              trackerCategory: TrackerCategory.topRated,
            ),
            MediaFeedRow(
              id: 'upcoming',
              title: 'Upcoming Anime',
              mediaType: MediaType.ANIME,
              trackerCategory: TrackerCategory.upcoming,
            ),
          ];
        default:
          return const [];
      }
    }, name: 'mediaFeedRowsProvider');

/// A tracker that can serve anime metadata, regardless of the tracker chosen
/// for the user's library.
RemoteTracker? _animeTracker(Ref ref) {
  final preferred = ref.watch(metadataSourceProvider);
  if (preferred.supportsMediaType(MediaType.ANIME)) return preferred;

  final available = ref
      .watch(availableTrackersProvider)
      .whereType<RemoteTracker>()
      .where((tracker) => tracker.supportsMediaType(MediaType.ANIME));

  return available.firstOrNull;
}

final mediaFeedRowProvider =
    FutureProvider.family<List<UnifiedMedia>, MediaFeedRow>((
      ref,
      row,
    ) async {
      final tmdbPath = row.tmdbPath;
      if (tmdbPath != null) {
        if (!TmdbApi.isConfigured) return const [];
        return TmdbApi.list(tmdbPath, row.mediaType);
      }

      final category = row.trackerCategory;
      if (category == null) return const [];
      final tracker = _animeTracker(ref);
      if (tracker == null) return const [];

      final adultMode = ref.watch(contentPrefsProvider).adultContentMode;
      final result = await tracker.getCategoryItems(
        category,
        type: MediaType.ANIME,
        adultMode: adultMode,
        cacheDuration: const Duration(hours: 6),
      );
      return result.items;
    }, name: 'mediaFeedRowProvider');

/// The first item of the leading rail, used for the feed hero.
final mediaFeedHeroProvider =
    FutureProvider.family<UnifiedMedia?, MediaType>((ref, type) async {
      final rows = ref.watch(mediaFeedRowsProvider(type));
      if (rows.isEmpty) return null;
      final items = await ref.watch(mediaFeedRowProvider(rows.first).future);
      return items.firstOrNull;
    }, name: 'mediaFeedHeroProvider');
