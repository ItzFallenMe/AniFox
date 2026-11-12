import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:anifox/core/router/complex_extra_codec.dart';
import 'package:anifox/core/router/scaffold_with_nav_bar.dart';
import 'package:anifox/modules/browse/models/models/search_filter_options.dart';
import 'package:anifox/modules/browse/ui/details_screen.dart';
import 'package:anifox/modules/welcome/onboarding_screen.dart';
import 'package:anifox/modules/browse/ui/home_screen.dart';
import 'package:anifox/modules/launch/ui/splash_screen.dart';
import 'package:anifox/modules/schedule/ui/calendar_screen.dart';
import 'package:anifox/modules/downloads/ui/downloads_screen.dart';
import 'package:anifox/modules/browse/ui/discover_screen.dart';
import 'package:anifox/core/remote_config/ui/remote_config_editor_screen.dart';
import 'package:anifox/modules/history/ui/continue_history_screen.dart';
import 'package:anifox/modules/library/ui/library_screen.dart';
import 'package:anifox/modules/playback/models/player_mode.dart';
import 'package:anifox/modules/playback/ui/player_screen.dart';
import 'package:anifox/modules/reader/models/reader_mode.dart';
import 'package:anifox/modules/reader/ui/reader_screen.dart';
import 'package:anifox/modules/preferences/ui/cache_settings_screen.dart';
import 'package:anifox/modules/preferences/ui/home_settings_screen.dart';
import 'package:anifox/modules/preferences/ui/permissions_settings_screen.dart';
import 'package:anifox/modules/preferences/ui/player_settings_screen.dart';
import 'package:anifox/modules/preferences/ui/settings_screen.dart';
import 'package:anifox/modules/preferences/ui/reader_settings_screen.dart';
import 'package:anifox/modules/preferences/ui/theme_settings_screen.dart';
import 'package:anifox/modules/preferences/ui/tracking_settings_screen.dart';
import 'package:anifox/modules/preferences/ui/ui_settings_screen.dart';
import 'package:anifox/modules/preferences/ui/backup_settings_screen.dart';
import 'package:anifox/modules/preferences/ui/import_preview_screen.dart';
import 'package:anifox/modules/preferences/ui/debug_settings_screen.dart';
import "package:anifox/modules/alerts/ui/notifications_settings_screen.dart";
import 'package:anifox/modules/preferences/ui/content_settings_screen.dart';
import 'package:anifox/modules/preferences/ui/logs_screen.dart';
import 'package:anifox/modules/preferences/ui/about_screen.dart';
import 'package:anifox/modules/preferences/ui/security_settings_screen.dart';
import 'package:anifox/modules/preferences/ui/update_settings_screen.dart';
import 'package:anifox/modules/preferences/ui/subtitle_debug_screen.dart';
import 'package:anifox/modules/preferences/ui/tracker_bio_debug_screen.dart';
import 'package:anifox/core/services/backup_service.dart';
import 'package:anifox/common/models/unified_media.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>();
final _homeNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'home');
final _libraryNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'library');
final _searchNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'search');

final startupUriProvider = Provider<Uri?>((ref) => null);

