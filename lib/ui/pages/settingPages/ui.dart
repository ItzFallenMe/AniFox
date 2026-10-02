import 'dart:io';

import 'package:anifox/core/app/appearance.dart';
import 'package:anifox/core/app/runtimeDatas.dart';
import 'package:anifox/core/data/settings.dart';
import 'package:anifox/core/data/theme.dart';
import 'package:anifox/core/data/types.dart';
import 'package:anifox/ui/models/popup.dart';
import 'package:anifox/ui/models/widgets/clickableItem.dart';
import 'package:anifox/ui/models/widgets/slider.dart';
import 'package:anifox/ui/models/snackBar.dart';
import 'package:anifox/ui/models/widgets/toggleItem.dart';
import 'package:anifox/ui/pages/settingPages/common.dart';
import 'package:anifox/ui/models/providers/appProvider.dart';
import 'package:anifox/ui/theme/resolve.dart';
import 'package:anifox/ui/theme/themes.dart';
import 'package:anifox/ui/theme/types.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class ThemeSetting extends StatefulWidget {
  const ThemeSetting({super.key});

  @override
  State<ThemeSetting> createState() => _ThemeSettingState();
}

class _ThemeSettingState extends State<ThemeSetting> {
  @override
  void initState() {
    super.initState();
    readSettings();
    getAPILevel();
  }

  void getAPILevel() {
    if (Platform.isAndroid)
      DeviceInfoPlugin().androidInfo.then((val) => isAboveAndroid12 = (val.version.sdkInt >= 31));
    else
      isAboveAndroid12 = true;
  }

  void readSettings() {
    getTheme().then((value) => setState(() {
          currentThemeId = value;
        }));
    AMOLEDBackgroundEnabled = currentUserSettings?.amoledBackground ?? false;
    navbarTranslucency = currentUserSettings?.navbarTranslucency ?? 0.6;
    darkMode = currentUserSettings?.darkMode ?? true;
    materialTheme = currentUserSettings?.materialTheme ?? false;
    nativeTitle = currentUserSettings?.nativeTitle ?? false;
    useOldNavbar = currentUserSettings?.useOldNavbar ?? false;
    appFontFamily = currentUserSettings?.appFontFamily ?? "NotoSans";
    useCustomAccent = currentUserSettings?.useCustomAccent ?? false;
    customAccentColor = currentUserSettings?.customAccentColor;
    cardCornerRadius = currentUserSettings?.cardCornerRadius ?? 15.0;
    gridColumns = currentUserSettings?.gridColumns ?? 3;
    homeShowContinueWatching = currentUserSettings?.homeShowContinueWatching ?? true;
    homeShowTrending = currentUserSettings?.homeShowTrending ?? true;
    homeShowTopAiring = currentUserSettings?.homeShowTopAiring ?? true;
    // borderlessWindow = currentUserSettings?.useFramelessWindow ?? true;
  }

  // Future<void> setThemeMode(bool isDark) async {

  // }

  Future<void> applyTheme(int id) async {
    await setTheme(id);
    final theme = availableThemes.where((themeItem) => themeItem.id == id).toList()[0];
    Provider.of<AppProvider>(context, listen: false).applyTheme(darkMode ? theme.theme : theme.lightVariant);
  }

  int? currentThemeId;

