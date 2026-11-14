import 'package:isar_community/isar.dart';
import 'package:anifox/modules/history/models/models/history_entry.dart';
import 'package:anifox/common/models/unified_media.dart';

class HistoryRepository {
  final Isar _isar;

  HistoryRepository(this._isar);

  Future<void> saveProgress(HistoryEntry entry) async {
    // Only save progress if significant (e.g. for anime > 5s, for manga it's fine)
    if (entry.mediaType == MediaType.ANIME.id && entry.progress < 5000) return;

    await _isar.writeTxn(() async {
      await _isar.historyEntrys.put(entry);
    });
  }

  /// Records the episode selected in an embedded player that has no timestamp
  /// API. Its position is intentionally unknown, so do not fabricate progress.
  Future<void> saveStartedEpisode(HistoryEntry entry) async {
    if (entry.mediaType != MediaType.ANIME.id) return;

    await _isar.writeTxn(() async {
      final previous = await _isar.historyEntrys
          .filter()
          .mediaIdEqualTo(entry.mediaId)
          .itemNumberEqualTo(entry.itemNumber)
          .findFirst();
      if (previous != null) {
        if (previous.progress > entry.progress) {
          entry.progress = previous.progress;
        }
        if (previous.total > entry.total) {
          entry.total = previous.total;
        }
        entry.thumbnailUrl ??= previous.thumbnailUrl;
      }
      await _isar.historyEntrys.put(entry);
    });
  }

  Future<void> deleteEntry(int id) async {
    await _isar.writeTxn(() async {
      await _isar.historyEntrys.delete(id);
    });
  }

  Future<void> deleteByMediaId(String mediaId) async {
    await _isar.writeTxn(() async {
      await _isar.historyEntrys.filter().mediaIdEqualTo(mediaId).deleteAll();
    });
  }

  Future<void> deleteByMediaIds(List<String> mediaIds) async {
    if (mediaIds.isEmpty) return;
    await _isar.writeTxn(() async {
      for (final mediaId in mediaIds) {
        await _isar.historyEntrys.filter().mediaIdEqualTo(mediaId).deleteAll();
      }
    });
  }

  Stream<List<HistoryEntry>> history(String mediaType, {int limit = 10}) {
    return _isar.historyEntrys
        .filter()
        .mediaTypeEqualTo(mediaType)
        .sortByLastUpdatedDesc()
        .limit(limit)
        .watch(fireImmediately: true);
  }

  Stream<List<HistoryEntry>> historyPerMedia(
    String mediaType, {
    int limit = 10,
  }) {
    return _isar.historyEntrys
        .filter()
        .mediaTypeEqualTo(mediaType)
        .sortByLastUpdatedDesc()
        .distinctByMediaId()
        .limit(limit)
        .watch(fireImmediately: true);
  }

  Stream<List<HistoryEntry>> historyForMedia(String mediaId, {int limit = 50}) {
    return _isar.historyEntrys
        .filter()
        .mediaIdEqualTo(mediaId)
        .sortByLastUpdatedDesc()
        .limit(limit)
        .watch(fireImmediately: true);
  }
}
