import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:anifox/core/router/app_navigator.dart';

import 'package:anifox/modules/browse/models/media_args.dart';
import 'package:anifox/modules/browse/ui/widgets/episodes_panel/episode_list_panel.dart';

import 'package:anifox/modules/browse/state/matched_media_provider.dart';
import 'package:anifox/modules/browse/state/media_preference_provider.dart';
import 'package:anifox/modules/history/state/history_provider.dart';
import 'package:anifox/modules/playback/models/player_mode.dart';
import 'package:anifox/modules/reader/models/reader_mode.dart';
import 'package:anifox/common/models/unified_episode.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/modules/browse/state/episodes_provider.dart';
import 'package:anifox/common/widgets/app_bottom_sheet.dart';
import 'package:anifox/common/widgets/app_focus_hover.dart';
import 'package:anifox/common/widgets/source_selector_list.dart';
import 'package:anifox/common/widgets/smart_image.dart';
import 'package:anifox/common/widgets/staggered_fade_in.dart';
import 'package:anifox/core/widgets/cloudflare_webview.dart';
import 'package:anifox/streaming/models/stream_source.dart';
import 'package:anifox/streaming/utils/media_type_utils.dart';
import 'package:anifox/modules/tracking/state/tracking_prefs_provider.dart';
import 'package:anifox/common/state/theme_prefs_provider.dart';

class EpisodesTabWidget extends ConsumerStatefulWidget {
  const EpisodesTabWidget({super.key, required this.media});

  final UnifiedMedia media;

  @override
  ConsumerState<EpisodesTabWidget> createState() => _EpisodesTabWidgetState();
}

class _EpisodesTabWidgetState extends ConsumerState<EpisodesTabWidget>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);

    final cs = Theme.of(context).colorScheme;
    final sourcesAsync = ref.watch(widget.media.type.availableSourcesProvider);

    if (sourcesAsync.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final sources = sourcesAsync.value ?? [];

    if (sources.isEmpty) {
      return _NoStreamsPlaceholder(mediaType: widget.media.type);
    }

    return Column(
      children: [
        if (widget.media.sourceId == null) ...[
          StaggeredFadeIn(
            index: 0,
            child: _EpisodesHeader(media: widget.media),
          ),

          Container(
            width: double.maxFinite,
            height: 1,
            color: cs.surfaceContainerHighest,
          ),
        ],
        Expanded(
          child: EpisodeListPanel(
            media: widget.media,
            useScrollController: false,
            onEpisodeTap: (UnifiedEpisode episode, StreamSource sourceInfo) {
              if (widget.media.type == MediaType.MANGA ||
                  widget.media.type == MediaType.NOVEL) {
                final historyEntries =
                    ref.read(historyForMediaProvider(widget.media.id)).value ??
                    [];
                final historyEntry = historyEntries
                    .where((e) => e.itemNumber == episode.number)
                    .firstOrNull;

                final int startPosition;
                if (historyEntry != null &&
                    historyEntry.progress > 0 &&
                    historyEntry.progress <= historyEntry.total) {
                  startPosition = historyEntry.progress.toInt();
                } else {
                  startPosition = 1;
                }

                context.pushReader(
                  ReaderModeOnline(
                    media: widget.media,
                    episode: episode,
                    sourceInfo: sourceInfo,
                    startPosition: startPosition,
                  ),
                );
              } else {
                final historyEntries =
                    ref.read(historyForMediaProvider(widget.media.id)).value ??
                    [];
                final historyEntry = historyEntries
                    .where((e) => e.itemNumber == episode.number)
                    .firstOrNull;

                final threshold = ref.read(trackingPrefsProvider).syncThreshold;
                final isFinished =
                    historyEntry != null &&
                    historyEntry.total > 0 &&
                    historyEntry.progress >= historyEntry.total * threshold;

                final Duration? startPosition;
                if (historyEntry != null &&
                    historyEntry.progress > 0 &&
                    !isFinished) {
                  startPosition = Duration(
                    milliseconds: historyEntry.progress.toInt(),
                  );
                } else {
                  startPosition = null;
                }

                context.pushPlayer(
                  PlayerModeOnline(
                    media: widget.media,
                    episode: episode,
                    sourceInfo: sourceInfo,
                    startPosition: startPosition,
                  ),
                );
              }
            },
          ),
        ),
      ],
    );
  }
}

class _EpisodesHeader extends ConsumerWidget {
  final UnifiedMedia media;

  const _EpisodesHeader({required this.media});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final textTheme = theme.textTheme;

    final availableSources =
        ref.watch(media.type.availableSourcesProvider).value ?? [];

    if (availableSources.isEmpty) {
      return const SizedBox.shrink();
    }

    final matchArgs = MediaArgs.fromMedia(media);
    final sourceState = ref.watch(mediaPreferenceProvider(matchArgs)).value;

    final matchedMediaState = ref.watch(matchedMediaProvider(matchArgs));

    final activeSourceInfo =
        sourceState?.sourceInfo ?? matchedMediaState.value?.sourceInfo;
    final sourceName = activeSourceInfo?.name ?? 'Unknown';

    final isMatchingNewSource =
        sourceState != null &&
        matchedMediaState.value != null &&
        matchedMediaState.value!.sourceInfo.id != sourceState.sourceInfo.id;

    final String matchedTitle;
    final bool hasError = matchedMediaState.hasError;

