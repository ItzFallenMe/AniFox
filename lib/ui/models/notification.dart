import 'package:anifox/core/anime/downloader/downloadManager.dart';
import 'package:anifox/core/app/logging.dart';
import 'package:anifox/core/app/runtimeDatas.dart';
import 'package:awesome_notifications/awesome_notifications.dart';
import 'package:flutter/material.dart';
import 'package:open_file/open_file.dart';

class NotificationService {
  /// Last progress % pushed per download id — avoids spamming the tray
  /// with a notification update for every chunk.
  static final Map<int, int> _lastProgress = {};

  Future<void> init() async {
    await AwesomeNotifications().initialize(
      'resource://drawable/ic_launcher_foreground',
      [
        NotificationChannel(
          channelGroupKey: 'anifox_group',
          channelKey: 'anifox',
          channelName: 'AniFox',
          channelDescription: 'AniFox notification channel',
          defaultColor: appTheme.accentColor,
          playSound: false,
          ledColor: Colors.white,
        ),
        NotificationChannel(
          channelGroupKey: 'anifox_group',
          channelKey: 'anifox_episodes',
          channelName: 'Episode Releases',
          channelDescription: 'Notifications for new episode releases',
          defaultColor: appTheme.accentColor,
          playSound: true,
          ledColor: Colors.white,
          importance: NotificationImportance.High,
        ),
        NotificationChannel(
          channelGroupKey: 'anifox_group',
          channelKey: 'anifox_downloads',
          channelName: 'Downloads',
          channelDescription: 'Download progress and completion',
          defaultColor: appTheme.accentColor,
          playSound: false,
          ledColor: Colors.white,
          importance: NotificationImportance.Low,
        ),
      ],
      debug: false,
      channelGroups: [
        NotificationChannelGroup(
          channelGroupKey: 'anifox_group',
          channelGroupName: 'AniFox',
        )
      ],
    );
    bool isNotifAllowed = await AwesomeNotifications().isNotificationAllowed();
    if (!isNotifAllowed) AwesomeNotifications().requestPermissionToSendNotifications();
  }

  /// Re-apply the current accent color to channels after a theme change.
  Future<void> refreshChannelColors() async {
    try {
      await AwesomeNotifications().setChannel(
        NotificationChannel(
          channelGroupKey: 'anifox_group',
          channelKey: 'anifox',
          channelName: 'AniFox',
          channelDescription: 'AniFox notification channel',
          defaultColor: appTheme.accentColor,
          ledColor: Colors.white,
        ),
      );
    } catch (e) {
      Logs.app.log("[NOTIF] refreshChannelColors failed: $e");
    }
  }

  Future<bool> ensurePermission() async {
    bool allowed = await AwesomeNotifications().isNotificationAllowed();
    if (!allowed) {
      allowed = await AwesomeNotifications().requestPermissionToSendNotifications();
    }
    return allowed;
  }

  pushBasicNotification(int id, String title, String content) {
    AwesomeNotifications().createNotification(
      content: NotificationContent(
        id: id,
        channelKey: "anifox",
        title: title,
        body: content,
        backgroundColor: appTheme.accentColor,
        // autoDismissible: false
      ),
    );
  }

  /// Rich episode-release notification with cover art + deep-link payload.
  Future<void> pushEpisodeNotification({
    required int id,
    required String title,
    required String episode,
    String? coverUrl,
    int? animeId,
  }) async {
    await AwesomeNotifications().createNotification(
      content: NotificationContent(
        id: id,
        channelKey: 'anifox_episodes',
        title: '$title — New Episode',
        body: 'Episode $episode is now airing! Tap to open.',
        bigPicture: coverUrl,
        notificationLayout: coverUrl != null ? NotificationLayout.BigPicture : NotificationLayout.Default,
        backgroundColor: appTheme.accentColor,
        payload: {
          if (animeId != null) 'animeId': animeId.toString(),
          'type': 'episode',
        },
      ),
    );
  }

  removeNotification(int id) {
    _lastProgress.remove(id);
    AwesomeNotifications().cancel(id);
  }

  Future<void> updateNotificationProgressBar({
    required int id,
    required int currentStep,
    required int maxStep,
    required String fileName,
    required String path,
  }) async {
    final int progress = maxStep <= 0 ? 0 : ((currentStep / maxStep) * 100).round().clamp(0, 100);
    // Throttle: only push when % actually changed.
    if (_lastProgress[id] == progress) return;
    _lastProgress[id] = progress;
    await AwesomeNotifications().createNotification(
        content: NotificationContent(
          id: id,
          channelKey: 'anifox_downloads',
          title: 'Downloading $fileName ($progress%)',
          body: 'The file is being downloaded',
          summary: '$progress% • $currentStep of $maxStep',
          category: NotificationCategory.Progress,
          payload: {
            'path': path,
            'id': id.toString(),
          },
          notificationLayout: NotificationLayout.ProgressBar,
          progress: progress.toDouble(),
          locked: true,
          autoDismissible: false,
          showWhen: false,
          backgroundColor: appTheme.accentColor,
        ),
        actionButtons: [NotificationActionButton(key: "cancel", label: "Cancel")]);
  }

  Future<void> downloadCompletionNotification({
    required int id,
    required String fileName,
    required String path,
  }) async {
    _lastProgress.remove(id);
    await AwesomeNotifications().createNotification(
        content: NotificationContent(
          id: id,
          channelKey: 'anifox_downloads',
          title: 'Download finished',
          body: '$fileName has been downloaded successfully!',
          payload: {
            'path': path,
            'id': id.toString(),
          },
          locked: false,
          backgroundColor: appTheme.accentColor,
        ),
        actionButtons: [
          NotificationActionButton(key: "open_file", label: "Open"),
          NotificationActionButton(key: "dismiss", label: "Dismiss", actionType: ActionType.DismissAction),
        ]);
  }

  Future<void> cancelAllDownloads() async {
    final active = await AwesomeNotifications().listScheduledNotifications();
    for (final n in active) {
      if (n.content?.channelKey == 'anifox_downloads') {
        await AwesomeNotifications().cancel(n.content!.id!);
      }
    }
    _lastProgress.clear();
  }
}

class NotificationController {
  @pragma("vm:entry-point")
  static Future<void> onNotificationCreatedMethod(ReceivedNotification receivedNotification) async {}

  @pragma("vm:entry-point")
  static Future<void> onNotificationDisplayedMethod(ReceivedNotification receivedNotification) async {}

  @pragma("vm:entry-point")
  static Future<void> onDismissActionReceivedMethod(ReceivedAction receivedAction) async {}

  @pragma("vm:entry-point")
  static Future<void> onActionReceivedMethod(ReceivedAction receivedAction) async {
    if (receivedAction.buttonKeyPressed == 'cancel') {
      final payload = receivedAction.payload;
      final idStr = payload?['id'];
      if (idStr == null) return;
      final id = int.tryParse(idStr);
      if (id == null) return;
      NotificationService().removeNotification(id);
      DownloadManager().cancelDownload(id);
    }
    if (receivedAction.buttonKeyPressed == 'open_file') {
      final path = receivedAction.payload?['path'];
      if (path != null && path.isNotEmpty) {
        OpenFile.open(path, type: "video/mp4");
      }
    }
    // Deep-link episode taps into the app (handled on foreground via payload).
    if ((receivedAction.payload?['type'] ?? '') == 'episode') {
      Logs.app.log("[NOTIF] episode tapped: ${receivedAction.payload?['animeId']}");
    }
  }
}
