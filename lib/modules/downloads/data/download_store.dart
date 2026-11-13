import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';

import 'package:anifox/modules/downloads/models/download_task.dart';

/// Persists download metadata as JSON next to the media files.
///
/// Files live in `AniFox/downloads`: the public Downloads folder on desktop,
/// shared storage on Android when access is granted, and app documents
/// elsewhere. Keeping one folder means moving it keeps downloads playable.
class DownloadStore {
  static const folderName = 'AniFox';
  static const folderLabel = 'AniFox/downloads';

  Directory? _cachedDirectory;

  Future<Directory> directory() async {
    final cached = _cachedDirectory;
    if (cached != null) return cached;
    final directory = await _resolveDirectory();
    await directory.create(recursive: true);
    _cachedDirectory = directory;
    return directory;
  }

  Future<Directory> _resolveDirectory() async {
    if (!kIsWeb) {
      if (Platform.isAndroid) {
        final hasStorage =
            await Permission.manageExternalStorage.isGranted ||
            await Permission.storage.isGranted;
        if (hasStorage) {
          return Directory(
            p.join('/storage/emulated/0', folderName, 'downloads'),
          );
        }
      } else if (Platform.isWindows || Platform.isMacOS || Platform.isLinux) {
        final downloads = await getDownloadsDirectory();
        if (downloads != null) {
          return Directory(p.join(downloads.path, folderName, 'downloads'));
        }
      }
    }

    final base = await getApplicationDocumentsDirectory();
    return Directory(p.join(base.path, folderName, 'downloads'));
  }

  Future<File> _indexFile() async {
    final dir = await directory();
    return File(p.join(dir.path, 'downloads.json'));
  }

  Future<List<DownloadTask>> load() async {
    try {
      final file = await _indexFile();
      if (!await file.exists()) return [];
      final raw = await file.readAsString();
      if (raw.trim().isEmpty) return [];
      final decoded = jsonDecode(raw);
      if (decoded is! List) return [];
      return decoded
          .whereType<Map<String, dynamic>>()
          .map(DownloadTask.fromJson)
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> save(List<DownloadTask> tasks) async {
    final file = await _indexFile();
    await file.writeAsString(
      jsonEncode(tasks.map((task) => task.toJson()).toList()),
    );
  }

  Future<String> filePathFor(DownloadTask task) async {
    final dir = await directory();
    return p.join(dir.path, '${task.id}.mp4');
  }

  /// Removes a task's media files, the index entry is handled by the caller.
  Future<void> deleteFiles(DownloadTask task) async {
    for (final path in {task.filePath, if (task.filePath.isNotEmpty) '${task.filePath}.part'}) {
      final file = File(path);
      if (await file.exists()) {
        try {
          await file.delete();
        } catch (_) {}
      }
    }
  }
}
