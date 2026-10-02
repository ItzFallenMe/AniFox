import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb, defaultTargetPlatform, TargetPlatform;

/// Web-safe platform helpers.
///
/// `dart:io`'s [Platform] throws on web, so every check here short-circuits
/// on [kIsWeb] first. Prefer these over raw `Platform.isX` in shared code.
class AppPlatform {
  static bool get isWeb => kIsWeb;

  static bool get isAndroid => !kIsWeb && Platform.isAndroid;
  static bool get isIOS => !kIsWeb && Platform.isIOS;
  static bool get isWindows => !kIsWeb && Platform.isWindows;
  static bool get isLinux => !kIsWeb && Platform.isLinux;
  static bool get isMacOS => !kIsWeb && Platform.isMacOS;

  static bool get isMobile => isAndroid || isIOS;
  static bool get isDesktop => isWindows || isLinux || isMacOS;

  /// Target-platform based check (works on web too).
  static bool get isDesktopTarget =>
      defaultTargetPlatform == TargetPlatform.windows ||
      defaultTargetPlatform == TargetPlatform.linux ||
      defaultTargetPlatform == TargetPlatform.macOS;
}
