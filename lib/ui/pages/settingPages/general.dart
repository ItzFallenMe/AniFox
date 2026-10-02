import 'dart:io';

import 'package:anifox/core/app/runtimeDatas.dart';
import 'package:anifox/core/app/settings_backup.dart';
import 'package:anifox/core/data/preferences.dart';
import 'package:anifox/core/data/settings.dart';
import 'package:anifox/core/data/types.dart';
import 'package:anifox/ui/models/snackBar.dart';
import 'package:anifox/ui/models/sources.dart';
import 'package:anifox/ui/models/widgets/clickableItem.dart';
import 'package:anifox/ui/models/widgets/toggleItem.dart';
import 'package:anifox/ui/pages/settingPages/cache.dart';
import 'package:anifox/ui/pages/settingPages/common.dart';
import 'package:anifox/ui/pages/settingPages/plugin.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class GeneralSetting extends StatefulWidget {
  const GeneralSetting({super.key});

  @override
  State<GeneralSetting> createState() => _GeneralSettingState();
}

class _GeneralSettingState extends State<GeneralSetting> {
  @override
  initState() {
    readSettings().then((val) => setState(() {
          loaded = true;
        }));
    super.initState();
  }

  Future<void> readSettings() async {
    final settings = await Settings().getSettings();
    setState(() {
      showErrorsButtonState = settings.showErrors!;
      receivePreReleases = settings.receivePreReleases!;
      fasterDownloads = settings.fasterDownloads!;
      useQueuedDownloads = settings.useQueuedDownloads!;
      enableLogging = settings.enableLogging!;
      startupTab = settings.startupTab ?? 0;
      autoplayNext = settings.autoplayNextEpisode ?? true;
      rememberPosition = settings.rememberPlaybackPosition ?? true;
      showFillerBadges = settings.showFillerBadges ?? true;
      hapticFeedback = settings.hapticFeedback ?? true;
      hideNsfw = settings.hideNsfw ?? true;
      preferredAudio = settings.preferredAudio ?? "sub";
      episodeSortAscending = userPreferences?.episodeSortAscending ?? true;
      showThumbnails = userPreferences?.showEpisodeThumbnails ?? true;
    });
  }

  Future<void> writeSettings(SettingsModal settings) async {
    await Settings().writeSettings(settings);
    setState(() {
      readSettings();
    });
  }

  bool loaded = false;
  bool showErrorsButtonState = false;
  bool receivePreReleases = false;
  bool fasterDownloads = false;
  bool useQueuedDownloads = false;
  bool enableDiscordPresence = false;
  bool useDesktopNativeDiscordPresence = false;
  bool enableLogging = false;
  int startupTab = 0;
  bool autoplayNext = true;
  bool rememberPosition = true;
  bool showFillerBadges = true;
  bool hapticFeedback = true;
  bool hideNsfw = true;
  String preferredAudio = "sub";
  bool episodeSortAscending = true;
  bool showThumbnails = true;
  bool _backupBusy = false;

