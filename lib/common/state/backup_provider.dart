import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:anifox/common/state/database_provider.dart';
import 'package:anifox/common/state/storage_provider.dart';
import 'package:anifox/core/services/backup_service.dart';

final backupServiceProvider = Provider<BackupService>((ref) {
  final isar = ref.watch(databaseProvider);
  final prefs = ref.watch(sharedPreferencesProvider);
  return BackupService(isar, prefs);
});
