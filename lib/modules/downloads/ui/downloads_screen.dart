import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:open_file/open_file.dart';

import 'package:anifox/modules/downloads/models/download_task.dart';
import 'package:anifox/modules/downloads/state/downloads_provider.dart';

class DownloadsScreen extends ConsumerWidget {
  const DownloadsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final downloads = ref.watch(downloadsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Downloads')),
      body: downloads.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              'Could not read downloads.\n$error',
              textAlign: TextAlign.center,
            ),
          ),
        ),
        data: (tasks) {
          if (tasks.isEmpty) {
            return const _EmptyDownloads();
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            itemCount: tasks.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) =>
                _DownloadTile(task: tasks[index]),
          );
        },
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
        'Downloading ${(task.progress * 100).round()}%',
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
        border: Border.all(color: cs.outlineVariant.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: cs.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  task.status == DownloadStatus.completed
                      ? Icons.download_done_rounded
                      : Icons.downloading_rounded,
                  color: cs.primary,
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
                    const SizedBox(height: 2),
                    Text(
                      [
                        if (task.episodeLabel.isNotEmpty) task.episodeLabel,
                        if (task.sourceName.isNotEmpty) task.sourceName,
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
              PopupMenuButton<String>(
                onSelected: (value) {
                  if (value == 'delete') {
                    notifier.remove(task.id);
                  } else if (value == 'cancel') {
                    notifier.cancel(task.id);
                  }
                },
                itemBuilder: (context) => [
                  if (task.isActive)
                    const PopupMenuItem(
                      value: 'cancel',
                      child: Text('Cancel download'),
                    ),
                  const PopupMenuItem(
                    value: 'delete',
                    child: Text('Delete'),
                  ),
                ],
              ),
            ],
          ),
          if (task.isActive) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: LinearProgressIndicator(
                value: task.totalUnits > 0 ? task.progress : null,
                minHeight: 5,
              ),
            ),
          ],
          if (task.error != null) ...[
            const SizedBox(height: 8),
            Text(
              task.error!,
              style: theme.textTheme.bodySmall?.copyWith(color: cs.error),
            ),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              Text(
                statusLabel,
                style: theme.textTheme.labelMedium?.copyWith(
                  color: statusColor,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              if (task.status == DownloadStatus.completed)
                FilledButton.tonalIcon(
                  onPressed: () => _open(context),
                  icon: const Icon(Icons.play_arrow_rounded, size: 18),
                  label: const Text('Play'),
                ),
              if (task.status == DownloadStatus.failed)
                TextButton.icon(
                  onPressed: () => notifier.remove(task.id),
                  icon: const Icon(Icons.delete_outline_rounded, size: 18),
                  label: const Text('Remove'),
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result.message)),
      );
    }
  }
}

class _EmptyDownloads extends StatelessWidget {
  const _EmptyDownloads();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.download_for_offline_outlined, size: 48, color: cs.primary),
            const SizedBox(height: 14),
            const Text(
              'No downloads yet',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Text(
              'Start an episode and tap the download button in the player. '
              'AniFox will capture the stream and save it for offline viewing.',
              textAlign: TextAlign.center,
              style: TextStyle(color: cs.onSurfaceVariant, height: 1.5),
            ),
          ],
        ),
      ),
    );
  }
}
