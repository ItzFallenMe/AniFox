import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:isar_community/isar.dart';
import 'package:anifox/common/state/database_provider.dart';
import 'package:anifox/modules/library/models/models/library_entry.dart';
import 'package:anifox/modules/tracking/models/models/tracked_status.dart';
import 'package:anifox/common/models/unified_media.dart';

final libraryRepositoryProvider = Provider((ref) {
  final isar = ref.watch(databaseProvider);
  return LibraryRepository(isar);
});

class LibraryRepository {
  final Isar _isar;

  LibraryRepository(this._isar);

  Future<void> addToLibrary(LibraryEntry entry) async {
    await _isar.writeTxn(() async {
      await _isar.libraryEntrys.put(entry);
    });
  }

  Future<void> updateLibraryEntry(LibraryEntry entry) async {
    await _isar.writeTxn(() async {
      await _isar.libraryEntrys.putByProviderIdType(entry);
    });
  }

  Future<void> removeFromLibrary(String providerId, String type) async {
    await _isar.writeTxn(() async {
      await _isar.libraryEntrys.deleteByProviderIdType(providerId, type);
    });
  }

  Stream<List<LibraryEntry>> watchLibrary({
    required TrackedStatus status,
    required MediaType mediaType,
  }) {
    return _isar.libraryEntrys
        .where()
        .filter()
        .statusEqualTo(status.id)
        .typeEqualTo(mediaType.id)
        .sortByAddedAtDesc()
        .watch(fireImmediately: true);
  }
}
