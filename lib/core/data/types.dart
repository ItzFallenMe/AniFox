// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

import 'package:anifox/core/commons/enums.dart';
import 'package:anifox/core/database/database.dart';
import 'package:anifox/ui/models/widgets/subtitles/subtitleSettings.dart';

class SettingsModal {
  /// Skip duration in seconds for the player [defaults to 10 seconds]
  final int? skipDuration;

  /// Mega skip duration in seconds for the player [defaults to 85 seconds]
  final int? megaSkipDuration;

  /// Error display errors as snackbars [defaults to false]
  final bool? showErrors;

  /// Enable pre-release update notifications [defaults to false]
  final bool? receivePreReleases;

  /// AMOLED background for dark mode [defaults to false]
  final bool? amoledBackground;

  /// Preferred quality for the player [defaults to 720p]
  final String? preferredQuality; // 1080p | 720p |480p | 360p as string

  /// The trasparency of the homescreen navbar
  final double? navbarTranslucency; //value from 0 to 1

  /// Enable faster downloads using increased batch size [defaults to false]
  final bool? fasterDownloads;

  /// Preferred source provider for playback [defaults to most stable provider available]
  final String? preferredProvider;

  /// App's dark mode state [defaults to true]
  final bool? darkMode;

  /// Use material you theming (just the pallette) [defaults to false]
  final bool? materialTheme;

  /// Dev access [defaults to false]
  final bool? isDev;

  /// The preferred download path for anime/banner downloads [defaults to the OS download path]
  final String? downloadPath;

  /// The preferred database provider (SIMKL/MAL/AL) [defaults to Anilist]
  final Databases? database;

  /// Enable extra speed options in player (4x,5x,8x,10x) [defaults to false]
  final bool? enableSuperSpeeds;

  /// Download items one by one instead of parallel downloads [defaults to false]
  final bool? useQueuedDownloads;

  /// Use frameless window (Windows only, not used rn)
  final bool? useFramelessWindow;

  /// Enable double tap to skip in player (Not available for desktops) [defaults to true]
  final bool? doubleTapToSkip;

  /// Use native titles (japanese/korean) when available instead of romaji/english [defaults to false]
  final bool? nativeTitle;

  /// Enable picture in picture mode on minimize (Not available for desktops) [defaults to false]
  final bool? enablePipOnMinimize;

  /// Automatically skip opening and ending themes [defaults to false]
  final bool? autoOpEdSkip;

  /// Enable logging throughout the app [defaults to false]
  final bool? enableLogging;

  /// Tap and Hold to speed up the player [defaults to true]
  final bool? enableHoldToSpeedUp;

  /// Enable volume and brightness gestures in player screen
  final bool? enablePlayerGestures;

  /// Use the old navbar instead of the new one (Not available for desktops) [defaults to false]
  final bool? useOldNavbar;

  /// Use experimental mkv video convertion
  final bool? useMkvRemuxer;

  /// Write downloaded subtitles into remuxed MKV files (SRT/VTT only)
  final bool? writeSubtitleTrackToVideo;

  /// Enable discord rich presence
  final bool? enableDiscordRichPresence;

  // ── v2 appearance customisation ──

  /// App-wide font family [defaults to NotoSans]
  final String? appFontFamily;

  /// Use a custom accent color instead of the theme's [defaults to false]
  final bool? useCustomAccent;

  /// Custom accent color as ARGB int (only used when [useCustomAccent] is true)
  final int? customAccentColor;

  /// Card corner radius in logical pixels [defaults to 15.0]
  final double? cardCornerRadius;

  /// Grid columns for card grids [defaults to 3]
  final int? gridColumns;

  // ── v2 home customisation ──

  /// Startup tab index: 0 home, 1 discover, 2 lists [defaults to 0]
  final int? startupTab;

  /// Show continue-watching section on home [defaults to true]
  final bool? homeShowContinueWatching;

  /// Show trending section on home/discover [defaults to true]
  final bool? homeShowTrending;

  /// Show top-airing section on home [defaults to true]
  final bool? homeShowTopAiring;

  // ── v2 playback & library behaviour ──

  /// Autoplay next episode when current finishes [defaults to true]
  final bool? autoplayNextEpisode;

  /// Remember playback position per episode [defaults to true]
  final bool? rememberPlaybackPosition;

