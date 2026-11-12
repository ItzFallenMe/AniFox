import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart' as p;

import 'package:anifox/modules/downloads/data/download_store.dart';
import 'package:anifox/modules/downloads/data/hls_downloader.dart';
import 'package:anifox/modules/downloads/models/download_task.dart';

class DownloadsNotifier extends AsyncNotifier<List<DownloadTask>> {
  final DownloadStore _store = DownloadStore();
  final HlsDownloader _downloader = HlsDownloader();
  final Set<String> _canceled = {};

  @override
  Future<List<DownloadTask>> build() async {
    final tasks = await _store.load();
    return [
      for (final task in tasks)
        task.isActive
            ? task.copyWith(
                status: DownloadStatus.failed,
                error: 'Interrupted when the app closed.',
              )
            : task,
    ];
  }

  List<DownloadTask> get _tasks => state.value ?? const [];

  Future<DownloadTask> start({
    required String url,
    required String mediaTitle,
    required String episodeLabel,
    required String sourceName,
    Map<String, String> headers = const {},
  }) async {
    final id = DateTime.now().millisecondsSinceEpoch.toString();
    final directory = await _store.directory();
    final task = DownloadTask(
      id: id,
      mediaTitle: mediaTitle,
      episodeLabel: episodeLabel,
      sourceName: sourceName,
      url: url,
      filePath: p.join(directory.path, '$id.mp4'),
      createdAt: DateTime.now(),
    );

    state = AsyncData([task, ..._tasks]);
    await _store.save(_tasks);
    unawaited(_run(task, headers));
    return task;
  }

  Future<void> _run(
    DownloadTask task,
    Map<String, String> headers,
  ) async {
    _replace(task.copyWith(status: DownloadStatus.downloading, clearError: true));
    await _store.save(_tasks);

    try {
      await _downloader.download(
        url: task.url,
        outputPath: task.filePath,
        headers: headers,
        isCanceled: () => _canceled.contains(task.id),
        onProgress: (completed, total) {
          final current = _find(task.id);
          if (current == null) return;
          _replace(
            current.copyWith(
              completedUnits: completed,
              totalUnits: total,
              status: DownloadStatus.downloading,
            ),
          );
          if (completed % 10 == 0 || completed == total) {
            unawaited(_store.save(_tasks));
          }
        },
      );

      final current = _find(task.id);
      if (current == null) return;

      if (_canceled.remove(task.id)) {
        await _store.deleteFiles(current);
        _replace(
          current.copyWith(status: DownloadStatus.canceled, completedUnits: 0),
        );
      } else {
        _replace(
          current.copyWith(
            status: DownloadStatus.completed,
            completedUnits: current.totalUnits,
          ),
        );
      }
      await _store.save(_tasks);
    } on HlsCanceledException {
      final current = _find(task.id);
      _canceled.remove(task.id);
      if (current != null) {
        await _store.deleteFiles(current);
        _replace(current.copyWith(status: DownloadStatus.canceled));
      }
      await _store.save(_tasks);
    } catch (error) {
      final current = _find(task.id);
      _canceled.remove(task.id);
      if (current != null) {
        await _store.deleteFiles(current);
        _replace(
          current.copyWith(
            status: DownloadStatus.failed,
            error: error is HlsDownloadException
                ? error.message
                : 'Download failed. Check the connection and try again.',
          ),
        );
      }
      await _store.save(_tasks);
    }
  }

  Future<void> cancel(String id) async {
    _canceled.add(id);
    final task = _find(id);
    if (task != null && !task.isActive) {
      _replace(task.copyWith(status: DownloadStatus.canceled));
      await _store.save(_tasks);
    }
  }

  Future<void> remove(String id) async {
    _canceled.add(id);
    final task = _find(id);
    if (task == null) return;
    await _store.deleteFiles(task);
    state = AsyncData([..._tasks.where((item) => item.id != id)]);
    await _store.save(_tasks);
  }

  DownloadTask? _find(String id) {
    for (final task in _tasks) {
      if (task.id == id) return task;
    }
    return null;
  }

  void _replace(DownloadTask task) {
    state = AsyncData([
      for (final item in _tasks)
        if (item.id == task.id) task else item,
    ]);
  }
}

final downloadsProvider =
    AsyncNotifierProvider<DownloadsNotifier, List<DownloadTask>>(
      DownloadsNotifier.new,
      name: 'downloadsProvider',
    );
