import 'dart:io';

import 'package:anifox/core/app/logging.dart';
import 'package:anifox/core/app/runtimeDatas.dart';
import 'package:anifox/core/data/secureStorage.dart';
import 'package:anifox/core/database/anilist/anilist.dart';
import 'package:anifox/core/database/anilist/login.dart';
import 'package:anifox/core/commons/enums.dart';
import 'package:awesome_notifications/awesome_notifications.dart';

class EpisodeNotificationService {
  static final EpisodeNotificationService _instance = EpisodeNotificationService._();
  factory EpisodeNotificationService() => _instance;
  EpisodeNotificationService._();

  Future<void> scheduleUpcomingEpisodeNotifications() async {
    if (!Platform.isAndroid && !Platform.isIOS) return;

    try {
      if (!await AniListLogin().isAnilistLoggedIn()) return;
      if (storedUserData == null) return;

      final userName = storedUserData!.name;

      final watchingList = await _fetchListWithAiring(userName, MediaStatus.CURRENT);
      final planningList = await _fetchListWithAiring(userName, MediaStatus.PLANNING);
      final allAnime = [...watchingList, ...planningList];

      await _cancelExistingEpisodeNotifications();

      int scheduledCount = 0;
      for (final anime in allAnime) {
        final nextAiring = anime['nextAiringEpisode'] as Map<String, dynamic>?;
        if (nextAiring == null) continue;

        final airingAt = nextAiring['airingAt'];
        if (airingAt == null || airingAt == 0) continue;

        final airingTime = airingAt is int ? airingAt : int.tryParse(airingAt.toString());
        if (airingTime == null || airingTime <= 0) continue;

        final airingDateTime = DateTime.fromMillisecondsSinceEpoch(airingTime * 1000);

        if (airingDateTime.isBefore(DateTime.now())) continue;
        if (airingDateTime.difference(DateTime.now()).inDays > 7) continue;

        final episodeNumber = nextAiring['episode'] ?? '';
        final titleMap = anime['title'] as Map<String, dynamic>? ?? {};
        final title = titleMap['english'] ?? titleMap['romaji'] ?? 'Unknown';
        final id = anime['id'] as int;
        final notifId = id.hashCode;

        await AwesomeNotifications().createNotification(
          content: NotificationContent(
            id: notifId,
            channelKey: 'anifox_episodes',
            title: '$title — New Episode',
            body: 'Episode $episodeNumber is now airing!',
            notificationLayout: NotificationLayout.Default,
          ),
          schedule: NotificationCalendar(
            year: airingDateTime.year,
            month: airingDateTime.month,
            day: airingDateTime.day,
            hour: airingDateTime.hour,
            minute: airingDateTime.minute,
            second: 0,
            millisecond: 0,
            repeats: false,
          ),
        );
        scheduledCount++;
        Logs.app.log("[EP_NOTIF] Scheduled notification for $title ep $episodeNumber at $airingDateTime");
      }

      Logs.app.log("[EP_NOTIF] Scheduled $scheduledCount episode notifications");
    } catch (e) {
      Logs.app.log("[EP_NOTIF] Error scheduling notifications: $e");
    }
  }

  Future<List<Map<String, dynamic>>> _fetchListWithAiring(String userName, MediaStatus status) async {
    final query = '''query {
  MediaListCollection(userName: "$userName", type: ANIME, status: ${status.name}, sort: UPDATED_TIME) {
    lists {
      entries {
        media {
          id
          title {
            english
            romaji
          }
          nextAiringEpisode {
            episode
            airingAt
            timeUntilAiring
          }
        }
      }
    }
  }
}''';

    try {
      final res = await Anilist().fetchQuery(query, null,
          token: await getSecureVal(SecureStorageKey.anilistToken));
      final lists = res['MediaListCollection']['lists'] as List? ?? [];
      final results = <Map<String, dynamic>>[];

      for (final list in lists) {
        for (final entry in list['entries'] ?? []) {
          final media = entry['media'];
          if (media == null) continue;
          results.add({
            'id': media['id'],
            'title': media['title'],
            'nextAiringEpisode': media['nextAiringEpisode'],
          });
        }
      }
      return results;
    } catch (e) {
      Logs.app.log("[EP_NOTIF] Error fetching list: $e");
      return [];
    }
  }

  Future<void> _cancelExistingEpisodeNotifications() async {
    final pending = await AwesomeNotifications().listScheduledNotifications();
    for (final notif in pending) {
      if (notif.content?.channelKey == 'anifox_episodes') {
        await AwesomeNotifications().cancel(notif.content!.id!);
      }
    }
  }
}