  /// Show filler/dub badges on episode lists [defaults to true]
  final bool? showFillerBadges;

  /// Preferred audio: "sub" or "dub" [defaults to sub]
  final String? preferredAudio;

  /// Haptic feedback on UI interactions [defaults to true]
  final bool? hapticFeedback;

  /// Hide NSFW entries in browse lists [defaults to true]
  final bool? hideNsfw;

  SettingsModal({
    this.megaSkipDuration,
    this.skipDuration,
    this.showErrors,
    this.receivePreReleases,
    this.amoledBackground,
    this.preferredQuality,
    this.navbarTranslucency,
    this.fasterDownloads,
    this.preferredProvider,
    this.darkMode,
    this.materialTheme,
    this.isDev,
    this.downloadPath,
    this.database,
    this.enableSuperSpeeds,
    this.useQueuedDownloads,
    this.useFramelessWindow,
    this.doubleTapToSkip,
    this.nativeTitle,
    this.enablePipOnMinimize,
    this.autoOpEdSkip,
    this.enableLogging,
    this.enableHoldToSpeedUp,
    this.enablePlayerGestures,
    this.useOldNavbar,
    this.useMkvRemuxer,
    this.writeSubtitleTrackToVideo,
    this.enableDiscordRichPresence,
    this.appFontFamily,
    this.useCustomAccent,
    this.customAccentColor,
    this.cardCornerRadius,
    this.gridColumns,
    this.startupTab,
    this.homeShowContinueWatching,
    this.homeShowTrending,
    this.homeShowTopAiring,
    this.autoplayNextEpisode,
    this.rememberPlaybackPosition,
    this.showFillerBadges,
    this.preferredAudio,
    this.hapticFeedback,
    this.hideNsfw,
  });

  factory SettingsModal.fromMap(Map<dynamic, dynamic> map) {
    return SettingsModal(
      megaSkipDuration: map['megaSkipDuration'] ?? 85,
      skipDuration: map['skipDuration'] ?? 10,
      showErrors: map['showErrors'] ?? false,
      receivePreReleases: map['receivePreReleases'] ?? false,
      amoledBackground: map['amoledBackground'] ?? false,
      preferredQuality: map['preferredQuality'] ?? "720p",
      navbarTranslucency: map['navbarTranslucency'] ?? 1.0,
      fasterDownloads: map['fasterDownloads'] ?? false,
      preferredProvider: map['preferredProvider'] ?? null,
      darkMode: map['darkMode'] ?? true,
      materialTheme: map['materialTheme'] ?? false,
      isDev: map['isDev'] ?? false,
      downloadPath: map['downloadPath'], // No default value since we can assign them at runtime according to OS
      database: DatabaseFromString.getDb(map['database'] ?? "anilist"),
      enableSuperSpeeds: map['enableSuperSpeeds'] ?? false,
      useQueuedDownloads: map['useQueuedDownloads'] ?? false,
      useFramelessWindow: map['useFramelessWindow'] ?? false,
      doubleTapToSkip: map['doubleTapToSkip'] ?? true,
      nativeTitle: map['nativeTitle'] ?? false,
      enablePipOnMinimize: map['enablePipOnMinimize'] ?? false,
      autoOpEdSkip: map['autoOpEdSkip'] ?? false,
      enableLogging: map['enableLogging'] ?? false,
      enableHoldToSpeedUp: map['enableHoldToSpeedUp'] ?? true,
      enablePlayerGestures: map['enablePlayerGestures'] ?? false,
      useOldNavbar: map['useOldNavbar'] ?? false,
      useMkvRemuxer: map['useMkvRemuxer'] ?? true,
      writeSubtitleTrackToVideo: map['writeSubtitleTrackToVideo'] ?? false,
      enableDiscordRichPresence: map['enableDiscordRichPresence'] ?? false,
      appFontFamily: map['appFontFamily'] ?? "NotoSans",
      useCustomAccent: map['useCustomAccent'] ?? false,
      customAccentColor: map['customAccentColor'],
      cardCornerRadius: (map['cardCornerRadius'] as num?)?.toDouble() ?? 15.0,
      gridColumns: (map['gridColumns'] as num?)?.toInt() ?? 3,
      startupTab: (map['startupTab'] as num?)?.toInt() ?? 0,
      homeShowContinueWatching: map['homeShowContinueWatching'] ?? true,
      homeShowTrending: map['homeShowTrending'] ?? true,
      homeShowTopAiring: map['homeShowTopAiring'] ?? true,
      autoplayNextEpisode: map['autoplayNextEpisode'] ?? true,
      rememberPlaybackPosition: map['rememberPlaybackPosition'] ?? true,
      showFillerBadges: map['showFillerBadges'] ?? true,
      preferredAudio: map['preferredAudio'] ?? "sub",
      hapticFeedback: map['hapticFeedback'] ?? true,
      hideNsfw: map['hideNsfw'] ?? true,
    );
  }

