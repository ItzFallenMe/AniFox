import 'package:anifox/core/app/appearance.dart';
import 'package:anifox/core/data/types.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('v2 customization defaults', () {
    test('SettingsModal fills new keys with safe defaults', () {
      final s = SettingsModal.fromMap({});
      expect(s.appFontFamily, "NotoSans");
      expect(s.useCustomAccent, isFalse);
      expect(s.customAccentColor, isNull);
      expect(s.cardCornerRadius, 15.0);
      expect(s.gridColumns, 3);
      expect(s.startupTab, 0);
      expect(s.homeShowContinueWatching, isTrue);
      expect(s.homeShowTrending, isTrue);
      expect(s.homeShowTopAiring, isTrue);
      expect(s.autoplayNextEpisode, isTrue);
      expect(s.rememberPlaybackPosition, isTrue);
      expect(s.showFillerBadges, isTrue);
      expect(s.preferredAudio, "sub");
      expect(s.hapticFeedback, isTrue);
      expect(s.hideNsfw, isTrue);
    });

    test('SettingsModal round-trips new keys', () {
      final s = SettingsModal.fromMap({
        'appFontFamily': 'Rubik',
        'useCustomAccent': true,
        'customAccentColor': 0xFFF97316,
        'cardCornerRadius': 20.0,
        'gridColumns': 4,
        'startupTab': 1,
        'autoplayNextEpisode': false,
        'preferredAudio': 'dub',
      });
      final back = SettingsModal.fromMap(s.toMap());
      expect(back.appFontFamily, 'Rubik');
      expect(back.customAccentColor, 0xFFF97316);
      expect(back.cardCornerRadius, 20.0);
      expect(back.gridColumns, 4);
      expect(back.startupTab, 1);
      expect(back.autoplayNextEpisode, isFalse);
      expect(back.preferredAudio, 'dub');
    });

    test('Appearance clamps radius and columns', () {
      // currentUserSettings is null in tests -> defaults apply.
      expect(Appearance.cardRadius, 15.0);
      expect(Appearance.gridColumns, 3);
      expect(Appearance.appFont, "NotoSans");
      expect(Appearance.customAccent, isNull);
      expect(Appearance.availableFonts, contains("Rubik"));
      expect(Appearance.accentPresets.length, greaterThanOrEqualTo(8));
    });

    test('UserPreferencesModal fills episode + history defaults', () {
      final p = UserPreferencesModal.fromMap({});
      expect(p.episodeSortAscending, isTrue);
      expect(p.showEpisodeThumbnails, isTrue);
      expect(p.homeCarouselAutoplay, isTrue);
      expect(p.searchHistory, isEmpty);
    });

    test('UserPreferencesModal parses search history', () {
      final p = UserPreferencesModal.fromMap({
        'searchHistory': ['Naruto', 'One Piece'],
      });
      expect(p.searchHistory, ['Naruto', 'One Piece']);
      final back = UserPreferencesModal.fromMap(p.toMap());
      expect(back.searchHistory, ['Naruto', 'One Piece']);
    });
  });
}
