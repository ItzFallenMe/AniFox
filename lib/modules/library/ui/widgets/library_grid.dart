import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:anifox/core/router/app_navigator.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/common/state/ui_prefs_provider.dart';
import 'package:anifox/common/state/theme_prefs_provider.dart';
import 'package:anifox/modules/browse/ui/widgets/cards/media_card.dart';
import 'package:anifox/modules/library/state/cloud_library_provider.dart';
import 'package:anifox/modules/library/state/library_view_provider.dart';
import 'package:anifox/modules/tracking/models/models/tracker_type.dart';
import 'package:anifox/modules/tracking/state/tracker_profile_provider.dart';
import 'package:anifox/modules/tracking/state/tracking_prefs_provider.dart';
import 'package:anifox/core/utils/responsive.dart';
import 'package:skeletonizer/skeletonizer.dart';

class LibraryGridWidget extends ConsumerWidget {
  const LibraryGridWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final viewState = ref.watch(libraryViewStateProvider);
    final dynamicLibrary = ref.watch(dynamicLibraryProvider);
    final uiState = ref.watch(uiPrefsProvider);
    final cardStyle = uiState.cardStyle;
    final isWideMode = uiState.isMediaCardWide(cardStyle.name);
    final scale = ref.watch(themePrefsProvider).uiScaleFactor;
    final layout = cardStyle.getScaledLayout(scale, isWideMode: isWideMode);

    return dynamicLibrary.when(
      loading: () => Skeletonizer(
        enabled: true,
        child: Padding(
          padding: const EdgeInsets.all(10.0),
          child: GridView.builder(
            padding: const EdgeInsets.only(bottom: 200),
            gridDelegate: SliverGridDelegateWithMinCrossAxisExtent(
              minCrossAxisExtent: layout.width,
              childAspectRatio: layout.aspectRatio,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
            ),
            itemCount: 12,
            itemBuilder: (context, index) {
              return MediaCard(
                media: UnifiedMedia(
                  id: 'skeleton-lib-$index',
                  type: MediaType.ANIME,
                  title: const MediaTitle(english: 'Placeholder Title'),
                  cover: '',
                  format: 'TV',
                  score: 8.5,
                  year: 2026,
                ),
                tag: 'skeleton-lib-$index',
                style: cardStyle,
                onTap: () {},
              );
            },
          ),
        ),
      ),

      error: (err, stack) => Center(child: Text('ERR: $err')),
      data: (entries) {
        if (entries.isEmpty) return const Center(child: Text('Empty List'));

        return NotificationListener<ScrollNotification>(
          onNotification: (ScrollNotification scrollInfo) {
            final primaryTracker = ref.read(
              trackingPrefsProvider.select((s) => s.primaryTracker),
            );
            final isCloudLoggedIn =
                ref.read(trackerProfileProvider)[primaryTracker] != null;
            final isCloud =
                viewState.mode == LibraryMode.cloud &&
                primaryTracker != TrackerType.local &&
                isCloudLoggedIn;

            if (isCloud &&
                scrollInfo.metrics.pixels >=
                    scrollInfo.metrics.maxScrollExtent - 200) {
              ref
                  .read(
                    cloudLibraryProvider((
                      status: viewState.status,
                      trackerType: null,
                      mediaType: viewState.mediaType,
                    )).notifier,
                  )
                  .loadMore();
            }
            return false;
          },
          child: RefreshIndicator(
            onRefresh: () async {
              final primaryTracker = ref.read(
                trackingPrefsProvider.select((s) => s.primaryTracker),
              );
              final isCloudLoggedIn =
                  ref.read(trackerProfileProvider)[primaryTracker] != null;
              final isCloud =
                  viewState.mode == LibraryMode.cloud &&
                  primaryTracker != TrackerType.local &&
                  isCloudLoggedIn;

              if (isCloud) {
                ref
                    .read(
                      cloudLibraryProvider((
                        status: viewState.status,
                        trackerType: null,
                        mediaType: viewState.mediaType,
                      )).notifier,
                    )
                    .refresh();
              } else {
                ref.invalidate(
                  localLibraryListProvider((
                    status: viewState.status,
                    mediaType: viewState.mediaType,
                  )),
                );
              }
            },
            child: Padding(
              padding: const EdgeInsets.all(10.0),
              child: GridView.builder(
                padding: const EdgeInsets.only(bottom: 200),
                gridDelegate: SliverGridDelegateWithMinCrossAxisExtent(
                  minCrossAxisExtent: layout.width,
                  childAspectRatio: layout.aspectRatio,
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                ),
                itemCount: entries.length,
                itemBuilder: (context, index) {
                  final entry = entries[index];
                  final mediaType = entry.type != null
                      ? MediaType.fromId(entry.type!)
                      : viewState.mediaType;
                  final isAnime = mediaType == MediaType.ANIME;
                  final unit = isAnime ? 'Ep' : 'Ch';
                  final watched = entry.episodesWatched;
                  final total = entry.episodes;

                  double? progress;
                  String? progressText;

                  if (watched > 0) {
                    if (total != null && total > 0) {
                      progress = (watched / total).clamp(0.0, 1.0);
                      progressText = '$unit $watched/$total';
                    } else {
                      progressText = '$unit $watched';
                    }
                  }

                  final cardTag =
                      'library__${viewState.status.id}_${entry.providerId}_$index';

                  return MediaCard(
                    media: entry.toUnifiedMedia(),
                    tag: cardTag,
                    style: cardStyle,
                    progress: progress,
                    progressText: progressText,
                    onTap: () {
                      context.pushDetails(
                        mediaType: mediaType,
                        media: entry.toUnifiedMedia(),
                        tag: cardTag,
                      );
                    },
                  );
                },
              ),
            ),
          ),
        );
      },
    );
  }
}