    if (hasError) {
      matchedTitle = 'Failed to match';
    } else if (matchedMediaState.isLoading ||
        isMatchingNewSource ||
        (matchedMediaState.value?.isLoading ?? false)) {
      matchedTitle = 'Searching...';
    } else {
      matchedTitle =
          matchedMediaState.value?.matchedMedia?.title ?? 'No match found';
    }

    final String? sourceIconUrl = activeSourceInfo?.iconUrl;

    final iconWidget = Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: hasError ? cs.errorContainer : cs.secondaryContainer,
      ),
      clipBehavior: Clip.antiAlias,
      child: hasError
          ? Icon(
              Icons.error_outline_rounded,
              size: 18,
              color: cs.onErrorContainer,
            )
          : (sourceIconUrl != null && sourceIconUrl.isNotEmpty)
          ? SmartImage(
              imageUrl: sourceIconUrl,
              fit: BoxFit.cover,
              errorWidget: (context, url, error) => Icon(
                Icons.auto_awesome_rounded,
                size: 18,
                color: cs.onSecondaryContainer,
              ),
            )
          : Icon(
              Icons.auto_awesome_rounded,
              size: 18,
              color: cs.onSecondaryContainer,
            ),
    );

    final titleWidget = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              hasError ? 'ERROR' : 'MATCHED',
              style: textTheme.labelMedium?.copyWith(
                color: hasError ? cs.error : cs.primary,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.3,
              ),
            ),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                '· $sourceName',
                style: textTheme.labelMedium?.copyWith(
                  color: cs.onSurfaceVariant.withValues(alpha: 0.7),
                  fontWeight: FontWeight.w500,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        Text(
          matchedTitle,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: hasError ? cs.error : null,
          ),
        ),
      ],
    );

    final buttonsWidget = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _HeaderButton(
          icon: Icons.swap_horiz_rounded,
          label: 'Source',
          onTap: () =>
              _showSourceSelector(context, ref, media, sourceState?.sourceInfo),
        ),
        const SizedBox(width: 8),
        if (activeSourceInfo?.baseUrl.isNotEmpty == true) ...[
          _HeaderButton(
            icon: Icons.security_rounded,
            label: 'CF Bypass',
            onTap: () {
              CloudflareWebView.open(context, activeSourceInfo!.baseUrl);
            },
          ),
          const SizedBox(width: 8),
        ],
      ],
    );

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
      child: LayoutBuilder(
        builder: (context, constraints) {
          if (constraints.maxWidth >= 600) {
            // Desktop/Tablet layout: single row
            return Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                iconWidget,
                const SizedBox(width: 12),
                Expanded(child: titleWidget),
                const SizedBox(width: 16),
                buttonsWidget,
              ],
            );
          } else {
            // Mobile layout: two rows
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    iconWidget,
                    const SizedBox(width: 12),
                    Expanded(child: titleWidget),
                  ],
                ),
                const SizedBox(height: 12),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: buttonsWidget,
                ),
              ],
            );
          }
        },
      ),
    );
  }

  void _showSourceSelector(
    BuildContext context,
    WidgetRef ref,
    UnifiedMedia media,
    StreamSource? currentSource,
  ) {
    final availableSources =
        ref.read(media.type.availableSourcesProvider).value ?? [];

    AppBottomSheet.show(
      context: context,
      title: 'Select Source',
      child: SourceSelectorList(
        availableSources: availableSources,
        currentSource: currentSource,
        mediaType: media.type,
        onSourceSelected: (sheetContext, source) {
          final matchArgs = MediaArgs.fromMedia(media);
          ref
              .read(mediaPreferenceProvider(matchArgs).notifier)
              .updateSource(source);
          Navigator.pop(sheetContext);
        },
        onSettingsClosed: () {
          if (media.sourceId != null) {
            ref.invalidate(
              sourceEpisodesProvider((
                providerId: media.id,
                sourceId: media.sourceId!,
                sourceType: null,
                type: media.type,
                episodeCount: media.episodes,
                season: int.tryParse(media.season ?? ''),
              )),
            );
          }
        },
      ),
    );
  }
}

class _HeaderButton extends ConsumerWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _HeaderButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final r = ref.watch(
      themePrefsProvider.select((s) => s.uiRoundness),
    );
    final radius = BorderRadius.circular(r);

    return AppFocusHover(
      onTap: onTap,
      scaleFactor: 1.05,
      builder: (context, isFocused, isHovered) {
        final active = isFocused || isHovered;
        return Material(
          color: active
              ? cs.primary
              : cs.surfaceContainerHighest.withValues(alpha: 0.6),
          borderRadius: radius,
          clipBehavior: Clip.antiAlias,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: radius,
              border: Border.all(
                color: active ? Colors.white : Colors.transparent,
                width: 1.5,
              ),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  icon,
                  size: 16,
                  color: active ? cs.onPrimary : cs.onSurfaceVariant,
                ),
                const SizedBox(width: 6),
                Text(
                  label,
                  style: textTheme.labelMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: active ? cs.onPrimary : cs.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _NoStreamsPlaceholder extends ConsumerWidget {
  final MediaType mediaType;
  const _NoStreamsPlaceholder({required this.mediaType});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 68,
              height: 68,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: cs.primaryContainer,
              ),
              child: Icon(
                Icons.cloud_off_rounded,
                size: 30,
                color: cs.onPrimaryContainer,
              ),
            ),
            const SizedBox(height: 18),
            Text(
              'No streams available',
              textAlign: TextAlign.center,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              mediaType == MediaType.MANGA
                  ? 'Manga browsing is not available in this build yet.'
                  : 'No streaming hosts are available for this title.',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: cs.onSurfaceVariant.withValues(alpha: 0.75),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
