import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:anifox/modules/tracking/models/models/tracker_type.dart';
import 'package:anifox/modules/tracking/engine/remote_tracker.dart';
import 'package:anifox/modules/tracking/state/tracker_registry.dart';
import 'package:anifox/modules/browse/state/discovery_prefs_provider.dart';

/// The tracker used for browse and details metadata.
///
/// AniFox reads its catalog from TMDB, AniList and MyAnimeList. The selected
/// metadata tracker decides which of those is queried first.
final metadataSourceProvider = Provider<RemoteTracker>((ref) {
  final prefs = ref.watch(discoveryPrefsProvider);
  final targetTrackerId = prefs.metadataTrackerId;

  if (targetTrackerId != null) {
    final targetType = TrackerType.tryFromId(targetTrackerId);
    if (targetType != null) {
      final trackers = ref.watch(availableTrackersProvider);
      try {
        final targetTracker = trackers.firstWhere((t) => t.type == targetType);
        if (targetTracker is RemoteTracker) {
          return targetTracker;
        }
      } catch (_) {}
    }
  }

  // Fallback to primary
  final primary = ref.watch(primaryTrackerProvider);
  if (primary is RemoteTracker) {
    return primary;
  }

  // Local tracker (or any non-remote primary) defaults to AniList for metadata
  final trackers = ref.watch(availableTrackersProvider);
  return trackers.whereType<RemoteTracker>().firstWhere(
    (t) => t.type == TrackerType.anilist,
    orElse: () => trackers.whereType<RemoteTracker>().first,
  );
}, name: 'metadataSourceProvider');