  final sources = SourceManager.instance.sources;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: appTheme.backgroundColor,
      body: loaded
          ? SingleChildScrollView(
              child: Padding(
                padding: pagePadding(context, bottom: true),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    settingPagesTitleHeader(context, "General"),
                    ToggleItem(
                      label: "Show errors",
                      value: showErrorsButtonState,
                      onTapFunction: () {
                        setState(() {
                          showErrorsButtonState = !showErrorsButtonState;
                        });
                        writeSettings(SettingsModal(showErrors: showErrorsButtonState));
                      },
                    ),
                    ToggleItem(
                      label: "Receive beta updates",
                      value: receivePreReleases,
                      onTapFunction: () {
                        setState(() {
                          receivePreReleases = !receivePreReleases;
                        });
                        writeSettings(SettingsModal(receivePreReleases: receivePreReleases));
                      },
                      description: "*maybe unstable",
                    ),
                    ToggleItem(
                      label: "Quick play",
                      description: "Automatically play the episodes using the last server you used",
                      value: userPreferences?.autoSelectPreviouslyUsedServer ?? false,
                      onTapFunction: () async {
                        await UserPreferences.saveUserPreferences(UserPreferencesModal(
                          autoSelectPreviouslyUsedServer: !(userPreferences?.autoSelectPreviouslyUsedServer ?? false),
                        ));
                        setState(() {});
                      },
                    ),
                    if (Platform.isWindows || Platform.isLinux)
                      ToggleItem(
                        label: "Enable Discord Rich Presence",
                        value: currentUserSettings?.enableDiscordRichPresence ?? false,
                        onTapFunction: () async {
                          await writeSettings(SettingsModal(
                              enableDiscordRichPresence: !(currentUserSettings!.enableDiscordRichPresence ?? false)));
                          setState(() {});
                        },
                      ),
                    ClickableItem(
                      onTap: () {
                        showModalBottomSheet(
                          context: context,
                          showDragHandle: true,
                          isScrollControlled: true,
                          builder: (context) => _providerSheet(context),
                        );
                      },
                      label: "Default provider",
                      description:
                          (currentUserSettings?.preferredProvider ?? sources.first.identifier).replaceAll('_', ' '),
                      suffixIcon: Icon(Icons.arrow_drop_down),
                    ),
                    ClickableItem(
                      onTap: () {
                        Navigator.of(context).push(MaterialPageRoute(builder: (context) => PluginPage()));
                      },
                      label: "Manage Providers",
                      description: "Add or remove providers",
                      suffixIcon: Icon(Icons.navigate_next_rounded),
                    ),
                    ClickableItem(
                      label: "Cache Manager",
                      onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (context) => CacheSetting())),
                      description: "Manage network & API cache",
                      suffixIcon: Icon(Icons.navigate_next_rounded),
                    ),
                    // Got clowned for this decision
                    // ClickableItem(
                    //   label: "Downloader",
                    //   onTap: () =>
                    //       Navigator.of(context).push(MaterialPageRoute(builder: (context) => DownloaderSettings())),
                    //   description: "Configure your downloads",
                    //   suffixIcon: Icon(Icons.navigate_next_rounded),
                    // ),
                    ToggleItem(
                      onTapFunction: () {
                        setState(() {
                          enableLogging = !enableLogging;
                        });
                        writeSettings(SettingsModal(enableLogging: enableLogging));
                      },
                      label: "Enable Logging",
                      description: "Helps with debugging issues",
                      value: enableLogging,
                    ),
                    _sectionTitle("Startup"),
                    ClickableItem(
                      onTap: () => _startupSheet(),
                      label: "Startup tab",
                      description: ["Home", "Discover", "Search"][startupTab.clamp(0, 2)],
                      suffixIcon: const Icon(Icons.arrow_drop_down),
                    ),
                    _sectionTitle("Playback"),
                    ToggleItem(
                      label: "Autoplay next episode",
                      description: "Start the next episode automatically",
                      value: autoplayNext,
                      onTapFunction: () {
                        setState(() => autoplayNext = !autoplayNext);
                        writeSettings(SettingsModal(autoplayNextEpisode: autoplayNext));
                      },
                    ),
                    ToggleItem(
                      label: "Remember playback position",
                      description: "Resume where you left off",
                      value: rememberPosition,
                      onTapFunction: () {
                        setState(() => rememberPosition = !rememberPosition);
                        writeSettings(SettingsModal(rememberPlaybackPosition: rememberPosition));
                      },
                    ),
                    ClickableItem(
                      onTap: () => _audioSheet(),
                      label: "Preferred audio",
                      description: preferredAudio == "dub" ? "Dubbed" : "Subbed",
                      suffixIcon: const Icon(Icons.arrow_drop_down),
                    ),
                    _sectionTitle("Library & episodes"),
                    ToggleItem(
                      label: "Filler / dub badges",
                      description: "Show badges on episode lists",
                      value: showFillerBadges,
                      onTapFunction: () {
                        setState(() => showFillerBadges = !showFillerBadges);
                        writeSettings(SettingsModal(showFillerBadges: showFillerBadges));
                      },
                    ),
                    ToggleItem(
                      label: "Ascending episode order",
                      description: "Oldest episode first",
                      value: episodeSortAscending,
                      onTapFunction: () async {
                        await UserPreferences.saveUserPreferences(
                            UserPreferencesModal(episodeSortAscending: !episodeSortAscending));
                        setState(() => episodeSortAscending = !episodeSortAscending);
                      },
                    ),
                    ToggleItem(
                      label: "Episode thumbnails",
                      description: "Show thumbnails where available",
                      value: showThumbnails,
                      onTapFunction: () async {
                        await UserPreferences.saveUserPreferences(
                            UserPreferencesModal(showEpisodeThumbnails: !showThumbnails));
                        setState(() => showThumbnails = !showThumbnails);
                      },
                    ),
                    ToggleItem(
                      label: "Hide NSFW",
                      description: "Filter adult entries from browse lists",
                      value: hideNsfw,
                      onTapFunction: () {
                        setState(() => hideNsfw = !hideNsfw);
                        writeSettings(SettingsModal(hideNsfw: hideNsfw));
                      },
                    ),
                    _sectionTitle("Feedback"),
                    ToggleItem(
                      label: "Haptic feedback",
                      description: "Vibrate on taps & switches",
                      value: hapticFeedback,
                      onTapFunction: () {
                        setState(() => hapticFeedback = !hapticFeedback);
                        writeSettings(SettingsModal(hapticFeedback: hapticFeedback));
                      },
                    ),
                    _sectionTitle("Backup"),
                    ClickableItem(
                      onTap: _backupBusy ? () {} : _exportBackup,
                      label: "Export settings",
                      description: _backupBusy ? "Working..." : "Save settings as JSON",
                      suffixIcon: const Icon(Icons.upload_rounded),
                    ),
                    ClickableItem(
                      onTap: _backupBusy ? () {} : _importBackup,
                      label: "Import settings",
                      description: "Restore from a backup file",
                      suffixIcon: const Icon(Icons.download_rounded),
                    ),
                  ],
                ),
              ),
            )
          : Container(),
    );
  }

  Widget _sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 20, right: 20, top: 22, bottom: 6),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          title,
          style: textStyle().copyWith(fontSize: 16, color: appTheme.accentColor),
        ),
      ),
    );
  }

  void _startupSheet() {
    const tabs = ["Home", "Discover", "Search"];
    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      builder: (ctx) => Container(
        padding: const EdgeInsets.only(top: 10, left: 20, right: 20, bottom: 30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text("Startup tab", style: textStyle().copyWith(fontSize: 23)),
            ),
            for (int i = 0; i < tabs.length; i++)
              Container(
                margin: const EdgeInsets.symmetric(vertical: 4),
                decoration: BoxDecoration(
                  color: startupTab == i ? appTheme.accentColor : appTheme.backgroundSubColor,
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(15),
                    onTap: () async {
                      await writeSettings(SettingsModal(startupTab: i));
                      setState(() => startupTab = i);
                      if (mounted) Navigator.pop(ctx);
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                      child: Text(
                        tabs[i],
                        style: textStyle().copyWith(
                          color: startupTab == i ? appTheme.onAccent : appTheme.textMainColor,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _audioSheet() {
    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      builder: (ctx) => Container(
        padding: const EdgeInsets.only(top: 10, left: 20, right: 20, bottom: 30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text("Preferred audio", style: textStyle().copyWith(fontSize: 23)),
            ),
            for (final entry in const [("sub", "Subbed"), ("dub", "Dubbed")])
              Container(
                margin: const EdgeInsets.symmetric(vertical: 4),
                decoration: BoxDecoration(
                  color: preferredAudio == entry.$1 ? appTheme.accentColor : appTheme.backgroundSubColor,
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(15),
                    onTap: () async {
                      await writeSettings(SettingsModal(preferredAudio: entry.$1));
                      await UserPreferences.saveUserPreferences(
                          UserPreferencesModal(preferDubs: entry.$1 == "dub"));
                      setState(() => preferredAudio = entry.$1);
                      if (mounted) Navigator.pop(ctx);
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                      child: Text(
                        entry.$2,
                        style: textStyle().copyWith(
                          color: preferredAudio == entry.$1 ? appTheme.onAccent : appTheme.textMainColor,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _exportBackup() async {
    setState(() => _backupBusy = true);
    try {
      final path = await SettingsBackupService.exportToFile();
      await Clipboard.setData(ClipboardData(text: path));
      floatingSnackBar("Backup saved — path copied to clipboard");
    } catch (e) {
      floatingSnackBar("Export failed: $e");
    } finally {
      if (mounted) setState(() => _backupBusy = false);
    }
  }

  Future<void> _importBackup() async {
    setState(() => _backupBusy = true);
    try {
      await SettingsBackupService.importFromFile();
      await readSettings();
      floatingSnackBar("Settings restored — restart may be needed");
    } catch (e) {
      floatingSnackBar("Import cancelled/failed: $e");
    } finally {
      if (mounted) setState(() => _backupBusy = false);
    }
  }

  StatefulBuilder _providerSheet(BuildContext context) {
    return StatefulBuilder(
      builder: (context, setcState) => Container(
        padding: const EdgeInsets.only(
          top: 10,
          left: 20,
          right: 20,
        ),
        margin: EdgeInsets.only(bottom: MediaQuery.paddingOf(context).bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: Text(
                "Select Provider",
                style: textStyle().copyWith(fontSize: 23),
                textAlign: TextAlign.left,
              ),
            ),
            ListView.builder(
                shrinkWrap: true,
                itemCount: sources.length,
                itemBuilder: (context, index) {
                  final activeProvider = currentUserSettings?.preferredProvider ?? sources.first.identifier;
                  return Container(
                    margin: const EdgeInsets.symmetric(vertical: 5),
                    clipBehavior: Clip.hardEdge,
                    decoration: BoxDecoration(
                      color: sources[index].identifier == activeProvider
                          ? appTheme.accentColor
                          : appTheme.backgroundSubColor,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        borderRadius: BorderRadius.circular(20),
                        onTap: () async {
                          await writeSettings(SettingsModal(preferredProvider: sources[index].identifier));
                          setState(() {});
                          setcState(() {});
                        },
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                          child: Text(
                            sources[index].name,
                            style: textStyle().copyWith(
                              color: sources[index].identifier == activeProvider
                                  ? appTheme.onAccent
                                  : appTheme.textMainColor,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }),
          ],
        ),
      ),
    );
  }
}
