import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:path/path.dart' as p;
import 'package:isar_community/isar.dart';
import 'package:media_kit/media_kit.dart';
import 'package:path_provider/path_provider.dart';
import 'package:rhttp/rhttp.dart';
import 'package:anifox/core/caching/cache_manager.dart';
import 'package:anifox/core/caching/models/cache_entry.dart';
import 'package:anifox/core/services/notification_service.dart';
import 'package:anifox/core/utils/app_logger.dart';
import 'package:anifox/modules/browse/models/media_preference.dart';
import 'package:anifox/modules/browse/models/media_source_preference.dart';
import 'package:anifox/modules/history/models/models/watch_history_entry.dart';
import 'package:anifox/modules/history/models/models/read_history_entry.dart';
import 'package:anifox/modules/history/models/models/history_entry.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/modules/library/models/models/library_entry.dart';
import 'package:anifox/modules/alerts/models/models/notification_subscription.dart';
import 'package:anifox/modules/tracking/models/isar_tracker_link.dart';
import 'package:window_manager/window_manager.dart';

class AppInit {
  late final ScopedLogger _log = AppLogger.scope(AppInit);

  late final CacheManager cacheManager;
  late final Isar isar;

  Future<AppInit> init() async {
    final log = _log.child('init');

    log.section('START');

    await Rhttp.init();
    log.s('Rhttp initialized');

    if (Platform.isWindows || Platform.isLinux || Platform.isMacOS) {
      await _initWindowManager();
      log.s('Window manager initialized');
    }

    await _initVideoEngines();
    log.s('Video engines initialized');

    await _initDatabase();
    log.s('Database initialized');

    unawaited(_cleanupOldDslProviders());
    unawaited(_initNotifications());

    log.section('DONE');

    return this;
  }

  Future<void> _cleanupOldDslProviders() async {
    final log = _log.child('_cleanupOldDslProviders');
    try {
      final dir = await getApplicationDocumentsDirectory();
      final dslDir = Platform.isAndroid || Platform.isIOS || Platform.isMacOS
          ? Directory(p.join(dir.path, 'dsl_providers'))
          : Directory(p.join(dir.path, 'AniFox', 'dsl_providers'));

      if (await dslDir.exists()) {
        await dslDir.delete(recursive: true);
        log.i('Deleted old dsl_providers directory');
      }
    } catch (e) {
      log.w('Failed to delete dsl_providers: $e');
    }
  }

  Future<void> _initWindowManager() async {
    final log = _log.child('_initWindowManager');

    try {
      await windowManager.ensureInitialized();

      bool isTilingWm = false;

      if (Platform.isLinux) {
        final env = Platform.environment;
        final desktop = env['XDG_CURRENT_DESKTOP']?.toLowerCase() ?? '';
        final session = env['DESKTOP_SESSION']?.toLowerCase() ?? '';

        isTilingWm =
            desktop.contains('hyprland') ||
            session.contains('hyprland') ||
            env.containsKey('HYPRLAND_INSTANCE_SIGNATURE') ||
            desktop.contains('niri') ||
            session.contains('niri');
      }

      final windowOptions = WindowOptions(
        center: true,

        backgroundColor: Platform.isWindows
            ? const Color(0xFF000000)
            : Colors.transparent,

        titleBarStyle: isTilingWm ? TitleBarStyle.hidden : null,

        windowButtonVisibility: Platform.isLinux && !isTilingWm,
      );

      await windowManager.waitUntilReadyToShow(windowOptions, () async {
        await windowManager.show();
        await windowManager.focus();
      });
    } catch (e, st) {
      log.e('WINDOWMANAGER INIT FAILED', e, st);
      rethrow;
    }
  }

