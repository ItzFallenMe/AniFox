import 'dart:io';
import 'dart:ui';
import 'package:dynamic_color/dynamic_color.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_single_instance/flutter_single_instance.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:anifox/app_init.dart';
import 'package:anifox/common/state/database_provider.dart';
import 'package:anifox/common/state/storage_provider.dart';
import 'package:anifox/common/state/theme_prefs_provider.dart';
import 'package:anifox/common/state/ui_prefs_provider.dart';
import 'package:anifox/core/router/app_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:anifox/core/network/doh/doh_resolver.dart';
import 'package:anifox/core/network/session_manager.dart';
import 'package:anifox/core/remote_config/ui/remote_config_listener.dart';
import 'package:anifox/core/theme/app_theme.dart';
import 'package:anifox/core/utils/app_logger.dart';
import 'package:anifox/modules/privacy/ui/security_gate_wrapper.dart';
import 'package:anifox/common/widgets/global_background.dart';
import 'package:liquid_glass_widgets/liquid_glass_widgets.dart';

final _log = AppLogger.scope('Main');
final _riverpodLog = AppLogger.scope('RiverpodObserver');

void main(List<String> args) async {
  WidgetsFlutterBinding.ensureInitialized();
  if (Platform.isWindows || Platform.isLinux || Platform.isMacOS) {
    if (!await FlutterSingleInstance().isFirstInstance()) {
      await FlutterSingleInstance().focus({"args": args});
      exit(0);
    }
  }

  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    _log.e(
      'FlutterError: ${details.exception}',
      details.exception,
      details.stack,
    );
  };

  PlatformDispatcher.instance.onError = (error, stack) {
    _log.e('PlatformDispatcherError: $error', error, stack);
    return true;
  };

  final log = _log.child('main');
  try {
    await AppLogger.init();
    await LiquidGlassWidgets.initialize();

    log.i('App starting');
    log.i('Args: $args');

    final (init, sharedPreference) = await (
      AppInit().init(),
      SharedPreferences.getInstance(),
    ).wait;
    log.i('AppInit and SharedPreferences ready');
    DohResolver.instance.init(sharedPreference);
    SessionManager().initWithPrefs(sharedPreference);

    Uri? startupUri;

    for (final arg in args) {
      final uri = Uri.tryParse(arg);
      if (uri != null && uri.scheme.isNotEmpty) {
        startupUri = uri;
        break;
      }
    }

    runApp(
      LiquidGlassWidgets.wrap(
        brightnessResolver: Theme.maybeBrightnessOf,
        child: ProviderScope(
          observers: [RiverpodLogger()],
          overrides: [
            startupUriProvider.overrideWithValue(startupUri),
            databaseProvider.overrideWith((ref) => init.isar),
            sharedPreferencesProvider.overrideWith((ref) => sharedPreference),
          ],
          child: const AniFoxApp(),
        ),
      ),
    );
  } catch (e, st) {
    _log.e(e.toString(), e, st);

    runApp(
      MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          backgroundColor: const Color(0xFF8B0000),
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Text(
                'Initialization Failed:\n\n$e\n\n$st',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  fontFamily: 'monospace',
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class AniFoxApp extends ConsumerWidget {
  const AniFoxApp({super.key});

  static final _log = AppLogger.scope(AniFoxApp);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final log = _log.child('build');

    final themePrefs = ref.watch(themePrefsProvider);
    log.d('Theme changed: ${themePrefs.themeMode}');

    return DynamicColorBuilder(
      builder: (ColorScheme? lightDynamic, ColorScheme? darkDynamic) {
        final lightTheme = AppTheme.light(
          themePrefs,
          themePrefs.useDynamic ? lightDynamic : null,
        );
        final darkTheme = AppTheme.dark(
          themePrefs,
          themePrefs.useDynamic ? darkDynamic : null,
        );

        return MaterialApp.router(
          debugShowCheckedModeBanner: false,
          title: 'AniFox',
          themeMode: themePrefs.themeMode,
          theme: lightTheme,
          darkTheme: darkTheme,
          scrollBehavior: const MaterialScrollBehavior().copyWith(
            scrollbars: false,
            dragDevices: {
              PointerDeviceKind.touch,
              PointerDeviceKind.mouse,
              PointerDeviceKind.trackpad,
              PointerDeviceKind.stylus,
              PointerDeviceKind.unknown,
            },
          ),
          routerConfig: ref.watch(routerProvider),
          builder: (context, child) {
            if (child == null) return const SizedBox.shrink();

            GlobalUI.uiScaleFactor = themePrefs.uiScaleFactor;
            GlobalUI.uiRoundness = themePrefs.uiRoundness;

            final textScaledChild = MediaQuery(
              data: MediaQuery.of(context).copyWith(
                textScaler: TextScaler.linear(themePrefs.fontScaleFactor),
              ),
              child: child,
            );

            return RemoteConfigListener(
              child: GlobalBackground(
                child: SecurityGateWrapper(child: textScaledChild),
              ),
            );
          },
        );
      },
    );
  }
}

final class RiverpodLogger extends ProviderObserver {
  static final _log = _riverpodLog;

  @override
  void didUpdateProvider(
    ProviderObserverContext context,
    Object? previousValue,
    Object? newValue,
  ) {
    final providerName = context.provider.name ?? 'UnknownProvider';

    if (providerName != 'debug') return;

    final log = _log.child(providerName);

    log.section('State Update');
    log.i('Previous: $previousValue');
    log.i('New: $newValue');
  }
}
