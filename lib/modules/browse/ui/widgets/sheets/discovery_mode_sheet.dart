import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:anifox/modules/browse/state/discovery_prefs_provider.dart';
import 'package:anifox/modules/tracking/models/models/tracker_type.dart';
import 'package:anifox/modules/tracking/engine/remote_tracker.dart';
import 'package:anifox/modules/tracking/state/tracker_registry.dart';
import 'package:anifox/common/models/ui_style_enums.dart';
import 'package:anifox/common/widgets/app_bottom_sheet.dart';
import 'package:anifox/common/widgets/selection_card_group.dart';

class DiscoveryModeSheet extends ConsumerStatefulWidget {
  const DiscoveryModeSheet({super.key});

  static Future<T?> show<T>(BuildContext context) {
    return showModalBottomSheet<T>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const DiscoveryModeSheet(),
    );
  }

  @override
  ConsumerState<DiscoveryModeSheet> createState() => _DiscoveryModeSheetState();
}

class _DiscoveryModeSheetState extends ConsumerState<DiscoveryModeSheet> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return AppBottomSheet(
      title: 'Discovery Mode',
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 20),

            AnimatedSize(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOutQuart,
              alignment: Alignment.topCenter,
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                switchInCurve: Curves.easeOutCubic,
                switchOutCurve: Curves.easeInCubic,
                child: const _TrackerConfig(key: ValueKey('tracker')),
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: context.pop,
              style: FilledButton.styleFrom(
                backgroundColor: cs.primary,
                foregroundColor: cs.onPrimary,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(GlobalUI.uiRoundness),
                ),
                elevation: 1,
              ),
              child: const Text(
                'Done',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TrackerConfig extends ConsumerWidget {
  const _TrackerConfig({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    final prefs = ref.watch(discoveryPrefsProvider);

    final targetId = prefs.metadataTrackerId;

    final primaryTracker = ref.watch(primaryTrackerProvider);
    final isLocalPrimary = primaryTracker.type == TrackerType.local;
    final autoTrackerType = isLocalPrimary
        ? TrackerType.anilist
        : primaryTracker.type;
    final trackers = ref
        .watch(availableTrackersProvider)
        .whereType<RemoteTracker>()
        .toList();

    return SelectionCardGroup(
      title: 'METADATA TRACKER',
      subtitle:
          'Select the source for trending feeds, search results, and metadata.',
      children: [
        SelectionCardTile(
          isSelected: targetId == null,
          title: 'Auto (${autoTrackerType.displayName})',
          subtitle: isLocalPrimary
              ? 'Local tracker defaults to ${autoTrackerType.displayName} for metadata'
              : 'Matches your primary tracker',
          leading: Icon(
            Icons.sync_rounded,
            size: 24,
            color: targetId == null ? cs.primary : cs.onSurfaceVariant,
          ),
          showDivider: trackers.isNotEmpty,
          onTap: () => ref
              .read(discoveryPrefsProvider.notifier)
              .setMetadataTrackerId(null),
        ),
        ...trackers.asMap().entries.map((entry) {
          final idx = entry.key;
          final tracker = entry.value;
          final isLast = idx == trackers.length - 1;
          final isSelected = tracker.type.id == targetId;

          return SelectionCardTile(
            isSelected: isSelected,
            title: tracker.type.displayName,
            subtitle: 'Use specific tracker metadata',
            leading: tracker.type.getIconWidget(
              size: 24,
              color: isSelected
                  ? cs.primary
                  : cs.onSurfaceVariant.withValues(alpha: 0.7),
            ),
            showDivider: !isLast,
            onTap: () => ref
                .read(discoveryPrefsProvider.notifier)
                .setMetadataTrackerId(tracker.type.id),
          );
        }),
      ],
    );
  }
}

class _CollapsibleSourceGroup extends StatefulWidget {
  final String title;
  final Widget child;
  final bool forceExpand;
  final int activeCount;
  final int totalCount;

  const _CollapsibleSourceGroup({
    required this.title,
    required this.child,
    required this.activeCount,
    required this.totalCount,
  }) : forceExpand = false;

  @override
  State<_CollapsibleSourceGroup> createState() =>
      _CollapsibleSourceGroupState();
}

class _CollapsibleSourceGroupState extends State<_CollapsibleSourceGroup> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final expanded = widget.forceExpand || _isExpanded;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InkWell(
          onTap: () {
            setState(() {
              _isExpanded = !_isExpanded;
            });
          },
          borderRadius: BorderRadius.circular(GlobalUI.uiRoundness * 0.7),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
            child: Row(
              children: [
                Text(
                  widget.title,
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: cs.primary,
                    letterSpacing: 1.1,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: cs.primaryContainer,
                    borderRadius: BorderRadius.circular(
                      GlobalUI.uiRoundness * 0.5,
                    ),
                  ),
                  child: Text(
                    '${widget.activeCount}/${widget.totalCount}',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: cs.onPrimaryContainer,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const Spacer(),
                Icon(
                  expanded
                      ? Icons.keyboard_arrow_up
                      : Icons.keyboard_arrow_down,
                  color: cs.primary,
                  size: 20,
                ),
              ],
            ),
          ),
        ),
        AnimatedSize(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOutQuart,
          child: expanded
              ? Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: widget.child,
                )
              : const SizedBox.shrink(),
        ),
      ],
    );
  }
}
