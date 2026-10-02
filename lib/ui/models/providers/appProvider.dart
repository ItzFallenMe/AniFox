import 'dart:io';

import 'package:anifox/core/app/appearance.dart';
import 'package:anifox/core/app/runtimeDatas.dart';
import 'package:anifox/core/data/theme.dart';
import 'package:anifox/ui/theme/themes.dart';
import 'package:anifox/ui/theme/types.dart';
import 'package:flutter/material.dart';
import 'package:window_manager/window_manager.dart';

// Handles app wide settings (themes, plugin sources etc..)
class AppProvider with ChangeNotifier {
  AniFoxTheme _theme = appTheme;

  bool _isDark = currentUserSettings?.darkMode ?? false;

  AniFoxTheme get theme => _theme;

  bool get isDark => _isDark;

  bool _isFullScreen = false;

  bool get isFullScreen => _isFullScreen;

  String _windowTitle = "anifox";

  String get windowTitle => _windowTitle;

  Color? _titleBarColor;

  Color? get titleBarColor => _titleBarColor;

  // For desktops
  bool _showTitleBar = false;

  bool get showTitleBar => _showTitleBar;

  set showTitleBar(bool value) {
    _showTitleBar = value;
    notifyListeners();
  }

  set windowTitle(String newTitle) {
    _windowTitle = newTitle;
    notifyListeners();
  }

  set isFullScreen(bool fs) {
    _isFullScreen = fs;
    notifyListeners();
  }

  /// Set the title bar color (only works on windows)
  /// If null, default system color is used
  void setTitlebarColor(Color? color) {
    _titleBarColor = color;
    notifyListeners();
  }

  /// Set the window mode to fullscreen or windowed (desktop only)
  Future<void> setFullScreen(bool fs) async {
    if (Platform.isAndroid || Platform.isIOS) return;
    await windowManager.setFullScreen(fs);
    isFullScreen = fs;
  }

  set theme(AniFoxTheme selectedTheme) {
    _theme = selectedTheme;

    final dark = currentUserSettings?.darkMode ?? true;
    final accent = Appearance.effectiveAccent(selectedTheme.accentColor);
    final onAccent = _onAccentFor(accent, selectedTheme.onAccent);

    appTheme = AniFoxTheme(
      accentColor: accent,
      //set background color only if dark theme and amoled bg are true, otherwise set respective theme's default bg
      backgroundColor:
          ((currentUserSettings?.amoledBackground ?? false) && dark) ? Colors.black : selectedTheme.backgroundColor,
      backgroundSubColor: selectedTheme.backgroundSubColor,
      textMainColor: selectedTheme.textMainColor,
      textSubColor: selectedTheme.textSubColor,
      modalSheetBackgroundColor: selectedTheme.modalSheetBackgroundColor,
      onAccent: onAccent,
    );

    notifyListeners();
  }

  set isDark(bool dark) {
    _isDark = dark;
  }

  void applyTheme(AniFoxTheme t) {
    theme = t;
  }

  Future<void> applyThemeMode(bool dark) async {
    isDark = dark;
    final themeId = await getTheme();
    final theme = availableThemes.firstWhere((thm) => thm.id == themeId, orElse: () => availableThemes[0]);

    if (dark) {
      appTheme = AniFoxTheme(
        accentColor: theme.theme.accentColor,
        backgroundColor: (currentUserSettings?.amoledBackground ?? false) ? Colors.black : theme.theme.backgroundColor,
        backgroundSubColor: theme.theme.backgroundSubColor,
        textMainColor: theme.theme.textMainColor,
        textSubColor: theme.theme.textSubColor,
        modalSheetBackgroundColor: theme.theme.modalSheetBackgroundColor,
        onAccent: theme.theme.onAccent,
      );
    } else {
      appTheme = AniFoxTheme(
        accentColor: theme.lightVariant.accentColor,
        backgroundColor: theme.lightVariant.backgroundColor,
        backgroundSubColor: theme.lightVariant.backgroundSubColor,
        textMainColor: theme.lightVariant.textMainColor,
        textSubColor: theme.lightVariant.textSubColor,
        modalSheetBackgroundColor: theme.lightVariant.modalSheetBackgroundColor,
        onAccent: theme.lightVariant.onAccent,
      );
    }

    notifyListeners();
  }

  /// Refresh the root Widget tree
  void justRefresh() {
    // Re-apply custom accent on plain refreshes too.
    final custom = Appearance.customAccent;
    if (custom != null) {
      appTheme = AniFoxTheme(
        accentColor: custom,
        backgroundColor: appTheme.backgroundColor,
        backgroundSubColor: appTheme.backgroundSubColor,
        textMainColor: appTheme.textMainColor,
        textSubColor: appTheme.textSubColor,
        modalSheetBackgroundColor: appTheme.modalSheetBackgroundColor,
        onAccent: _onAccentFor(custom, appTheme.onAccent),
      );
    }
    notifyListeners();
  }

  Color _onAccentFor(Color accent, Color fallback) {
    // White text on dark/saturated accents, black on light ones.
    final luminance = accent.computeLuminance();
    if (luminance > 0.6) return Colors.black;
    if (luminance < 0.15) return Colors.white;
    return fallback;
  }
}
