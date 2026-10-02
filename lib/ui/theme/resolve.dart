import 'package:anifox/ui/theme/anifox.dart';
import 'package:anifox/ui/theme/themes.dart';
import 'package:anifox/ui/theme/types.dart';
import 'package:flutter/material.dart';

/// Central theme resolution for AniFox.
///
/// Every place that builds an [AniFoxTheme] must go through [resolveAppTheme]
/// so dark mode, AMOLED, and the custom accent color stay consistent.
/// Previously each call site hand-rolled the logic, which caused the default
/// theme (id 0) to be rejected at startup and the custom accent to be
/// silently dropped on some paths.
class ThemeResolver {
  /// All valid theme ids, derived from the registry (not list length).
  static Set<int> get validIds => availableThemes.map((t) => t.id).toSet();

  static bool isValidId(int id) => validIds.contains(id);

  static ThemeItem itemForId(int id) {
    return availableThemes.where((t) => t.id == id).firstOrNull ?? AniFoxBrand();
  }

  /// Build the effective theme for the given options.
  static AniFoxTheme resolveAppTheme({
    required ThemeItem theme,
    required bool darkMode,
    bool amoledBackground = false,
    bool useCustomAccent = false,
    int? customAccentColor,
  }) {
    if (!darkMode) return theme.lightVariant;

    Color accent = theme.theme.accentColor;
    Color onAccent = theme.theme.onAccent;
    if (useCustomAccent && customAccentColor != null) {
      accent = Color(customAccentColor);
      onAccent = onAccentFor(accent, fallback: onAccent);
    }

    return AniFoxTheme(
      accentColor: accent,
      backgroundColor: amoledBackground ? Colors.black : theme.theme.backgroundColor,
      backgroundSubColor: theme.theme.backgroundSubColor,
      textMainColor: theme.theme.textMainColor,
      textSubColor: theme.theme.textSubColor,
      modalSheetBackgroundColor: theme.theme.modalSheetBackgroundColor,
      onAccent: onAccent,
    );
  }

  /// Picks black or white text for [accent] using WCAG relative luminance.
  ///
  /// Uses real contrast comparison instead of magic thresholds, so accents
  /// near the midpoint still get the readable option.
  static Color onAccentFor(Color accent, {Color? fallback}) {
    final luminance = accent.computeLuminance();
    // Contrast against white vs black (WCAG formula, simplified).
    final onWhite = 1.05 / (luminance + 0.05);
    final onBlack = (luminance + 0.05) / 0.05;
    if (onWhite >= onBlack) return Colors.white;
    return Colors.black;
  }

  @visibleForTesting
  static Color onAccentForWithFallback(Color accent, Color fallback) =>
      onAccentFor(accent, fallback: fallback);
}
