import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:isar_community/isar.dart';
import 'package:anifox/common/state/database_provider.dart';
import 'package:anifox/modules/history/models/models/history_entry.dart';
import 'package:anifox/common/models/unified_media.dart';

class AniFoxLocalMetrics {
  final int streamedSessions;
  final double hoursWatched;
  final int uniqueSeriesTracked;
  final int chaptersRead;

  const AniFoxLocalMetrics({
    required this.streamedSessions,
    required this.hoursWatched,
    required this.uniqueSeriesTracked,
    required this.chaptersRead,
  });
}

final anifoxLocalMetricsProvider =
    FutureProvider.autoDispose<AniFoxLocalMetrics>((ref) async {
      final isar = ref.watch(databaseProvider);
      final entries = await isar.historyEntrys.where().findAll();
      final watchEntries = entries
          .where((e) => e.mediaType == MediaType.ANIME.name)
          .toList();
      final readCount = entries
          .where((e) => e.mediaType != MediaType.ANIME.name)
          .length;

      final totalMillis = watchEntries.fold<double>(
        0.0,
        (prev, e) => prev + e.progress,
      );
      final uniqueSeries = watchEntries.map((e) => e.mediaId).toSet().length;

      return AniFoxLocalMetrics(
        streamedSessions: watchEntries.length,
        hoursWatched: totalMillis / 3600000.0,
        uniqueSeriesTracked: uniqueSeries,
        chaptersRead: readCount,
      );
    }, name: 'anifoxLocalMetricsProvider');
