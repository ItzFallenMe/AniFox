import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:anifox/core/router/app_navigator.dart';
import 'package:anifox/modules/browse/ui/widgets/rows/horizontal_section.dart';
import 'package:anifox/modules/library/models/models/library_entry.dart';
import 'package:anifox/modules/library/state/cloud_library_provider.dart';
import 'package:anifox/modules/library/state/library_view_provider.dart';
import 'package:anifox/modules/tracking/models/models/tracked_status.dart';
import 'package:anifox/modules/tracking/models/models/tracker_type.dart';
import 'package:anifox/modules/tv/ui/screens/tv_home_screen.dart';
import 'package:anifox/modules/tv/ui/widgets/tv_media_card.dart';
import 'package:anifox/common/models/unified_media.dart';

class TvLibraryRow extends ConsumerWidget {
  final String title;
  final TrackedStatus status;
  final TrackerType targetTracker;
  final MediaType? targetMediaType;
  final double height;

  const TvLibraryRow({
    super.key,
    required this.title,
    required this.status,
    required this.targetTracker,
    this.targetMediaType,
    this.height = 210.0,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isLocal = targetTracker == TrackerType.local;
    final mediaType = targetMediaType ?? MediaType.ANIME;

    final asyncData = isLocal
        ? ref.watch(
            localLibraryListProvider((status: status, mediaType: mediaType)),
          )
        : ref.watch(
            cloudLibraryProvider((
              status: status,
              trackerType: targetTracker,
              mediaType: mediaType,
            )),
          );

    if (asyncData.value?.isEmpty == true) {
      return const SizedBox.shrink();
    }

    return HorizontalSection<LibraryEntry>(
      title: title,
      height: height,
      emptyText: 'No items in this list.',
      data: asyncData,
      itemBuilder: (context, entry) {
        final media = entry.toUnifiedMedia();
        final tag = 'tv-library-$status-${entry.providerId}';

        return TvMediaCard(
          title: entry.title,
          cover: entry.cover,
          banner: media.banner,
          score: entry.score ?? media.score,
          progress: entry.episodesWatched > 0 ? entry.episodesWatched : null,
          totalEpisodes: entry.episodes ?? media.episodes,
          format: entry.format ?? media.format,
          status: entry.status ?? media.status,
          description: media.description,
          genres: media.genres,
          year: media.year,
          onFocused: () {
            final backdrop = (media.banner != null && media.banner!.isNotEmpty)
                ? media.banner
                : entry.cover;
            if (backdrop?.isNotEmpty == true) {
              ref
                  .read(tvFocusedBackdropProvider.notifier)
                  .setBackdrop(backdrop);
            }
          },
          onTap: () => context.pushDetails(
            mediaType: media.type,
            media: media,
            tag: tag,
          ),
        );
      },
    );
  }
}
