import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:anifox/common/models/ui_style_enums.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/common/state/ui_prefs_provider.dart';
import 'package:anifox/common/widgets/app_scaffold.dart';
import 'package:anifox/common/widgets/unified_search_bar.dart';
import 'package:anifox/core/router/app_navigator.dart';
import 'package:anifox/modules/browse/state/unified_search_provider.dart';
import 'package:anifox/modules/browse/ui/widgets/cards/media_card.dart';

/// One search box for anime, manga, movies and TV.
class UnifiedSearchScreen extends ConsumerStatefulWidget {
  const UnifiedSearchScreen({super.key});

  @override
  ConsumerState<UnifiedSearchScreen> createState() =>
      _UnifiedSearchScreenState();
}

class _UnifiedSearchScreenState extends ConsumerState<UnifiedSearchScreen> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  Timer? _debounce;

  String _query = '';
  MediaType? _type;

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      if (!mounted) return;
      setState(() => _query = value);
    });
  }

  @override
  Widget build(BuildContext context) {
    final args = UnifiedSearchArgs(query: _query, type: _type);

    return AppScaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            UnifiedSearchBar(
              controller: _controller,
              focusNode: _focusNode,
              autofocus: true,
              hasFilters: false,
              hintText: 'Search anime, manga, movies and TV...',
              onChanged: _onChanged,
              onSubmitted: (value) {
                _debounce?.cancel();
                setState(() => _query = value);
              },
              onBackPressed: () {
                if (context.canPop()) {
                  context.pop();
                } else {
                  context.go('/home');
                }
              },
              onClearPressed: () {
                _controller.clear();
                _debounce?.cancel();
                setState(() => _query = '');
              },
            ),
            _TypeChips(
              selected: _type,
              onChanged: (type) => setState(() => _type = type),
            ),
            Expanded(child: _buildResults(args)),
          ],
        ),
      ),
    );
  }

  Widget _buildResults(UnifiedSearchArgs args) {
    if (args.isEmpty) {
      return const _EmptyState(
        icon: Icons.search_rounded,
        message: 'Search across anime, manga, movies and TV.',
      );
    }

    return ref
        .watch(unifiedSearchProvider(args))
        .when(
          data: (items) {
            if (items.isEmpty) {
              return const _EmptyState(
                icon: Icons.sentiment_dissatisfied_outlined,
                message: 'No results found. Try another title.',
              );
            }
            return _SearchGrid(items: items);
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => _EmptyState(
            icon: Icons.cloud_off_outlined,
            message: 'Search failed. Check your connection and try again.',
            action: FilledButton(
              onPressed: () =>
                  ref.invalidate(unifiedSearchProvider(args)),
              child: const Text('Retry'),
            ),
          ),
        );
  }
}

class _TypeChips extends StatelessWidget {
  final MediaType? selected;
  final ValueChanged<MediaType?> onChanged;

  const _TypeChips({required this.selected, required this.onChanged});

  static const _options = <(String, MediaType?)>[
    ('All', null),
    ('Anime', MediaType.ANIME),
    ('Movies', MediaType.MOVIE),
    ('TV', MediaType.TV),
    ('Manga', MediaType.MANGA),
  ];

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 46,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        itemCount: _options.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final (label, type) = _options[index];
          return ChoiceChip(
            label: Text(label),
            selected: selected == type,
            onSelected: (_) => onChanged(type),
          );
        },
      ),
    );
  }
}

class _SearchGrid extends ConsumerWidget {
  final List<UnifiedMedia> items;

  const _SearchGrid({required this.items});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final style = ref.watch(uiPrefsProvider.select((s) => s.cardStyle));
    final isWideMode = ref.watch(
      uiPrefsProvider.select((s) => s.isMediaCardWide(style.name)),
    );
    final layout = style.getScaledLayout(
      GlobalUI.uiScaleFactor,
      isWideMode: isWideMode,
    );

    return CustomScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(12, 6, 12, 140),
          sliver: SliverGrid(
            gridDelegate: SliverGridDelegateWithMinCrossAxisExtent(
              minCrossAxisExtent: layout.width,
              childAspectRatio: layout.aspectRatio,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
            ),
            delegate: SliverChildBuilderDelegate((context, index) {
              final media = items[index];
              final tag = 'search-${media.type.id}-${media.id}';
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
            }, childCount: items.length),
          ),
        ),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  final Widget? action;

  const _EmptyState({
    required this.icon,
    required this.message,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 44, color: theme.colorScheme.onSurfaceVariant),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            if (action != null) ...[const SizedBox(height: 16), action!],
          ],
        ),
      ),
    );
  }
}