  Future<void> _initDatabase() async {
    final log = _log.child('_initDatabase');

    try {
      final dir = await getDatabaseDirectory('AniFox');

      isar = await Isar.open(
        [
          CacheEntrySchema,
          LibraryEntrySchema,
          MediaSourcePreferenceSchema,
          MediaPreferenceSchema,
          IsarTrackerLinkSchema,
          WatchHistoryEntrySchema,
          ReadHistoryEntrySchema,
          HistoryEntrySchema,
          NotificationSubscriptionSchema,
        ],
        directory: dir.path,
        name: 'anifox_db',
        maxSizeMiB: 4096,
      );

      // Perform migration from MediaSourcePreference to MediaPreference
      final oldPrefsCount = await isar.mediaSourcePreferences.count();
      if (oldPrefsCount > 0) {
        log.i(
          'Migrating $oldPrefsCount MediaSourcePreferences to MediaPreferences...',
        );
        final oldPrefs = await isar.mediaSourcePreferences.where().findAll();

        final newPrefs = oldPrefs
            .map(
              (old) => MediaPreference()
                ..mediaTitle = old.mediaTitle
                ..preferredSourceId = old.preferredSourceId
                ..preferredSourceName = old.preferredSourceName
                ..preferredSourceType = old.preferredSourceType
                ..matchedMediaId = old.manualOverrideId
                ..matchedMediaTitle = old.manualOverrideTitle,
            )
            .toList();

        await isar.writeTxn(() async {
          await isar.mediaPreferences.putAll(newPrefs);
          await isar.mediaSourcePreferences.clear();
        });
        log.s('Migration complete');
      }

      // Perform migration from WatchHistoryEntry and ReadHistoryEntry to HistoryEntry
      final watchHistoryCount = await isar.watchHistoryEntrys.count();
      final readHistoryCount = await isar.readHistoryEntrys.count();
      if (watchHistoryCount > 0 || readHistoryCount > 0) {
        log.i(
          'Migrating $watchHistoryCount WatchHistory and $readHistoryCount ReadHistory to HistoryEntry...',
        );

        final watchEntries = await isar.watchHistoryEntrys.where().findAll();
        final readEntries = await isar.readHistoryEntrys.where().findAll();

        final newHistoryEntries = <HistoryEntry>[];
        for (final entry in watchEntries) {
          newHistoryEntries.add(
            HistoryEntry()
              ..mediaType = MediaType.ANIME.id
              ..mediaId = entry.animeId
              ..mediaIdMal = entry.animeIdMal
              ..mediaTitle = entry.animeTitle
              ..cover = entry.cover
              ..banner = entry.banner
              ..thumbnailUrl = entry.thumbnailUrl
              ..itemNumber = entry.episodeNumber
              ..itemTitle = entry.episodeTitle
              ..totalItems = entry.totalEpisodes
              ..progress = Duration(
                milliseconds: entry.positionInMilliseconds,
              ).inSeconds
              ..total = Duration(
                milliseconds: entry.durationInMilliseconds,
              ).inSeconds
              ..sourceId = entry.sourceId
              ..sourceName = entry.sourceName
              ..providerId = entry.providerId
              ..externalIdsJson = entry.externalIdsJson
              ..lastUpdated = entry.lastUpdated,
          );
        }
        for (final entry in readEntries) {
          newHistoryEntries.add(
            HistoryEntry()
              ..mediaType = MediaType.MANGA.id
              ..mediaId = entry.mangaId
              ..mediaIdMal = entry.mangaIdMal
              ..mediaTitle = entry.mangaTitle
              ..cover = entry.cover
              ..banner = entry.banner
              ..thumbnailUrl = null
              ..itemNumber = entry.chapterNumber
              ..itemTitle = entry.chapterTitle
              ..totalItems = null
              ..progress = entry.positionPage.toInt()
              ..total = entry.totalPages.toInt()
              ..sourceId = entry.sourceId
              ..sourceName = entry.sourceName
              ..providerId = entry.providerId
              ..externalIdsJson = entry.externalIdsJson
              ..lastUpdated = entry.lastUpdated,
          );
        }

        for (var i = 0; i < newHistoryEntries.length; i += 100) {
          final end = (i + 100 < newHistoryEntries.length)
              ? i + 100
              : newHistoryEntries.length;
          await isar.writeTxn(() async {
            await isar.historyEntrys.putAll(newHistoryEntries.sublist(i, end));
          });
        }

        await isar.writeTxn(() async {
          await isar.watchHistoryEntrys.clear();
          await isar.readHistoryEntrys.clear();
        });
        log.s('History Migration complete');
      }

      log.s('Isar opened');
    } catch (e, st) {
      log.e('DB INIT FAILED', e, st);
      rethrow;
    }
  }

  Future<void> _initNotifications() async {
    final log = _log.child('_initNotifications');

    try {
      await NotificationService.instance.init();
      log.s('Notification service initialized');
    } catch (e, st) {
      log.e('NOTIFICATION INIT FAILED', e, st);
      rethrow;
    }
  }

  static Future<Directory> getDatabaseDirectory(String dirName) async {
    final dir = await getApplicationDocumentsDirectory();
    if (Platform.isAndroid || Platform.isIOS || Platform.isMacOS) {
      return dir;
    } else {
      String dbDir = p.join(dir.path, dirName, 'databases');
      await Directory(dbDir).create(recursive: true);
      return Directory(dbDir);
    }
  }

  static Future<void> _initVideoEngines() async {
    final log = AppLogger.scope('AppInit').child('initVideoEngines');

    MediaKit.ensureInitialized();
    log.i('MediaKit initialized');
  }
}
