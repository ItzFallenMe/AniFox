import 'package:anifox/core/app/logging.dart';
import 'package:anifox/core/app/platform.dart';
import 'package:anifox/core/data/watching.dart';
import 'package:home_widget/home_widget.dart';

class ContinueWatchingWidgetService {
  static final ContinueWatchingWidgetService _instance = ContinueWatchingWidgetService._();
  factory ContinueWatchingWidgetService() => _instance;
  ContinueWatchingWidgetService._();

  static const String _widgetName = 'ContinueWatchingWidget';
  static const int _maxItems = 3;

  /// Update the widget with the latest continue-watching data.
  ///
  /// Stores the top-[_maxItems] entries (title/episode/id/cover + progress
  /// percent) so the native widget can render a list instead of a single row.
  Future<void> updateWidget() async {
    if (!AppPlatform.isAndroid) return;

    try {
      final watchingList = await getWatchedList();

      if (watchingList.isEmpty) {
        await HomeWidget.saveWidgetData<String>('cw_count', '0');
        await HomeWidget.saveWidgetData<String>('cw_title', 'No anime in progress');
        await HomeWidget.saveWidgetData<String>('cw_episode', '');
        await HomeWidget.saveWidgetData<String>('cw_id', '');
        await HomeWidget.saveWidgetData<String>('cw_cover', '');
        await HomeWidget.saveWidgetData<String>('cw_progress', '');
      } else {
        final items = watchingList.take(_maxItems).toList();
        await HomeWidget.saveWidgetData<String>('cw_count', items.length.toString());
        for (int i = 0; i < _maxItems; i++) {
          final prefix = i == 0 ? 'cw' : 'cw$i';
          if (i >= items.length) {
            await HomeWidget.saveWidgetData<String>('${prefix}_title', '');
            await HomeWidget.saveWidgetData<String>('${prefix}_episode', '');
            await HomeWidget.saveWidgetData<String>('${prefix}_id', '');
            await HomeWidget.saveWidgetData<String>('${prefix}_cover', '');
            await HomeWidget.saveWidgetData<String>('${prefix}_progress', '');
            continue;
          }
          final latest = items[i];
          final title = latest.title['title'] ?? latest.title['english'] ?? latest.title['romaji'] ?? 'Unknown';
          final watched = latest.watchProgress ?? 0;
          final total = latest.episodes;
          final episodeText = total != null ? 'Episode $watched of $total' : 'Episode $watched';
          final percent = total != null && total > 0 ? ((watched / total) * 100).round().clamp(0, 100) : 0;

          await HomeWidget.saveWidgetData<String>('${prefix}_title', title);
          await HomeWidget.saveWidgetData<String>('${prefix}_episode', episodeText);
          await HomeWidget.saveWidgetData<String>('${prefix}_id', latest.id.toString());
          await HomeWidget.saveWidgetData<String>('${prefix}_cover', latest.coverImage);
          await HomeWidget.saveWidgetData<String>('${prefix}_progress', percent.toString());
        }
        // Back-compat keys (no suffix) mirror the first item.
        final latest = items.first;
        final title = latest.title['title'] ?? latest.title['english'] ?? latest.title['romaji'] ?? 'Unknown';
        final watched = latest.watchProgress ?? 0;
        final total = latest.episodes;
        await HomeWidget.saveWidgetData<String>('cw_title', title);
        await HomeWidget.saveWidgetData<String>(
            'cw_episode', total != null ? 'Episode $watched of $total' : 'Episode $watched');
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

  /// Clear all widget data (e.g. on logout).
  Future<void> clearWidget() async {
    if (!AppPlatform.isAndroid) return;
    try {
      for (final key in ['cw_title', 'cw_episode', 'cw_id', 'cw_cover', 'cw_progress', 'cw_count']) {
        await HomeWidget.saveWidgetData<String>(key, '');
      }
      for (int i = 1; i < _maxItems; i++) {
        for (final key in ['title', 'episode', 'id', 'cover', 'progress']) {
          await HomeWidget.saveWidgetData<String>('cw$i\_$key', '');
        }
      }
      await HomeWidget.updateWidget(name: _widgetName, iOSName: _widgetName);
    } catch (e) {
      Logs.app.log("[WIDGET] Error clearing widget: $e");
    }
  }
}
