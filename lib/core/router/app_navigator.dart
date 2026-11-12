import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:anifox/modules/browse/models/models/search_filter_options.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/modules/playback/models/player_mode.dart';
import 'package:anifox/modules/reader/models/reader_mode.dart';
import 'package:anifox/core/services/backup_service.dart';

extension AppNavigator on BuildContext {
  // Splash & Onboarding & Home
  void goHome() => go('/home');
  void goOnboarding() => go('/onboarding');

  // Settings
  void pushSettings() => push('/settings');
  void pushSettingsPermissions() => push('/settings/permissions');
  void pushSettingsNotifications() => push('/settings/notifications');
  void pushSettingsTracking() => push('/settings/tracking');
  void pushSettingsRemoteConfigEditor() =>
      push('/settings/remote_config_editor');
  void pushSettingsContent() => push('/settings/content');
  void pushSettingsTheme() => push('/settings/theme');
  void pushSettingsHome() => push('/settings/home');
  void pushSettingsPlayer() => push('/settings/player');
  void pushSettingsReader() => push('/settings/reader');
  void pushSettingsCache() => push('/settings/cache');
  void pushSettingsUi() => push('/settings/ui');
  void pushSettingsBackup() => push('/settings/backup');
  void pushSettingsBackupPreview(BackupManifest manifest) =>
      push('/settings/backup/preview', extra: manifest);
  void pushSettingsDebug() => push('/settings/debug');
  void pushSettingsLogs() => push('/settings/logs');
  void pushSettingsUpdates() => push('/settings/updates');
  void pushSettingsAbout() => push('/settings/about');
  void pushSettingsSecurity() => push('/settings/security');

  // Details
  void pushDetails({
    required MediaType mediaType,
    required UnifiedMedia media,
    int initialTabIndex = 0,
    Object? autoPlayMode,
    String tag = 'details',
  }) {
    push(
      '/details/${mediaType.id}?tag=$tag',
      extra: {
        'media': media,
        'initialTabIndex': initialTabIndex,
        'autoPlayMode': autoPlayMode,
      },
    );
  }

  void pushReplacementDetails({
    required MediaType mediaType,
    required UnifiedMedia media,
    int initialTabIndex = 0,
    Object? autoPlayMode,
    String tag = 'details',
  }) {
    pushReplacement(
      '/details/${mediaType.id}?tag=$tag',
      extra: {
        'media': media,
        'initialTabIndex': initialTabIndex,
        'autoPlayMode': autoPlayMode,
      },
    );
  }

  // Player & Reader
  void pushPlayer(PlayerMode mode) => push('/player', extra: mode);
  void pushReader(ReaderModeOnline mode) => push('/reader', extra: mode);

  // Discover & Library & Calendar
  void pushDownloads() => push('/downloads');
  void pushLibrary() => push('/library');
  void pushCalendar() => push('/calendar');
  void pushDiscover({
    String? query,
    String? source,
    MediaType? type,
    List<String>? genres,
    List<String>? tags,
    String? category,
    String? title,
    SearchSort? sort,
    SearchStatusFilter? status,
    SearchFormatFilter? format,
  }) {
    final queryParams = <String, dynamic>{};
    if (query != null && query.isNotEmpty) queryParams['query'] = query;
    if (source != null) queryParams['source'] = source;
    if (type != null) queryParams['type'] = type.id;
    if (genres != null && genres.isNotEmpty) queryParams['genres'] = genres;
    if (tags != null && tags.isNotEmpty) queryParams['tags'] = tags;
    if (category != null) queryParams['category'] = category;
    if (title != null) queryParams['title'] = title;
    if (sort != null && sort != SearchSort.popularity) {
      queryParams['sort'] = sort.name;
    }
    if (status != null && status != SearchStatusFilter.all) {
      queryParams['status'] = status.name;
    }
    if (format != null && format != SearchFormatFilter.all) {
      queryParams['format'] = format.name;
    }

    final uri = Uri(
      path: '/filtered_discover',
      queryParameters: queryParams.isEmpty ? null : queryParams,
    );
    push(uri.toString());
  }

  void pushFilteredDiscover({
    String? query,
    String? source,
    MediaType? type,
    List<String>? genres,
    List<String>? tags,
    String? category,
    String? title,
    SearchSort? sort,
    SearchStatusFilter? status,
    SearchFormatFilter? format,
  }) => pushDiscover(
    query: query,
    source: source,
    type: type,
    genres: genres,
    tags: tags,
    category: category,
    title: title,
    sort: sort,
    status: status,
    format: format,
  );

  void goDiscover({
    String? query,
    String? source,
    MediaType? type,
    List<String>? genres,
    List<String>? tags,
    String? category,
  }) {
    final queryParams = <String, dynamic>{};
    if (query != null && query.isNotEmpty) queryParams['query'] = query;
    if (source != null) queryParams['source'] = source;
    if (type != null) queryParams['type'] = type.id;
    if (genres != null && genres.isNotEmpty) queryParams['genres'] = genres;
    if (tags != null && tags.isNotEmpty) queryParams['tags'] = tags;
    if (category != null) queryParams['category'] = category;

    final uri = Uri(
      path: '/discover',
      queryParameters: queryParams.isEmpty ? null : queryParams,
    );
    go(uri.toString());
  }

  // Downloads

  // History / Continue
  void pushContinueHistory(MediaType type) => push('/continue/${type.id}');
  void pushContinueHistoryItem(MediaType type, String mediaId) =>
      push('/continue/${type.id}/${Uri.encodeComponent(mediaId)}');
}
