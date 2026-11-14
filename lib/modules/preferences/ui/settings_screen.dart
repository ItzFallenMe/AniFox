import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:anifox/core/router/app_navigator.dart';
import 'package:anifox/modules/preferences/ui/widgets/settings_ui_components.dart';
import 'package:anifox/common/widgets/app_scaffold.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AppScaffold(
      title: 'Settings',
      body: ListView(
        padding: const EdgeInsets.only(bottom: 50),
        children: [
          SettingsSection(
            title: 'General',
            children: [
              SettingsNavTile(
                icon: Icons.palette_outlined,
                title: 'Appearance',
                subtitle: 'Theme, pure black, accent colors',
                onTap: () => context.pushSettingsTheme(),
              ),
              SettingsNavTile(
                icon: Icons.video_settings_outlined,
                title: 'Player',
                subtitle: 'Gestures, default quality, skips',
                onTap: () => context.pushSettingsPlayer(),
              ),
              SettingsNavTile(
                icon: Icons.chrome_reader_mode_outlined,
                title: 'Reader',
                subtitle: 'Reading mode, background, scale',
                onTap: () => context.pushSettingsReader(),
              ),
              SettingsNavTile(
                icon: Icons.download_for_offline_outlined,
                title: 'Downloads',
                subtitle: 'Offline episodes, progress and storage',
                onTap: () => context.pushDownloads(),
              ),
              SettingsNavTile(
                icon: Icons.filter_alt_outlined,
                title: 'Content',
                subtitle: 'Content filters, 18+ toggle',
                onTap: () => context.pushSettingsContent(),
              ),
              SettingsNavTile(
                icon: Icons.lock_outline_rounded,
                title: 'Security & Privacy',
                subtitle: 'PIN lock, biometrics, app protection',
                onTap: () => context.pushSettingsSecurity(),
              ),
              if (Platform.isAndroid) ...[
                SettingsNavTile(
                  icon: Icons.security_outlined,
                  title: 'Permissions',
                  subtitle: 'Manage app permissions',
                  onTap: () => context.pushSettingsPermissions(),
                ),
              ],
            ],
          ),

          SettingsSection(
            title: 'Data & Sync',
            children: [
              SettingsNavTile(
                icon: Icons.sync_outlined,
                title: 'Tracking',
                subtitle: 'AniList, MyAnimeList connections',
                onTap: () => context.pushSettingsTracking(),
              ),
              SettingsNavTile(
                icon: Icons.import_export_outlined,
                title: 'Backup & Restore',
                subtitle: 'Export or import your data',
                onTap: () => context.pushSettingsBackup(),
              ),
            ],
          ),

          SettingsSection(
            title: 'UI',
            children: [
              SettingsNavTile(
                icon: Icons.view_comfortable_outlined,
                title: 'UI',
                subtitle: 'UI settings',
                onTap: () => context.pushSettingsUi(),
              ),
              SettingsNavTile(
                icon: Icons.home_outlined,
                title: 'Home',
                subtitle: 'Home screen settings',
                onTap: () => context.pushSettingsHome(),
              ),
            ],
          ),

          if (Platform.isAndroid || Platform.isIOS || Platform.isMacOS)
            SettingsSection(
              title: 'Notifications',
              children: [
                SettingsNavTile(
                  icon: Icons.notifications_active_outlined,
                  title: 'Manage Notifications',
                  subtitle: 'Manage your active subscriptions and reminders',
                  onTap: () => context.pushSettingsNotifications(),
                ),
              ],
            ),

          SettingsSection(
            title: 'Misc',
            children: [
              SettingsNavTile(
                icon: Icons.storage_outlined,
                title: 'Cache Manager',
                subtitle: 'Clear cache and thumbnails',
                onTap: () => context.pushSettingsCache(),
              ),
              SettingsNavTile(
                icon: Icons.system_update_outlined,
                title: 'Updates',
                subtitle: 'Check for updates and pre-release preferences',
                onTap: () => context.pushSettingsUpdates(),
              ),
              SettingsNavTile(
                icon: Icons.info_outline_rounded,
                title: 'About',
                subtitle: 'Version, developer, and links',
                onTap: () => context.pushSettingsAbout(),
              ),
            ],
          ),

          SettingsSection(
            title: 'Advanced',
            children: [
              SettingsNavTile(
                icon: Icons.bug_report_outlined,
                title: 'Debug',
                subtitle: 'Test notifications and UI components',
                onTap: () => context.pushSettingsDebug(),
              ),
              SettingsNavTile(
                icon: Icons.article_outlined,
                title: 'Logs',
                subtitle: 'View, copy, and export app logs',
                onTap: () => context.pushSettingsLogs(),
              ),
            ],
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}