final routerProvider = Provider<GoRouter>((ref) {
  final startupUri = ref.watch(startupUriProvider);

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: startupUri?.toString() ?? '/splash',
    debugLogDiagnostics: kDebugMode,
    extraCodec: const ComplexExtraCodec(),
    errorBuilder: (context, state) => Scaffold(
      body: Center(child: Text('Route not found: ${state.uri.toString()}')),
    ),
    redirect: (context, state) => null,
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return ScaffoldWithNavBar(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            navigatorKey: _homeNavigatorKey,
            routes: [
              GoRoute(path: '/home', builder: (context, state) => HomeScreen()),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _searchNavigatorKey,
            routes: [
              GoRoute(
                path: '/discover',
                builder: (context, state) {
                  final query = state.uri.queryParameters['query'];
                  final source = state.uri.queryParameters['source'];
                  final type = MediaType.values.firstWhere(
                    (e) => e.id == state.uri.queryParameters['type'],
                    orElse: () => MediaType.ANIME,
                  );
                  final genres =
                      state.uri.queryParametersAll['genres']
                          ?.expand((e) => e.split(','))
                          .map((e) => e.trim())
                          .where((e) => e.isNotEmpty)
                          .toList() ??
                      [];
                  final tags =
                      state.uri.queryParametersAll['tags']
                          ?.expand((e) => e.split(','))
                          .map((e) => e.trim())
                          .where((e) => e.isNotEmpty)
                          .toList() ??
                      [];
                  final category = state.uri.queryParameters['category'];
                  final sortParam = SearchSort.tryFromId(
                    state.uri.queryParameters['sort'],
                  );
                  final statusParam = SearchStatusFilter.tryFromId(
                    state.uri.queryParameters['status'],
                  );
                  final formatParam = SearchFormatFilter.tryFromId(
                    state.uri.queryParameters['format'],
                  );

                  return DiscoverScreen(
                    key: ValueKey(state.uri.toString()),
                    initialQuery: query,
                    category: category,
                    type: type,
                    initialGenres: genres,
                    initialTags: tags,
                    source: source,
                    customTitle: state.uri.queryParameters['title'],
                    initialSort: sortParam,
                    initialStatus: statusParam,
                    initialFormat: formatParam,
                  );
                },
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _libraryNavigatorKey,
            routes: [
              GoRoute(
                path: '/library',
                builder: (context, state) => const LibraryScreen(),
              ),
            ],
          ),
        ],
      ),

      GoRoute(
        path: '/filtered_discover',
        builder: (context, state) {
          final query = state.uri.queryParameters['query'];
          final source = state.uri.queryParameters['source'];
          final type = MediaType.values.firstWhere(
            (e) => e.id == state.uri.queryParameters['type'],
            orElse: () => MediaType.ANIME,
          );
          final genres =
              state.uri.queryParametersAll['genres']
                  ?.expand((e) => e.split(','))
                  .map((e) => e.trim())
                  .where((e) => e.isNotEmpty)
                  .toList() ??
              [];
          final tags =
              state.uri.queryParametersAll['tags']
                  ?.expand((e) => e.split(','))
                  .map((e) => e.trim())
                  .where((e) => e.isNotEmpty)
                  .toList() ??
              [];
          final category = state.uri.queryParameters['category'];
          final sortParam = SearchSort.tryFromId(
            state.uri.queryParameters['sort'],
          );
          final statusParam = SearchStatusFilter.tryFromId(
            state.uri.queryParameters['status'],
          );
          final formatParam = SearchFormatFilter.tryFromId(
            state.uri.queryParameters['format'],
          );

          return DiscoverScreen(
            key: ValueKey(state.uri.toString()),
            initialQuery: query,
            category: category,
            type: type,
            initialGenres: genres,
            initialTags: tags,
            source: source,
            customTitle: state.uri.queryParameters['title'],
            initialSort: sortParam,
            initialStatus: statusParam,
            initialFormat: formatParam,
          );
        },
      ),
      GoRoute(
        path: '/details/:mediaType',
        builder: (context, state) {
          final mediaType = MediaType.values.firstWhere(
            (e) => e.id == state.pathParameters['mediaType'],
          );
          final tag = state.uri.queryParameters['tag'];

          UnifiedMedia media;
          int initialTabIndex = 0;
          Object? autoPlayMode;

          if (state.extra is Map) {
            final map = state.extra as Map;
            media = map['media'] as UnifiedMedia;
            initialTabIndex = (map['initialTabIndex'] as int?) ?? 0;
            autoPlayMode = map['autoPlayMode'];
          } else {
            media = state.extra as UnifiedMedia;
          }

          return DetailsScreen(
            media: media,
            mediaType: mediaType,
            tag: tag ?? 'details',
            initialTabIndex: initialTabIndex,
            autoPlayMode: autoPlayMode,
          );
        },
      ),
      GoRoute(
        path: '/player',
        builder: (context, state) {
          final mode = state.extra as PlayerMode;
          return PlayerScreen(mode: mode);
        },
      ),
      GoRoute(
        path: '/reader',
        builder: (context, state) {
          final mode = state.extra as ReaderModeOnline;
          return ReaderScreen(key: ValueKey(mode.episode.id), mode: mode);
        },
      ),
      GoRoute(
        path: '/calendar',
        builder: (context, state) => const CalendarScreen(),
      ),
      GoRoute(
        path: '/downloads',
        builder: (context, state) => const DownloadsScreen(),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
        routes: [
          GoRoute(
            path: 'permissions',
            builder: (context, state) => const PermissionsSettingsScreen(),
          ),
          GoRoute(
            path: 'notifications',
            builder: (context, state) => const NotificationsSettingsScreen(),
          ),
          GoRoute(
            path: 'tracking',
            builder: (context, state) => const TrackingSettingsScreen(),
          ),
          GoRoute(
            path: 'remote_config_editor',
            builder: (context, state) => const RemoteConfigEditorScreen(),
          ),
          GoRoute(
            path: 'content',
            builder: (context, state) => const ContentSettingsScreen(),
          ),
          GoRoute(
            path: 'theme',
            builder: (context, state) => const ThemeSettingsScreen(),
          ),
          GoRoute(
            path: 'home',
            builder: (context, state) => const HomeSettingsScreen(),
          ),
          GoRoute(
            path: 'player',
            builder: (context, state) => const PlayerSettingsScreen(),
          ),
          GoRoute(
            path: 'reader',
            builder: (context, state) => const ReaderSettingsScreen(),
          ),
          GoRoute(
            path: 'cache',
            builder: (context, state) => const CacheSettingsScreen(),
          ),
          GoRoute(
            path: 'ui',
            builder: (context, state) => const UiSettingsScreen(),
          ),
          GoRoute(
            path: 'backup',
            builder: (context, state) => const BackupSettingsScreen(),
            routes: [
              GoRoute(
                path: 'preview',
                builder: (context, state) {
                  final manifest = state.extra as BackupManifest;
                  return ImportPreviewScreen(manifest: manifest);
                },
              ),
            ],
          ),
          GoRoute(
            path: 'debug',
            builder: (context, state) => const DebugSettingsScreen(),
            routes: [
              GoRoute(
                path: 'subtitles',
                builder: (context, state) => const SubtitleDebugScreen(),
              ),
              GoRoute(
                path: 'tracker-bio',
                builder: (context, state) => const TrackerBioDebugScreen(),
              ),
            ],
          ),
          GoRoute(
            path: 'logs',
            builder: (context, state) => const LogsScreen(),
          ),
          GoRoute(
            path: 'updates',
            builder: (context, state) => const UpdateSettingsScreen(),
          ),
          GoRoute(
            path: 'about',
            builder: (context, state) => const AboutScreen(),
          ),
          GoRoute(
            path: 'security',
            builder: (context, state) => const SecuritySettingsScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/category/:name',
        builder: (context, state) {
          final rawName = state.pathParameters['name'] ?? '';
          final category = Uri.decodeComponent(rawName);
          final type = MediaType.values.firstWhere(
            (e) => e.id == state.uri.queryParameters['type'],
            orElse: () => MediaType.ANIME,
          );

          return DiscoverScreen(type: type, category: category);
        },
      ),
      GoRoute(
        path: '/continue/:mediaType',
        builder: (context, state) {
          final mediaType = MediaType.values.firstWhere(
            (e) => e.id == state.pathParameters['mediaType'],
            orElse: () => MediaType.ANIME,
          );
          return ContinueHistoryScreen(type: mediaType);
        },
        routes: [
          GoRoute(
            path: ':mediaId',
            builder: (context, state) {
              final mediaType = MediaType.values.firstWhere(
                (e) => e.id == state.pathParameters['mediaType'],
                orElse: () => MediaType.ANIME,
              );
              final rawId = state.pathParameters['mediaId']!;
              final mediaId = Uri.decodeComponent(rawId);
              return ContinueHistoryItemsScreen(
                type: mediaType,
                mediaId: mediaId,
              );
            },
          ),
        ],
      ),
    ],
  );
});