  Map<dynamic, dynamic> toMap() {
    return {
      'skipDuration': skipDuration,
      'megaSkipDuration': megaSkipDuration,
      'showErrors': showErrors,
      'receivePreReleases': receivePreReleases,
      'amoledBackground': amoledBackground,
      'preferredQuality': preferredQuality,
      'navbarTranslucency': navbarTranslucency,
      'fasterDownloads': fasterDownloads,
      'preferredProvider': preferredProvider,
      'darkMode': darkMode,
      'materialTheme': materialTheme,
      'isDev': isDev,
      'downloadPath': downloadPath,
      'database': database?.name,
      'enableSuperSpeeds': enableSuperSpeeds,
      'useQueuedDownloads': useQueuedDownloads,
      'useFramelessWindow': useFramelessWindow,
      'doubleTapToSkip': doubleTapToSkip,
      'nativeTitle': nativeTitle,
      'enablePipOnMinimize': enablePipOnMinimize,
      'autoOpEdSkip': autoOpEdSkip,
      'enableLogging': enableLogging,
      'enableHoldToSpeedUp': enableHoldToSpeedUp,
      'enablePlayerGestures': enablePlayerGestures,
      'useOldNavbar': useOldNavbar,
      'useMkvRemuxer': useMkvRemuxer,
      'writeSubtitleTrackToVideo': writeSubtitleTrackToVideo,
      'enableDiscordRichPresence': enableDiscordRichPresence,
      'appFontFamily': appFontFamily,
      'useCustomAccent': useCustomAccent,
      'customAccentColor': customAccentColor,
      'cardCornerRadius': cardCornerRadius,
      'gridColumns': gridColumns,
      'startupTab': startupTab,
      'homeShowContinueWatching': homeShowContinueWatching,
      'homeShowTrending': homeShowTrending,
      'homeShowTopAiring': homeShowTopAiring,
      'autoplayNextEpisode': autoplayNextEpisode,
      'rememberPlaybackPosition': rememberPlaybackPosition,
      'showFillerBadges': showFillerBadges,
      'preferredAudio': preferredAudio,
      'hapticFeedback': hapticFeedback,
      'hideNsfw': hideNsfw,
    };
  }
}

class UserPreferencesModal {
  final EpisodeViewModes? episodesViewMode;
  final SubtitleSettings? subtitleSettings;
  final bool? preferDubs;
  final bool? searchPageListMode;
  final bool? autoSelectPreviouslyUsedServer;
  final bool? episodeSortAscending;
  final bool? showEpisodeThumbnails;
  final List<String>? searchHistory;
  final bool? homeCarouselAutoplay;
  UserPreferencesModal({
    this.episodesViewMode,
    this.subtitleSettings,
    this.preferDubs,
    this.searchPageListMode,
    this.autoSelectPreviouslyUsedServer,
    this.episodeSortAscending,
    this.showEpisodeThumbnails,
    this.searchHistory,
    this.homeCarouselAutoplay,
  });

  factory UserPreferencesModal.fromMap(Map<dynamic, dynamic> map) {
    List<String>? history;
    final rawHistory = map['searchHistory'];
    if (rawHistory is List) {
      history = rawHistory.map((e) => e.toString()).toList();
    }
    return UserPreferencesModal(
      episodesViewMode: getViewModeEnum(map['episodesViewMode'] ?? 0),
      subtitleSettings:
          map['subtitleSettings'] != null ? SubtitleSettings.fromMap(map['subtitleSettings']) : SubtitleSettings(),
      preferDubs: map['preferDubs'] ?? false,
      searchPageListMode: map['searchPageListMode'] ?? false,
      autoSelectPreviouslyUsedServer: map['autoSelectPreviouslyUsedServer'] ?? false,
      episodeSortAscending: map['episodeSortAscending'] ?? true,
      showEpisodeThumbnails: map['showEpisodeThumbnails'] ?? true,
      searchHistory: history ?? [],
      homeCarouselAutoplay: map['homeCarouselAutoplay'] ?? true,
    );
  }

