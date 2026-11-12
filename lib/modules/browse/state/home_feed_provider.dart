import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:anifox/modules/browse/models/models/home_section.dart';
import 'package:anifox/modules/browse/state/discovery_prefs_provider.dart';
import 'package:anifox/modules/browse/state/home_layout_provider.dart';
import 'package:anifox/modules/tracking/models/models/tracker_category.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/common/state/content_prefs_provider.dart';
import 'package:anifox/streaming/models/stream_source.dart';
import 'package:anifox/streaming/streaming_providers.dart';
import 'package:anifox/modules/browse/state/discovery_tracker_error_provider.dart';
import 'package:anifox/modules/tracking/state/tracker_registry.dart';

class HomeFeedSection {
  final String id;
  final String title;
  final HomeSectionType type;
  final MediaType mediaType;
  final StreamSource? sourceInfo;
  final HomeSection? homeSection;

  const HomeFeedSection({
    required this.id,
    required this.title,
    this.type = HomeSectionType.discovery,
    this.mediaType = MediaType.ANIME,
    this.sourceInfo,
    this.homeSection,
  });

  bool get isDiscovery => type == HomeSectionType.discovery;
  bool get isContinueMedia => type == HomeSectionType.continueMedia;
  bool get isLibraryStatus => type == HomeSectionType.libraryStatus;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is HomeFeedSection &&
        other.id == id &&
        other.title == title &&
        other.type == type &&
        other.mediaType == mediaType &&
        other.sourceInfo?.id == sourceInfo?.id &&
        other.homeSection?.id == homeSection?.id;
  }

  @override
  int get hashCode =>
      Object.hash(id, title, type, mediaType, sourceInfo?.id, homeSection?.id);
}

final homeFeedSectionsProvider = Provider<List<HomeFeedSection>>((ref) {
  final userSections = ref
      .watch(userHomeLayoutProvider)
      .where((s) => !s.disabled)
      .toList();

  return userSections.map((s) {
    return HomeFeedSection(
      id: s.id,
      title: s.title,
      type: s.type,
      mediaType: s.targetMediaType ?? MediaType.ANIME,
      homeSection: s,
    );
  }).toList();
});

final homeSectionFeedProvider =
    FutureProvider.family<
      List<UnifiedMedia>,
      HomeFeedSection
    >(retry: (retryCount, error) => null, (ref, section) async {
      final hs = section.homeSection;
      if (hs == null || hs.type != HomeSectionType.discovery) return const [];

      final tracker = ref.watch(metadataSourceProvider);

      // Guard: don't call a tracker with a media type it doesn't support.
      // This prevents e.g. AniList receiving TV/MOVIE from stale section definitions.
      if (!tracker.supportsMediaType(section.mediaType)) {
        return const [];
      }

      final adultMode = ref.watch(contentPrefsProvider).adultContentMode;
      final category = hs.trackerCategory ?? TrackerCategory.trending;
      final prefs = ref.watch(discoveryPrefsProvider);
      final isAuto = prefs.metadataTrackerId == null;
      final primaryTracker = ref.watch(primaryTrackerProvider);

      try {
        final result = await tracker.getCategoryItems(
          category,
          type: section.mediaType,
          adultMode: adultMode,
          cacheDuration: const Duration(hours: 12),
        );
        return result.items;
      } catch (e) {
        Future.microtask(() {
          ref
              .read(discoveryTrackerErrorProvider.notifier)
              .reportError(
                trackerType: tracker.type,
                error: e,
                isAuto: isAuto,
                primaryTrackerType: primaryTracker.type,
              );
        });
        rethrow;
      }
    });

final homeSpotlightItemsProvider = FutureProvider<List<UnifiedMedia>>(
  retry: (retryCount, error) => null,
  (ref) async {
    final sections = ref.watch(homeFeedSectionsProvider);
    final firstDiscovery = sections.where((s) => s.isDiscovery).firstOrNull;
    if (firstDiscovery == null) return const [];
    return ref.watch(homeSectionFeedProvider(firstDiscovery).future);
  },
);
