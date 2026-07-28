import 'dart:io';

import 'package:anifox/core/app/logging.dart';
import 'package:anifox/core/data/watching.dart';
import 'package:home_widget/home_widget.dart';

class ContinueWatchingWidgetService {
  static final ContinueWatchingWidgetService _instance = ContinueWatchingWidgetService._();
  factory ContinueWatchingWidgetService() => _instance;
  ContinueWatchingWidgetService._();

  static const String _widgetName = 'ContinueWatchingWidget';

  /// Update the widget with the latest continue-watching data
  Future<void> updateWidget() async {
    if (!Platform.isAndroid) return;

    try {
      final watchingList = await getWatchedList();

      if (watchingList.isEmpty) {
        await HomeWidget.saveWidgetData<String>('cw_title', 'No anime in progress');
        await HomeWidget.saveWidgetData<String>('cw_episode', '');
        await HomeWidget.saveWidgetData<String>('cw_id', '');
        await HomeWidget.saveWidgetData<String>('cw_cover', '');
      } else {
        // Get the most recently updated anime
        final latest = watchingList.first;
        final title = latest.title['title'] ?? latest.title['english'] ?? latest.title['romaji'] ?? 'Unknown';
        final watched = latest.watchProgress ?? 0;
        final total = latest.episodes;
        final episodeText = total != null ? 'Episode $watched of $total' : 'Episode $watched';

        await HomeWidget.saveWidgetData<String>('cw_title', title);
        await HomeWidget.saveWidgetData<String>('cw_episode', episodeText);
        await HomeWidget.saveWidgetData<String>('cw_id', latest.id.toString());
        await HomeWidget.saveWidgetData<String>('cw_cover', latest.coverImage);
      }

      await HomeWidget.updateWidget(
        name: _widgetName,
        iOSName: _widgetName,
      );

      Logs.app.log("[WIDGET] Updated continue-watching widget");
    } catch (e) {
      Logs.app.log("[WIDGET] Error updating widget: $e");
    }
  }
}
