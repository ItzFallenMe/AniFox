import 'package:anifox/core/app/runtimeDatas.dart';
import 'package:anifox/core/data/preferences.dart';
import 'package:anifox/core/data/types.dart';

/// Recent-search history (max 20, most-recent-first).
///
/// Stored inside [UserPreferencesModal.searchHistory] so it survives restarts
/// without a new Hive box.
class SearchHistoryService {
  static const int maxEntries = 20;

  static List<String> get history => List<String>.from(userPreferences?.searchHistory ?? []);

  static Future<void> add(String query) async {
    final q = query.trim();
    if (q.isEmpty) return;
    final list = history;
    list.removeWhere((e) => e.toLowerCase() == q.toLowerCase());
    list.insert(0, q);
    if (list.length > maxEntries) list.removeRange(maxEntries, list.length);
    userPreferences = UserPreferencesModal(
      episodesViewMode: userPreferences?.episodesViewMode,
      subtitleSettings: userPreferences?.subtitleSettings,
      preferDubs: userPreferences?.preferDubs,
      searchPageListMode: userPreferences?.searchPageListMode,
      autoSelectPreviouslyUsedServer: userPreferences?.autoSelectPreviouslyUsedServer,
      episodeSortAscending: userPreferences?.episodeSortAscending ?? true,
      showEpisodeThumbnails: userPreferences?.showEpisodeThumbnails ?? true,
      searchHistory: list,
      homeCarouselAutoplay: userPreferences?.homeCarouselAutoplay ?? true,
    );
    await UserPreferences.saveUserPreferences(UserPreferencesModal(
      episodeSortAscending: userPreferences?.episodeSortAscending,
      showEpisodeThumbnails: userPreferences?.showEpisodeThumbnails,
      searchHistory: list,
      homeCarouselAutoplay: userPreferences?.homeCarouselAutoplay,
    ));
  }

  static Future<void> remove(String query) async {
    final list = history..removeWhere((e) => e.toLowerCase() == query.toLowerCase());
    await UserPreferences.saveUserPreferences(UserPreferencesModal(searchHistory: list));
  }

  static Future<void> clear() async {
    await UserPreferences.saveUserPreferences(UserPreferencesModal(searchHistory: []));
  }
}