  factory UserPreferencesModal.defaults() {
    return UserPreferencesModal(
      episodesViewMode: EpisodeViewModes.list,
      preferDubs: false,
      searchPageListMode: false,
      subtitleSettings: SubtitleSettings(),
      autoSelectPreviouslyUsedServer: false,
      episodeSortAscending: true,
      showEpisodeThumbnails: true,
      searchHistory: [],
      homeCarouselAutoplay: true,
    );
  }

  Map<dynamic, dynamic> toMap() {
    return {
      'episodesViewMode': episodesViewMode != null ? getViewModeIndex(episodesViewMode!) : null,
      'subtitleSettings': subtitleSettings?.toMap(),
      'preferDubs': preferDubs,
      'searchPageListMode': searchPageListMode,
      'autoSelectPreviouslyUsedServer': autoSelectPreviouslyUsedServer,
      'episodeSortAscending': episodeSortAscending,
      'showEpisodeThumbnails': showEpisodeThumbnails,
      'searchHistory': searchHistory,
      'homeCarouselAutoplay': homeCarouselAutoplay,
    };
  }

  static EpisodeViewModes getViewModeEnum(int modeIndex) {
    switch (modeIndex) {
      case 0:
        return EpisodeViewModes.list;
      case 1:
        return EpisodeViewModes.grid;
      case 2:
        return EpisodeViewModes.tile;
      default:
        throw Exception("Unknown index for episode view mode enum");
    }
  }

  static int getViewModeIndex(EpisodeViewModes mode) {
    switch (mode) {
      case EpisodeViewModes.tile:
        return 2;
      case EpisodeViewModes.grid:
        return 1;
      case EpisodeViewModes.list:
        return 0;
    }
  }
}

class AnimeSpecificPreference {
  final Map? lastWatchDuration;
  final String? manualSearchQuery;
  final String? preferredProvider;
  final String? previouslyUsedServer;

  AnimeSpecificPreference(
      {this.lastWatchDuration, this.manualSearchQuery, this.preferredProvider, this.previouslyUsedServer});

  @override
  String toString() =>
      'AnimeSpecificPreference(lastWatchDuration: $lastWatchDuration, manualSearchQuery: $manualSearchQuery, '
      'preferredProvider: $preferredProvider, previouslyUsedServer: $previouslyUsedServer)';

  AnimeSpecificPreference copyWith({
    Map? lastWatchDuration,
    String? manualSearchQuery,
    String? preferredProvider,
    String? previouslyUsedServer,
  }) {
    return AnimeSpecificPreference(
      lastWatchDuration: lastWatchDuration ?? this.lastWatchDuration,
      manualSearchQuery: manualSearchQuery ?? this.manualSearchQuery,
      preferredProvider: preferredProvider ?? this.preferredProvider,
      previouslyUsedServer: previouslyUsedServer ?? this.previouslyUsedServer,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'lastWatchDuration': lastWatchDuration,
      'manualSearchQuery': manualSearchQuery,
      'preferredProvider': preferredProvider,
      'previouslyUsedServer': previouslyUsedServer,
    };
  }

  factory AnimeSpecificPreference.fromMap(Map<String, dynamic> map) {
    return AnimeSpecificPreference(
      lastWatchDuration:
          map['lastWatchDuration'] != null ? Map.from(map['lastWatchDuration'] as Map<dynamic, dynamic>) : null,
      manualSearchQuery: map['manualSearchQuery'] != null ? map['manualSearchQuery'] as String : null,
      preferredProvider: map['preferredProvider'] != null ? map['preferredProvider'] as String : null,
      previouslyUsedServer: map['previouslyUsedServer'] != null ? map['previouslyUsedServer'] as String : null,
    );
  }

  String toJson() => json.encode(toMap());

  factory AnimeSpecificPreference.fromJson(String source) =>
      AnimeSpecificPreference.fromMap(json.decode(source) as Map<String, dynamic>);
}
