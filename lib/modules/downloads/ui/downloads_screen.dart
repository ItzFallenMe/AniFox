import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:open_file/open_file.dart';

import 'package:anifox/modules/downloads/data/download_store.dart';
import 'package:anifox/modules/downloads/models/download_task.dart';
import 'package:anifox/modules/downloads/state/downloads_provider.dart';

enum _DownloadFilter { all, active, ready }

class DownloadsScreen extends ConsumerStatefulWidget {
  const DownloadsScreen({super.key});

  @override
  ConsumerState<DownloadsScreen> createState() => _DownloadsScreenState();
}

class _DownloadsScreenState extends ConsumerState<DownloadsScreen> {
  _DownloadFilter _filter = _DownloadFilter.all;

  Future<void> _refresh() async {
    ref.invalidate(downloadsProvider);
    await ref.read(downloadsProvider.future);
  }

  @override
  Widget build(BuildContext context) {
    final downloads = ref.watch(downloadsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Downloads'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: _refresh,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: downloads.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => _ErrorState(message: '$error', onRetry: _refresh),
        data: (tasks) {
          final active = tasks.where((task) => task.isActive).length;
          final ready = tasks
              .where((task) => task.status == DownloadStatus.completed)
              .length;
          final visible = switch (_filter) {
            _DownloadFilter.all => tasks,
            _DownloadFilter.active =>
              tasks.where((task) => task.isActive).toList(),
            _DownloadFilter.ready =>
              tasks
                  .where((task) => task.status == DownloadStatus.completed)
                  .toList(),
          };

          return RefreshIndicator(
            onRefresh: _refresh,
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                  sliver: SliverToBoxAdapter(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _StorageCard(
                          total: tasks.length,
                          active: active,
                          ready: ready,
                        ),
                        const SizedBox(height: 18),
                        _FilterBar(
                          filter: _filter,
                          counts: {
                            _DownloadFilter.all: tasks.length,
                            _DownloadFilter.active: active,
                            _DownloadFilter.ready: ready,
                          },
                          onChanged: (value) => setState(() => _filter = value),
                        ),
                        const SizedBox(height: 14),
                      ],
                    ),
                  ),
                ),
                if (tasks.isEmpty)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: _EmptyDownloads(onBrowse: () => context.go('/')),
                  )
                else if (visible.isEmpty)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: _FilterEmpty(filter: _filter),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                    sliver: SliverList.separated(
                      itemCount: visible.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) =>
                          _DownloadTile(task: visible[index]),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _StorageCard extends StatelessWidget {
  final int total;
  final int active;
  final int ready;

  const _StorageCard({
    required this.total,
    required this.active,
    required this.ready,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [cs.primary.withValues(alpha: 0.16), cs.surfaceContainerLow],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cs.primary.withValues(alpha: 0.18)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: cs.primary.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.folder_rounded, size: 20, color: cs.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Saved on this device',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      DownloadStore.folderLabel,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                        fontFeatures: const [FontFeature.tabularFigures()],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _Stat(value: '$total', label: 'Total'),
              _Stat(value: '$active', label: 'Downloading'),
              _Stat(value: '$ready', label: 'Ready'),
            ],
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String value;
  final String label;

  const _Stat({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
          Text(
            label,
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterBar extends StatelessWidget {
  final _DownloadFilter filter;
  final Map<_DownloadFilter, int> counts;
  final ValueChanged<_DownloadFilter> onChanged;

  const _FilterBar({
    required this.filter,
    required this.counts,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    const labels = {
      _DownloadFilter.all: 'All',
      _DownloadFilter.active: 'Downloading',
      _DownloadFilter.ready: 'Ready',
    };

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: cs.outlineVariant.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          for (final entry in labels.entries)
            Expanded(
              child: Semantics(
                selected: filter == entry.key,
                button: true,
                child: InkWell(
                  borderRadius: BorderRadius.circular(999),
                  onTap: () => onChanged(entry.key),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    height: 34,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: filter == entry.key
                          ? cs.primary
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      '${entry.value} ${counts[entry.key] ?? 0}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: filter == entry.key
                            ? cs.onPrimary
                            : cs.onSurfaceVariant,
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _DownloadTile extends ConsumerWidget {
  final DownloadTask task;

  const _DownloadTile({required this.task});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final notifier = ref.read(downloadsProvider.notifier);

    final (statusLabel, statusColor) = switch (task.status) {
      DownloadStatus.queued => ('Queued', cs.onSurfaceVariant),
      DownloadStatus.downloading => (
        '${(task.progress * 100).round()}% downloaded',
        cs.primary,
      ),
      DownloadStatus.completed => ('Ready to watch', cs.primary),
      DownloadStatus.failed => ('Failed', cs.error),
      DownloadStatus.canceled => ('Canceled', cs.onSurfaceVariant),
    };

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: cs.outlineVariant.withValues(alpha: 0.22)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: cs.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(
                  switch (task.status) {
                    DownloadStatus.completed => Icons.play_circle_fill_rounded,
                    DownloadStatus.failed => Icons.error_outline_rounded,
                    _ => Icons.downloading_rounded,
                  },
                  size: 22,
                  color: task.status == DownloadStatus.failed
                      ? cs.error
                      : cs.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      task.mediaTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      [
                        if (task.episodeLabel.isNotEmpty) task.episodeLabel,
                        if (task.sourceName.isNotEmpty) task.sourceName,
                        if (task.status == DownloadStatus.completed)
                          _formatDate(task.createdAt),
                      ].join(' · '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              _TaskMenu(task: task, notifier: notifier),
            ],
          ),
          if (task.isActive) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: LinearProgressIndicator(
                value: task.totalUnits > 0 ? task.progress : null,
                minHeight: 5,
                backgroundColor: cs.surfaceContainerHighest,
              ),
            ),
          ],
          if (task.error != null) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: cs.errorContainer.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                task.error!,
                style: theme.textTheme.bodySmall?.copyWith(color: cs.error),
              ),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  color: statusColor,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 7),
              Expanded(
                child: Text(
                  statusLabel,
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: statusColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              if (task.status == DownloadStatus.completed)
                FilledButton.tonalIcon(
                  onPressed: () => _open(context),
                  icon: const Icon(Icons.play_arrow_rounded, size: 18),
                  label: const Text('Play'),
                ),
              if (task.status == DownloadStatus.failed ||
                  task.status == DownloadStatus.canceled)
                TextButton(
                  onPressed: () => notifier.remove(task.id),
                  child: const Text('Remove'),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _open(BuildContext context) async {
    final file = File(task.filePath);
    if (!await file.exists()) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('The downloaded file is missing.')),
        );
      }
      return;
    }
    final result = await OpenFile.open(task.filePath);
    if (result.type != ResultType.done && context.mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(result.message)));
    }
  }

  static String _formatDate(DateTime value) {
    final now = DateTime.now();
    final diff = now.difference(value);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${value.day}/${value.month}/${value.year}';
  }
}

class _TaskMenu extends StatelessWidget {
  final DownloadTask task;
  final DownloadsNotifier notifier;

  const _TaskMenu({required this.task, required this.notifier});

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      tooltip: 'Download options',
      icon: const Icon(Icons.more_vert_rounded, size: 20),
      onSelected: (value) async {
        if (value == 'cancel') {
          await notifier.cancel(task.id);
        } else if (value == 'delete') {
          final confirmed = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('Delete download?'),
              content: Text(
                'This removes ${task.mediaTitle} '
                '${task.episodeLabel} from the device.',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('Keep'),
                ),
                FilledButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text('Delete'),
                ),
              ],
            ),
          );
          if (confirmed == true) await notifier.remove(task.id);
        }
      },
      itemBuilder: (context) => [
        if (task.isActive)
          const PopupMenuItem(value: 'cancel', child: Text('Cancel download')),
        const PopupMenuItem(value: 'delete', child: Text('Delete')),
      ],
    );
  }
}

class _EmptyDownloads extends StatelessWidget {
  final VoidCallback onBrowse;

  const _EmptyDownloads({required this.onBrowse});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(32, 40, 32, 80),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: cs.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.download_for_offline_outlined,
                size: 30,
                color: cs.primary,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'No downloads yet',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              'Open any episode, tap download in the player, and pick a '
              'quality. AniFox keeps the file here for offline viewing.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: cs.onSurfaceVariant,
                height: 1.5,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: onBrowse,
              icon: const Icon(Icons.explore_outlined, size: 18),
              label: const Text('Browse titles'),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterEmpty extends StatelessWidget {
  final _DownloadFilter filter;

  const _FilterEmpty({required this.filter});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(32, 32, 32, 80),
        child: Text(
          filter == _DownloadFilter.active
              ? 'Nothing is downloading right now.'
              : 'No finished downloads yet.',
          textAlign: TextAlign.center,
          style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.folder_off_outlined, size: 40, color: cs.error),
            const SizedBox(height: 12),
            const Text(
              'Could not read downloads',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12.5),
            ),
            const SizedBox(height: 16),
            OutlinedButton(onPressed: onRetry, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}
