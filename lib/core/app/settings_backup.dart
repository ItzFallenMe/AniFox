import 'dart:convert';
import 'dart:io';

import 'package:anifox/core/app/logging.dart';
import 'package:anifox/core/app/runtimeDatas.dart';
import 'package:anifox/core/data/preferences.dart';
import 'package:anifox/core/data/settings.dart';
import 'package:anifox/core/data/theme.dart';
import 'package:anifox/core/data/types.dart';
import 'package:file_picker/file_picker.dart';
import 'package:path_provider/path_provider.dart';

/// Export / import app settings as JSON (v2 feature).
///
/// Backup contains: [SettingsModal], [UserPreferencesModal] (sans subtitle
/// binary blobs — they serialise fine as maps), and theme id. Database
/// tokens are intentionally excluded.
class SettingsBackupService {
  static Future<String> exportToFile() async {
    final settings = await Settings().getSettings();
    final prefs = await UserPreferences.getUserPreferences();
    final themeId = await getTheme();
    final payload = {
      'app': 'anifox',
      'version': 2,
      'exportedAt': DateTime.now().toIso8601String(),
      'settings': settings.toMap(),
      'preferences': prefs.toMap(),
      'themeId': themeId,
    };
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/anifox-backup-${DateTime.now().millisecondsSinceEpoch}.json');
    await file.writeAsString(const JsonEncoder.withIndent('  ').convert(payload));
    return file.path;
  }

  static Future<void> importFromFile({String? pickedPath}) async {
    String? path = pickedPath;
    path ??= (await FilePicker.pickFile(
      type: FileType.custom,
      allowedExtensions: ['json'],
    ))
        ?.path;
    if (path == null) throw Exception('No file selected');
    final raw = await File(path).readAsString();
    final decoded = jsonDecode(raw) as Map<String, dynamic>;
    if (decoded['app'] != 'anifox') throw Exception('Not an AniFox backup file');

    final settingsMap = Map<dynamic, dynamic>.from(decoded['settings'] as Map);
    final prefsMap = Map<dynamic, dynamic>.from(decoded['preferences'] as Map? ?? {});
    await Settings().writeSettings(SettingsModal.fromMap(settingsMap));
    currentUserSettings = await Settings().getSettings();
    await UserPreferences.saveUserPreferences(UserPreferencesModal.fromMap(prefsMap));
    final themeId = (decoded['themeId'] as num?)?.toInt();
    if (themeId != null) await setTheme(themeId);
    Logs.app.log('[BACKUP] Imported settings from $path');
  }
}
