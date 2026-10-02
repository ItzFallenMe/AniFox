import 'package:anifox/ui/theme/anifox.dart';
import 'package:anifox/ui/theme/resolve.dart';
import 'package:anifox/ui/theme/themes.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ThemeResolver', () {
    test('id 0 (default AniFox theme) is valid', () {
      expect(ThemeResolver.isValidId(0), isTrue);
      expect(ThemeResolver.itemForId(0).name, "AniFox");
    });

    test('unknown ids fall back to the default theme', () {
      expect(ThemeResolver.isValidId(999), isFalse);
      expect(ThemeResolver.itemForId(999).id, 0);
    });

    test('every registry theme has a valid id', () {
      for (final theme in availableThemes) {
        expect(ThemeResolver.isValidId(theme.id), isTrue,
            reason: "${theme.name} (${theme.id}) not resolvable");
      }
      // ids must be unique
      final ids = availableThemes.map((t) => t.id).toSet();
      expect(ids.length, availableThemes.length);
    });

    test('dark mode resolves dark variant with theme accent', () {
      final t = ThemeResolver.resolveAppTheme(
        theme: AniFoxBrand(),
        darkMode: true,
      );
      expect(t.accentColor, AniFoxBrand().theme.accentColor);
      expect(t.backgroundColor, AniFoxBrand().theme.backgroundColor);
    });

    test('AMOLED forces black background', () {
      final t = ThemeResolver.resolveAppTheme(
        theme: AniFoxBrand(),
        darkMode: true,
        amoledBackground: true,
      );
      expect(t.backgroundColor, Colors.black);
    });

    test('AMOLED is ignored in light mode', () {
      final t = ThemeResolver.resolveAppTheme(
        theme: AniFoxBrand(),
        darkMode: false,
        amoledBackground: true,
      );
      expect(t.backgroundColor, AniFoxBrand().lightVariant.backgroundColor);
    });

    test('custom accent overrides theme accent', () {
      const purple = 0xFF8B5CF6;
      final t = ThemeResolver.resolveAppTheme(
        theme: AniFoxBrand(),
        darkMode: true,
        useCustomAccent: true,
        customAccentColor: purple,
      );
      expect(t.accentColor, const Color(purple));
    });

    test('custom accent yields readable onAccent', () {
      // Light accents -> dark text
      for (final argb in [0xFFEAB308, 0xFFFFFFFF, 0xFFF3F4F6]) {
        final t = ThemeResolver.resolveAppTheme(
          theme: AniFoxBrand(),
          darkMode: true,
          useCustomAccent: true,
          customAccentColor: argb,
        );
        expect(t.onAccent, Colors.black, reason: 'expected black text on ${argb.toRadixString(16)}');
      }

      // Dark accents -> light text
      for (final argb in [0xFF1E1B4B, 0xFF000000, 0xFF141414]) {
        final t = ThemeResolver.resolveAppTheme(
          theme: AniFoxBrand(),
          darkMode: true,
          useCustomAccent: true,
          customAccentColor: argb,
        );
        expect(t.onAccent, Colors.white, reason: 'expected white text on ${argb.toRadixString(16)}');
      }
    });

    test('onAccentFor picks the higher-contrast option', () {
      expect(ThemeResolver.onAccentFor(const Color(0xFFFFFFFF)), Colors.black);
      expect(ThemeResolver.onAccentFor(const Color(0xFF000000)), Colors.white);
    });

    test('custom accent is ignored when disabled', () {
      final t = ThemeResolver.resolveAppTheme(
        theme: AniFoxBrand(),
        darkMode: true,
        useCustomAccent: false,
        customAccentColor: 0xFF8B5CF6,
      );
      expect(t.accentColor, AniFoxBrand().theme.accentColor);
    });
  });
}