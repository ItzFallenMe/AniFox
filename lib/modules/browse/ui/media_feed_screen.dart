import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:anifox/common/models/ui_style_enums.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/common/widgets/app_scaffold.dart';
import 'package:anifox/common/widgets/smart_image.dart';
import 'package:anifox/core/router/app_navigator.dart';
import 'package:anifox/common/state/ui_prefs_provider.dart';
import 'package:anifox/modules/browse/data/tmdb_api.dart';
import 'package:anifox/modules/browse/state/media_feed_provider.dart';
import 'package:anifox/modules/browse/ui/widgets/cards/media_card.dart';
import 'package:anifox/modules/browse/ui/widgets/rows/horizontal_section.dart';

/// Website-style feed for Movies, TV and Anime.
///
/// Movies and TV rails come from TMDB (the same source the website uses), while
/// anime rails use the configured anime tracker.
class MediaFeedScreen extends ConsumerWidget {
  final MediaType mediaType;

  const MediaFeedScreen({super.key, required this.mediaType});

  String get _title => switch (mediaType) {
    MediaType.MOVIE => 'Movies',
    MediaType.TV => 'TV Shows',
    MediaType.ANIME => 'Anime',
    _ => 'Browse',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rows = ref.watch(mediaFeedRowsProvider(mediaType));
    final hero = ref.watch(mediaFeedHeroProvider(mediaType));
    final needsTmdb =
        (mediaType == MediaType.MOVIE || mediaType == MediaType.TV) &&
        !TmdbApi.isConfigured;

    final style = ref.watch(uiPrefsProvider.select((s) => s.cardStyle));
    final isWideMode = ref.watch(
      uiPrefsProvider.select((s) => s.isMediaCardWide(style.name)),
    );
    final layout = style.getScaledLayout(
      GlobalUI.uiScaleFactor,
      isWideMode: isWideMode,
    );

    return AppScaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(mediaFeedHeroProvider(mediaType));
          for (final row in rows) {
            ref.invalidate(mediaFeedRowProvider(row));
          }
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(
            parent: BouncingScrollPhysics(),
          ),
          slivers: [
            SliverToBoxAdapter(child: _FeedHeader(title: _title)),
            if (needsTmdb)
              const SliverToBoxAdapter(child: _MissingTmdbNotice())
            else
              SliverToBoxAdapter(
                child: hero.when(
                  data: (media) => media == null
                      ? const SizedBox.shrink()
                      : _FeedHero(media: media),
                  loading: () => const _HeroSkeleton(),
                  error: (_, __) => const SizedBox.shrink(),
                ),
              ),
            if (!needsTmdb)
              for (final row in rows)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: HorizontalSection<UnifiedMedia>(
                      title: row.title,
                      data: ref.watch(mediaFeedRowProvider(row)),
                      height: layout.height,
                      skeletonCount: 8,
                      onMoreTap: row.trackerCategory == null
                          ? null
                          : () => context.pushDiscover(
                              category: row.trackerCategory!.id,
                              title: row.title,
                              type: MediaType.ANIME,
                            ),
                      itemBuilder: (context, media) {
                        final tag = 'feed-${media.type.id}-${media.id}';
                        return MediaCard(
                          media: media,
                          tag: tag,
                          style: style,
                          onTap: () => context.pushDetails(
                            mediaType: media.type,
                            media: media,
                            tag: tag,
                          ),
                        );
                      },
                    ),
                  ),
                ),
            const SliverToBoxAdapter(child: SizedBox(height: 120)),
          ],
        ),
      ),
    );
  }
}

class _FeedHeader extends StatelessWidget {
  final String title;

  const _FeedHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 10, 8, 6),
        child: Row(
          children: [
            Expanded(
              child: Text(
                title,
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.6,
                ),
              ),
            ),
            IconButton(
              tooltip: 'Search',
              onPressed: () => context.go('/search'),
              icon: const Icon(Icons.search_rounded),
            ),
          ],
        ),
      ),
    );
  }
}

class _FeedHero extends StatelessWidget {
  final UnifiedMedia media;

  const _FeedHero({required this.media});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cover = media.banner ?? media.cover ?? '';
    final tag = 'feed-hero-${media.type.id}-${media.id}';

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 10),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: SizedBox(
          height: 230,
          child: Stack(
            fit: StackFit.expand,
            children: [
              SmartImage(
                imageUrl: cover,
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(
                  color: theme.colorScheme.surfaceContainerHighest,
                ),
                errorWidget: (_, __, ___) => Container(
                  color: theme.colorScheme.surfaceContainerHighest,
                ),
              ),
              const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Colors.black87],
                    stops: [0.25, 1],
                  ),
                ),
              ),
              Positioned(
                left: 16,
                right: 16,
                bottom: 14,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      media.title.getPreferedTitle,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleLarge?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      [
                        if (media.year != null) '${media.year}',
                        if (media.score != null)
                          '★ ${media.score!.toStringAsFixed(1)}',
                        if (media.format != null) media.format!,
                      ].join('  ·  '),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(height: 10),
                    FilledButton.icon(
                      onPressed: () => context.pushDetails(
                        mediaType: media.type,
                        media: media,
                        tag: tag,
                      ),
                      icon: const Icon(Icons.play_arrow_rounded, size: 18),
                      label: const Text('View details'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeroSkeleton extends StatelessWidget {
  const _HeroSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 230,
      margin: const EdgeInsets.fromLTRB(16, 4, 16, 10),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(18),
      ),
    );
  }
}

class _MissingTmdbNotice extends StatelessWidget {
  const _MissingTmdbNotice();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.info_outline, color: theme.colorScheme.primary),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'Movie and TV catalogs are powered by TMDB. Set TMDB_API_KEY '
                '(or ANIFOX_API_URL for the website proxy) when building the app '
                'to load these feeds.',
              ),
            ),
          ],
        ),
      ),
    );
  }
}