  late double navbarTranslucency;
  late bool AMOLEDBackgroundEnabled;
  late bool darkMode;
  late bool isAboveAndroid12;
  late bool materialTheme;
  late bool useNewHomeScreen;
  late bool nativeTitle;
  late bool useOldNavbar;
  late String appFontFamily;
  late bool useCustomAccent;
  late int? customAccentColor;
  late double cardCornerRadius;
  late int gridColumns;
  late bool homeShowContinueWatching;
  late bool homeShowTrending;
  late bool homeShowTopAiring;
  // late bool borderlessWindow;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // backgroundColor: appTheme.backgroundColor,
      body: SingleChildScrollView(
        child: Padding(
          padding: pagePadding(context, bottom: true),
          child: Column(
            children: [
              settingPagesTitleHeader(context, "UI"),
              Container(
                child: currentThemeId != null
                    ? Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ToggleItem(
                              label: "Material Theme",
                              value: materialTheme,
                              description: "wallpaper dependent theme",
                              onTapFunction: () async {
                                //the package just wont work if <android 12!!!
                                if (!isAboveAndroid12) return floatingSnackBar("Android 12 or greater is required");
                                materialTheme = !materialTheme;
                                await Settings().writeSettings(SettingsModal(materialTheme: materialTheme));
                                setState(() {});
                                if (materialTheme) {
                                  return Provider.of<AppProvider>(context, listen: false).justRefresh();
                                }
                                final t =
                                    availableThemes.where((themeItem) => themeItem.id == currentThemeId).toList()[0];
                                Provider.of<AppProvider>(context, listen: false)
                                    .applyTheme(darkMode ? t.theme : t.lightVariant);
                              }),
                          _themes(),
                          Container(
                            padding: EdgeInsets.only(left: 20, right: 20, top: 10, bottom: 10),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  "Theme Mode",
                                  style: textStyle(),
                                ),
                                SegmentedButton(
                                  segments: [
                                    ButtonSegment(
                                        value: false,
                                        icon: Icon(Icons.wb_sunny_rounded,
                                            color: !darkMode ? appTheme.onAccent : appTheme.textMainColor)),
                                    ButtonSegment(
                                        value: true,
                                        icon: Icon(
                                          Icons.nights_stay_rounded,
                                          color: darkMode ? appTheme.onAccent : appTheme.accentColor,
                                        ))
                                  ],
                                  selected: {darkMode},
                                  multiSelectionEnabled: false,
                                  showSelectedIcon: false,
                                  emptySelectionAllowed: false,
                                  onSelectionChanged: (val) async {
                                    darkMode = val.first;
                                    await Settings().writeSettings(SettingsModal(darkMode: darkMode));

                                    await Provider.of<AppProvider>(context, listen: false).applyThemeMode(darkMode);
                                    // await setThemeMode(val.first);
                                    setState(() {});
                                  },
                                  style: SegmentedButton.styleFrom(
                                    selectedBackgroundColor: appTheme.accentColor,
                                    selectedForegroundColor: appTheme.onAccent, //not workin for some reason
                                    foregroundColor: appTheme.textMainColor,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          ToggleItem(
                            onTapFunction: () async {
                              nativeTitle = !nativeTitle;
                              setState(() {});
                              await Settings().writeSettings(SettingsModal(nativeTitle: nativeTitle));
                              Provider.of<AppProvider>(context, listen: false).justRefresh();
                            },
                            label: "Prefer Native Titles",
                            value: nativeTitle,
                          ),
                          ToggleItem(
                            label: "AMOLED Background",
                            value: AMOLEDBackgroundEnabled,
                            onTapFunction: () async {
                              final thm = availableThemes.firstWhere((i) => i.id == currentThemeId);
                              AMOLEDBackgroundEnabled = !AMOLEDBackgroundEnabled;
                              await Settings().writeSettings(SettingsModal(amoledBackground: AMOLEDBackgroundEnabled));
                              appTheme = ThemeResolver.resolveAppTheme(
                                theme: thm,
                                darkMode: darkMode,
                                amoledBackground: AMOLEDBackgroundEnabled,
                                useCustomAccent: currentUserSettings?.useCustomAccent ?? false,
                                customAccentColor: currentUserSettings?.customAccentColor,
                              );
                              Provider.of<AppProvider>(context, listen: false).justRefresh();
                              setState(() {});
                            },
                            description: "Full black background",
                          ),
                          ToggleItem(
                            onTapFunction: () async {
                              setState(() {
                                useOldNavbar = !useOldNavbar;
                              });
                              await Settings().writeSettings(SettingsModal(useOldNavbar: useOldNavbar));
                              Provider.of<AppProvider>(context, listen: false).justRefresh();
                            },
                            label: "Use Old Navbar",
                            value: useOldNavbar,
                            mobileOnly: true,
                          ),
                          if (Platform.isAndroid && useOldNavbar)
                            Padding(
                              padding: EdgeInsets.only(top: 10, bottom: 10, left: 10, right: 10),
                              child: _sliderItem("Navbar Transparency", navbarTranslucency,
                                  min: 0,
                                  max: 1,
                                  description: "Transparency of the navbar",
                                  onChangedFunction: (val) {
                                    setState(() {
                                      navbarTranslucency = val;
                                    });
                                  },
                                  divisions: 10,
                                  onDragEnd: (val) async {
                                    await Settings().writeSettings(
                                      SettingsModal(navbarTranslucency: navbarTranslucency),
                                    );
                                    Provider.of<AppProvider>(context, listen: false).justRefresh();
                                  }),
                            ),
                          _sectionTitle("Appearance"),
                          ClickableItem(
                            label: "App font",
                            description: appFontFamily,
                            suffixIcon: Icon(Icons.arrow_drop_down, color: appTheme.textMainColor),
                            onTap: () => _fontSheet(),
                          ),
                          ToggleItem(
                            label: "Custom accent color",
                            description: "Override theme accent",
                            value: useCustomAccent,
                            onTapFunction: () async {
                              useCustomAccent = !useCustomAccent;
                              await Settings().writeSettings(SettingsModal(useCustomAccent: useCustomAccent));
                              Provider.of<AppProvider>(context, listen: false).justRefresh();
                              setState(() {});
                            },
                          ),
                          if (useCustomAccent) _accentGrid(),
                          Padding(
                            padding: EdgeInsets.only(top: 10, bottom: 10, left: 10, right: 10),
                            child: _sliderItem("Card corner radius", cardCornerRadius,
                                min: 4,
                                max: 28,
                                description: "Roundness of cards & tiles",
                                divisions: 12, onChangedFunction: (val) {
                              setState(() {
                                cardCornerRadius = val;
                              });
                            }, onDragEnd: (val) async {
                              await Settings()
                                  .writeSettings(SettingsModal(cardCornerRadius: cardCornerRadius));
                              Provider.of<AppProvider>(context, listen: false).justRefresh();
                            }),
                          ),
                          ClickableItem(
                            label: "Grid columns",
                            description: "$gridColumns per row",
                            suffixIcon: Icon(Icons.arrow_drop_down, color: appTheme.textMainColor),
                            onTap: () => _gridSheet(),
                          ),
                          _sectionTitle("Home sections"),
                          ToggleItem(
                            label: "Continue watching",
                            value: homeShowContinueWatching,
                            onTapFunction: () async {
                              homeShowContinueWatching = !homeShowContinueWatching;
                              await Settings().writeSettings(
                                  SettingsModal(homeShowContinueWatching: homeShowContinueWatching));
                              setState(() {});
                            },
                          ),
                          ToggleItem(
                            label: "Trending row",
                            value: homeShowTrending,
                            onTapFunction: () async {
                              homeShowTrending = !homeShowTrending;
                              await Settings()
                                  .writeSettings(SettingsModal(homeShowTrending: homeShowTrending));
                              setState(() {});
                            },
                          ),
                          ToggleItem(
                            label: "Top airing row",
                            value: homeShowTopAiring,
                            onTapFunction: () async {
                              homeShowTopAiring = !homeShowTopAiring;
                              await Settings()
                                  .writeSettings(SettingsModal(homeShowTopAiring: homeShowTopAiring));
                              setState(() {});
                            },
                          ),
                        ],
                      )
                    : Container(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sliderItem(
    String label,
    double variable, {
    required void Function(double) onChangedFunction,
    required double min,
    required double max,
    String? description,
    int divisions = 10,
    void Function(double)? onDragStart,
    void Function(double)? onDragEnd,
  }) {
    return item(
      child: Container(
        padding: EdgeInsets.only(left: 10, right: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: textStyle(),
            ),
            if (description != null)
              Text(
                description,
                style: textStyle().copyWith(color: appTheme.textSubColor, fontSize: 12),
              ),
            Padding(
              padding: const EdgeInsets.only(top: 30),
              child: CustomSlider(
                min: min,
                max: max,
                onChanged: onChangedFunction,
                onDragStart: onDragStart,
                onDragEnd: onDragEnd,
                divisions: divisions,
                value: variable,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _themes() {
    return ClickableItem(
      label: "Themes",
      description: "Change your themes",
      suffixIcon: Icon(
        Icons.keyboard_arrow_down_rounded,
        color: appTheme.textMainColor,
      ),
      onTap: () {
        showPopup(
          context: context,
          isScrollControlledSheet: true,
          showSheetHandle: true,
          builder: (BuildContext context) => Container(
            width: Platform.isWindows ? MediaQuery.sizeOf(context).width / 3 : null,
            padding: EdgeInsets.only(
              top: 12,
              left: 20,
              right: 20,
              bottom: 12,
            ),
            margin: EdgeInsets.only(bottom: MediaQuery.of(context).padding.bottom),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.only(left: 10, bottom: 20),
                  child: Text(
                    "Select Theme",
                    style: textStyle().copyWith(
                      fontSize: 23,
                    ),
                  ),
                ),
                Container(
                  height: MediaQuery.of(context).orientation == Orientation.landscape
                      ? MediaQuery.of(context).size.height / 2
                      : MediaQuery.of(context).size.height / 3 + 120,
                  child: ListView.builder(
                    padding: EdgeInsets.zero,
                    shrinkWrap: true,
                    itemCount: availableThemes.length,
                    itemBuilder: (context, index) {
                      return _themeItem(availableThemes[index].name, availableThemes[index], context);
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Container item({required Widget child}) {
    return Container(
      padding: EdgeInsets.only(top: 15, bottom: 15),
      child: child,
    );
  }

  Widget _themeItem(String name, ThemeItem theme, context) {
    bool isSelected = currentThemeId == theme.id;
    return AnimatedContainer(
      margin: EdgeInsets.only(top: 5, bottom: 5),
      clipBehavior: Clip.hardEdge,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: isSelected ? appTheme.accentColor.withAlpha(150) : appTheme.backgroundSubColor,
        border: Border.all(
          color: isSelected ? theme.theme.accentColor : Colors.transparent,
          width: 2,
        ),
      ),
      duration: Duration(milliseconds: 200),
      height: 60,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () async {
            if (currentThemeId != theme.id) {
              await applyTheme(theme.id);
              setState(() {
                currentThemeId = theme.id;
              });
              // Navigator.of(context).pop();
            }
          },
          child: Padding(
            padding: const EdgeInsets.only(left: 10, right: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "$name",
                  style: textStyle().copyWith(color: isSelected ? appTheme.onAccent : appTheme.textMainColor),
                ),
                Container(
                  height: 40,
                  width: 40,
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.black, width: 3),
                    borderRadius: BorderRadius.circular(10),
                    color: theme.theme.accentColor,
                  ),
                )
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    super.dispose();
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

  void _fontSheet() {
    showPopup(
      context: context,
      showSheetHandle: true,
      isScrollControlledSheet: true,
      builder: (ctx) => Container(
        padding: const EdgeInsets.only(top: 12, left: 20, right: 20, bottom: 20),
        margin: EdgeInsets.only(bottom: MediaQuery.of(context).padding.bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 10, bottom: 12),
              child: Text("App font", style: textStyle().copyWith(fontSize: 23)),
            ),
            for (final font in Appearance.availableFonts)
              Container(
                margin: const EdgeInsets.symmetric(vertical: 4),
                decoration: BoxDecoration(
                  color: appFontFamily == font ? appTheme.accentColor : appTheme.backgroundSubColor,
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(15),
                    onTap: () async {
                      appFontFamily = font;
                      await Settings().writeSettings(SettingsModal(appFontFamily: font));
                      Provider.of<AppProvider>(context, listen: false).justRefresh();
                      setState(() {});
                      if (mounted) Navigator.pop(ctx);
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                      child: Text(
                        font,
                        style: TextStyle(
                          fontFamily: font,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: appFontFamily == font ? appTheme.onAccent : appTheme.textMainColor,
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

  Widget _accentGrid() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Wrap(
        spacing: 12,
        runSpacing: 12,
        children: [
          for (final color in Appearance.accentPresets)
            GestureDetector(
              onTap: () async {
                customAccentColor = color.toARGB32();
                await Settings().writeSettings(SettingsModal(
                  useCustomAccent: true,
                  customAccentColor: color.toARGB32(),
                ));
                Provider.of<AppProvider>(context, listen: false).justRefresh();
                setState(() {});
              },
              child: Container(
                height: 44,
                width: 44,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: customAccentColor == color.toARGB32() ? appTheme.textMainColor : Colors.transparent,
                    width: 3,
                  ),
                ),
                child: customAccentColor == color.toARGB32()
                    ? const Icon(Icons.check_rounded, color: Colors.white, size: 22)
                    : null,
              ),
            ),
        ],
      ),
    );
  }

  void _gridSheet() {
    showPopup(
      context: context,
      showSheetHandle: true,
      builder: (ctx) => Container(
        padding: const EdgeInsets.only(top: 12, left: 20, right: 20, bottom: 20),
        margin: EdgeInsets.only(bottom: MediaQuery.of(context).padding.bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 10, bottom: 12),
              child: Text("Grid columns", style: textStyle().copyWith(fontSize: 23)),
            ),
            for (int i = 2; i <= 6; i++)
              Container(
                margin: const EdgeInsets.symmetric(vertical: 4),
                decoration: BoxDecoration(
                  color: gridColumns == i ? appTheme.accentColor : appTheme.backgroundSubColor,
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(15),
                    onTap: () async {
                      gridColumns = i;
                      await Settings().writeSettings(SettingsModal(gridColumns: i));
                      Provider.of<AppProvider>(context, listen: false).justRefresh();
                      setState(() {});
                      if (mounted) Navigator.pop(ctx);
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                      child: Text(
                        "$i per row",
                        style: textStyle().copyWith(
                          color: gridColumns == i ? appTheme.onAccent : appTheme.textMainColor,
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
}
