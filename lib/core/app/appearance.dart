// ignore_for_file: unnecessary_import
import 'package:anifox/core/app/runtimeDatas.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// v2 appearance helpers: fonts, accent presets, and effective values.
///
/// All getters fall back to safe defaults so old installs (without the new
/// keys) keep working.
class Appearance {
  static const List<String> availableFonts = [
    "NotoSans",
    "Inter",
    "Rubik",
    "Poppins",
    "NunitoSans",
    "OpenSans",
  ];

  static const List<Color> accentPresets = [
    Color(0xFFF97316), // AniFox orange
    Color(0xFF8B5CF6), // violet
    Color(0xFFEC4899), // pink
    Color(0xFF22C55E), // green
    Color(0xFF06B6D4), // cyan
    Color(0xFF3B82F6), // blue
    Color(0xFFEAB308), // yellow
    Color(0xFFEF4444), // red
  ];

  static String get appFont {
    final f = currentUserSettings?.appFontFamily;
    if (f != null && availableFonts.contains(f)) return f;
    return "NotoSans";
  }

  static Color? get customAccent {
    final useCustom = currentUserSettings?.useCustomAccent ?? false;
    final argb = currentUserSettings?.customAccentColor;
    if (!useCustom || argb == null) return null;
    return Color(argb);
  }

  /// Effective accent: custom accent wins, otherwise theme accent.
  static Color effectiveAccent(Color themeAccent) => customAccent ?? themeAccent;

  static double get cardRadius {
    final r = currentUserSettings?.cardCornerRadius ?? 15.0;
    return r.clamp(4.0, 28.0);
  }

  static int get gridColumns {
    final c = currentUserSettings?.gridColumns ?? 3;
    return c.clamp(2, 6);
  }

  static bool get hapticsEnabled => currentUserSettings?.hapticFeedback ?? true;
}

/// Fire-and-forget haptic helper that respects the user setting.
Future<void> softHaptic([HapticIntensity intensity = HapticIntensity.light]) async {
  if (!Appearance.hapticsEnabled) return;
  try {
    switch (intensity) {
      case HapticIntensity.light:
        await HapticFeedback.lightImpact();
        break;
      case HapticIntensity.medium:
        await HapticFeedback.mediumImpact();
        break;
      case HapticIntensity.selection:
        await HapticFeedback.selectionClick();
        break;
    }
  } catch (_) {}
}

enum HapticIntensity { light, medium, selection }
