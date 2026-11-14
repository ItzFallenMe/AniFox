import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/common/state/content_prefs_provider.dart';
import 'package:anifox/modules/browse/data/tmdb_api.dart';
import 'package:anifox/modules/tracking/engine/remote_tracker.dart';
import 'package:anifox/modules/tracking/state/tracker_registry.dart';
import 'package:anifox/streaming/streaming_providers.dart';

@immutable
class UnifiedSearchArgs {
  final String query;
  final MediaType? type;

  const UnifiedSearchArgs({required this.query, this.type});

  bool get isEmpty => query.trim().isEmpty;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is UnifiedSearchArgs && other.query == query && other.type == type;

  @override
  int get hashCode => Object.hash(query, type);
}

/// Searches anime and manga through the trackers and movies/TV through TMDB,
/// then mixes the results so the unified search screen can show one list.
final unifiedSearchProvider = FutureProvider.autoDispose
    .family<List<UnifiedMedia>, UnifiedSearchArgs>((ref, args) async {
      final query = args.query.trim();
      if (query.isEmpty) return const [];

      final trackers = ref
          .watch(availableTrackersProvider)
          .whereType<RemoteTracker>()
          .toList();
      final preferred = ref.watch(metadataSourceProvider);
      final adultMode = ref.watch(contentPrefsProvider).adultContentMode;

      RemoteTracker? trackerFor(MediaType type) {
        if (preferred.supportsMediaType(type)) return preferred;
        for (final tracker in trackers) {
          if (tracker.supportsMediaType(type)) return tracker;
        }
        return null;
      }

      Object? firstError;

      Future<List<UnifiedMedia>> searchTracker(MediaType type) async {
        final tracker = trackerFor(type);
        if (tracker == null) return const [];
        try {
          final result = await tracker.search(
            query,
            type: type,
            adultMode: adultMode,
          );
          return result.items;
        } catch (error) {
          firstError ??= error;
          return const [];
        }
      }

      Future<List<UnifiedMedia>> searchMoviesAndTv() async {
        if (!TmdbApi.isConfigured) return const [];
        try {
          return await TmdbApi.searchMulti(query);
        } catch (error) {
          firstError ??= error;
          return const [];
        }
      }

      final type = args.type;
      final sections = await Future.wait([
        if (type == null || type == MediaType.ANIME)
          searchTracker(MediaType.ANIME),
        if (type == null || type == MediaType.MANGA)
          searchTracker(MediaType.MANGA),
        if (type == null || type == MediaType.MOVIE || type == MediaType.TV)
          searchMoviesAndTv(),
      ]);

      final merged = _interleave([
        for (final section in sections)
          type == null
              ? section
              : section.where((media) => media.type == type).toList(),
      ]);

      if (merged.isEmpty && firstError != null) throw firstError!;
      return merged;
    }, name: 'unifiedSearchProvider');

/// Round-robins the per-source lists so no single source fills the first page.
List<UnifiedMedia> _interleave(List<List<UnifiedMedia>> sections) {
  final merged = <UnifiedMedia>[];
  var index = 0;
  var added = true;

  while (added) {
    added = false;
    for (final section in sections) {
      if (index < section.length) {
        merged.add(section[index]);
        added = true;
      }
    }
    index++;
  }
  return merged;
}
