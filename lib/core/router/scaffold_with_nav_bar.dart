import 'dart:ui';

import 'dart:async';
import 'dart:io';
import 'package:flutter_single_instance/flutter_single_instance.dart';
import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:anifox/common/widgets/app_logo.dart';
import 'package:anifox/common/widgets/liquid_glass.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:anifox/core/router/app_navigator.dart';
import 'package:anifox/core/router/nav_bar_theme.dart';

import 'package:anifox/common/state/ui_prefs_provider.dart';
import 'package:anifox/core/remote_config/state/remote_config_provider.dart';
import 'package:anifox/core/remote_config/ui/remote_config_ui.dart';
import 'package:anifox/modules/updater/services/update_service.dart';
import 'package:anifox/modules/updater/ui/update_ui.dart';
import 'package:anifox/core/router/app_router.dart';
import 'package:anifox/core/utils/responsive.dart';
import 'package:anifox/common/widgets/app_scaffold.dart';
import 'package:anifox/common/state/navbar_action_provider.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/modules/tv/ui/tv_shell.dart';

final _navBreakpoints = ResponsiveBreakpoints.defaults.copyWith(
  heightNormal: 750,
  heightCompact: 600,
  heightTight: 500,
);

class ScaffoldWithNavBar extends ConsumerStatefulWidget {
  final StatefulNavigationShell navigationShell;
  const ScaffoldWithNavBar({super.key, required this.navigationShell});

  @override
  ConsumerState<ScaffoldWithNavBar> createState() => _ScaffoldWithNavBarState();
}

class _ScaffoldWithNavBarState extends ConsumerState<ScaffoldWithNavBar> {
  late final AppLinks _appLinks;
  StreamSubscription<Uri>? _linkSubscription;

  @override
  void initState() {
    super.initState();
    _initDeepLinks();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkRemoteAnnouncements();
    });
  }

  void _initDeepLinks() {
    _appLinks = AppLinks();
    _linkSubscription = _appLinks.uriLinkStream.listen((uri) {
      _handleDeepLink(uri);
    });
    _appLinks.getInitialLink().then((uri) {
      if (uri != null) _handleDeepLink(uri);
    });

    if (Platform.isWindows || Platform.isLinux || Platform.isMacOS) {
      FlutterSingleInstance.onFocus = (metadata) {
        if (metadata.containsKey('args')) {
          final argsList = metadata['args'] as List<dynamic>?;
          if (argsList != null && argsList.isNotEmpty) {
            for (final arg in argsList) {
              final uri = Uri.tryParse(arg.toString());
              if (uri != null && uri.scheme.isNotEmpty) {
                _handleDeepLink(uri);
                break;
              }
            }
          }
        }
      };
    }
  }

  void _handleDeepLink(Uri uri) {
    final host = uri.host.toLowerCase();

    if (host == 'anilist.co' ||
        host == 'myanimelist.net' ||
        host == 'kitsu.io' ||
        host == 'kitsu.app') {
      final pathSegments = uri.pathSegments;
      if (pathSegments.length >= 2) {
        final mediaTypeStr = pathSegments[0].toLowerCase();
        final id = pathSegments[1];
        MediaType? mediaType;
        if (mediaTypeStr == 'anime') mediaType = MediaType.ANIME;
        if (mediaTypeStr == 'manga') mediaType = MediaType.MANGA;

        if (mediaType != null) {
          String providerId = 'anilist';
          if (host == 'myanimelist.net') providerId = 'myanimelist';
          if (host == 'kitsu.io' || host == 'kitsu.app') providerId = 'kitsu';

          final media = UnifiedMedia(
            id: id,
            title: MediaTitle(english: 'Loading...'),
            type: mediaType,
            providerId: providerId,
          );

          context.pushDetails(mediaType: mediaType, media: media);
          return;
        }
      }
    }

  }

  @override
  void dispose() {
    _linkSubscription?.cancel();
    super.dispose();
  }

  Future<void> _checkRemoteAnnouncements() async {
    final config = await ref.read(remoteConfigStateProvider.future);
    if (config != null && !config.applicationEnabled) return;
    if (!mounted) return;

    final navContext = rootNavigatorKey.currentContext;
    if (navContext == null || !navContext.mounted) return;

    // 1. Check GitHub Release Updates
    try {
      final updatePrefs = ref.read(updatePrefsProvider);
      if (updatePrefs.autoCheckOnStartup) {
        final updateService = ref.read(updateServiceProvider);
        final release = await updateService.checkForUpdate();
        if (release != null && navContext.mounted) {
          await UpdateUI.showReleaseUpdateSheet(
            navContext,
            release: release,
            onDismiss: () => ref
                .read(updatePrefsProvider.notifier)
                .setLastDismissedReleaseId(release.id),
            onDownload: () => ref
                .read(updatePrefsProvider.notifier)
                .setLastSeenReleaseId(release.id),
          );
        }
      }
    } catch (_) {}

    if (!mounted || !navContext.mounted) return;

    // 2. Check Announcements
    final service = ref.read(remoteConfigServiceProvider);
    final announcement = service.getActiveAppAnnouncement();
    if (announcement != null) {
      await RemoteConfigUI.showAnnouncementSheet(
        navContext,
        announcement: announcement,
      );
      await service.markAnnouncementAsSeen(announcement.id);
    }
  }

  @override
  Widget build(BuildContext context) {
    final useNewUi = ref.watch(uiPrefsProvider.select((p) => p.useNewUi));
    if (useNewUi) {
      return TvShell(navigationShell: widget.navigationShell);
    }

    final navBarStyle = ref.watch(uiPrefsProvider.select((p) => p.navBarStyle));
    final isDocked = navBarStyle == NavBarStyle.docked;

    return ResponsiveHandler(
      breakpoints: _navBreakpoints,
      builder: (context, r) {
        return AppScaffold(
          extendBody: !isDocked,
          body: r.isDesktop || r.isTabletLandscape
              ? Row(
                  children: [
                    _SideNavBar(navigationShell: widget.navigationShell),
                    Expanded(
                      child: Stack(
                        children: [
                          widget.navigationShell,
                          _SideNavAttachment(
                            navigationShell: widget.navigationShell,
                          ),
                        ],
                      ),
                    ),
                  ],
                )
              : isDocked
              ? Column(
                  children: [
                    Expanded(child: widget.navigationShell),
                    _BottomNavBar(navigationShell: widget.navigationShell),
                  ],
                )
              : Stack(
                  fit: StackFit.expand,
                  children: [
                    widget.navigationShell,
                    _BottomNavBar(navigationShell: widget.navigationShell),
                  ],
                ),
        );
      },
    );
  }
}

class _NavDest {
  final IconData icon;
  final String label;
  final String location;

  const _NavDest(this.icon, this.label, this.location);
}

const _destinations = [
  _NavDest(Icons.home_outlined, 'Home', '/home'),
  _NavDest(Icons.search_rounded, 'Search', '/search'),
  _NavDest(Icons.tv_outlined, 'TV', '/tv'),
  _NavDest(Icons.auto_awesome_outlined, 'Anime', '/anime'),
  _NavDest(Icons.movie_outlined, 'Movies', '/movies'),
  _NavDest(Icons.library_books_outlined, 'Library', '/library'),
];

int _selectedDestinationIndex(
  BuildContext context,
  StatefulNavigationShell navigationShell,
) {
  final path = GoRouter.of(context).routeInformationProvider.value.uri.path;
  final matchingIndex = _destinations.indexWhere(
    (destination) => destination.location == path,
  );
  if (matchingIndex >= 0) return matchingIndex;

  return switch (navigationShell.currentIndex) {
    1 => 1,
    2 => 5,
    _ => 0,
  };
}

void _selectDestination(
  BuildContext context,
  StatefulNavigationShell navigationShell,
  int index,
) {
  switch (index) {
    case 0:
      navigationShell.goBranch(
        0,
        initialLocation: navigationShell.currentIndex == 0,
      );
      return;
    case 1:
      context.go('/search');
      return;
    case 5:
      navigationShell.goBranch(
        2,
        initialLocation: navigationShell.currentIndex == 2,
      );
      return;
    default:
      context.go(_destinations[index].location);
  }
}

class _BottomNavBar extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;
  const _BottomNavBar({required this.navigationShell});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final r = context.responsive;
    final cs = Theme.of(context).colorScheme;
    final navState = ref.watch(navBarProvider);
    final uiPrefs = ref.watch(uiPrefsProvider);
    final navBarStyle = uiPrefs.navBarStyle;

    if (navState.customBar != null) {
      return SafeArea(
        child: Align(
          alignment: Alignment.bottomCenter,
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: navState.customBar!,
          ),
        ),
      );
    }

    final activeAttachmentWidget = navState.topForBranch(
      navigationShell.currentIndex,
    );

    final isDocked = navBarStyle == NavBarStyle.docked;

    final bottomMargin = isDocked ? 0.0 : r.height * 0.018;
    final selectedIndex = _selectedDestinationIndex(context, navigationShell);

    Widget navBarWidget;

    if (isDocked) {
      navBarWidget = NavigationBar(
        height: 72.0,
        selectedIndex: selectedIndex,
        labelBehavior: NavigationDestinationLabelBehavior.onlyShowSelected,
        onDestinationSelected: (i) =>
            _selectDestination(context, navigationShell, i),
        backgroundColor: cs.surfaceContainer,
        indicatorColor: cs.primaryContainer,
        destinations: [
          ..._destinations.map(
            (d) => NavigationDestination(icon: Icon(d.icon), label: d.label),
          ),
        ],
      );
    } else {
      final uiScale = GlobalUI.uiScaleFactor.clamp(0.85, 1.25);
      final double barHeight =
          (navBarStyle == NavBarStyle.minimal
              ? 54.0
              : (r.isPhone ? 68.0 : 80.0)) *
          uiScale;
      final iconSize = (r.isPhone ? 25.0 : 28.0) * uiScale;
      final fontSize = r.isPhone ? 14.5 : 16.0;
      final hPad = (r.isPhone ? 6.0 : 10.5) * uiScale;

      final vPad = hPad;

      final themeData = NavBarThemeData.resolve(navBarStyle, cs, false, false);
      final barRadius = themeData.barRadius(barHeight);
      final activeItemRadius = themeData.itemRadius(barHeight - 2 * vPad);

      final itemsRow = _buildItemsRow(
        context,
        cs,
        iconSize,
        fontSize,
        activeItemRadius,
        navBarStyle,
        selectedIndex,
        compact: r.isPhone,
      );

      if (uiPrefs.liquidGlass) {
        navBarWidget = LiquidGlass(
          height: barHeight,
          radius: barRadius,
          blur: themeData.blurSigma ?? 6,
          fallbackColor: themeData.barDecoration.color,
          padding: EdgeInsets.symmetric(horizontal: hPad, vertical: vPad),
          child: itemsRow,
        );
      } else {
        final contentWidget = Container(
          height: barHeight,
          padding: EdgeInsets.symmetric(horizontal: hPad, vertical: vPad),
          decoration: themeData.barDecoration.copyWith(
            borderRadius: BorderRadius.circular(barRadius),
          ),
          child: itemsRow,
        );

        final innerContent = themeData.blurSigma != null
            ? BackdropFilter(
                filter: ImageFilter.blur(
                  sigmaX: themeData.blurSigma!,
                  sigmaY: themeData.blurSigma!,
                ),
                child: contentWidget,
              )
            : contentWidget;
        navBarWidget = ClipRRect(
          borderRadius: BorderRadius.circular(barRadius),
          child: innerContent,
        );
      }
    }

    return SafeArea(
      bottom: !isDocked,
      child: Align(
        alignment: Alignment.bottomCenter,
        child: Padding(
          padding: EdgeInsets.only(bottom: bottomMargin),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedSize(
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeOutCubic,
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 200),
                  child: activeAttachmentWidget != null
                      ? KeyedSubtree(
                          key: ValueKey(activeAttachmentWidget.hashCode),
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: activeAttachmentWidget,
                          ),
                        )
                      : const SizedBox.shrink(key: ValueKey('empty_nav_att')),
                ),
              ),
              navBarWidget,
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildItemsRow(
    BuildContext context,
    ColorScheme cs,
    double iconSize,
    double fontSize,
    double itemRadius,
    NavBarStyle navBarStyle,
    int selectedIndex, {
    required bool compact,
  }) {
    final row = Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.start,
      children: List.generate(_destinations.length, (i) {
        final active = selectedIndex == i;
        final themeData = NavBarThemeData.resolve(
          navBarStyle,
          cs,
          active,
          false,
        );

        Widget item = InkWell(
          onTap: () => _selectDestination(context, navigationShell, i),
          borderRadius: BorderRadius.circular(itemRadius),
          focusColor: cs.primary.withValues(alpha: 0.2),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOutCubic,
            height: double.maxFinite,
            padding: EdgeInsets.symmetric(
              horizontal: compact
                  ? (active ? 10 : 8)
                  : (active ? 18 : 14),
            ),
            decoration:
                (active
                        ? themeData.activeItemDecoration
                        : themeData.inactiveItemDecoration)
                    .copyWith(borderRadius: BorderRadius.circular(itemRadius)),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    AnimatedScale(
                      scale: active ? themeData.activeScale : 1.0,
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeOutBack,
                      child: AnimatedOpacity(
                        opacity: active ? 1.0 : 0.55,
                        duration: const Duration(milliseconds: 250),
                        child: Icon(
                          _destinations[i].icon,
                          color: active
                              ? themeData.activeIconColor
                              : themeData.inactiveIconColor,
                          size: iconSize,
                        ),
                      ),
                    ),
                    ClipRect(
                      child: AnimatedSize(
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeOutCubic,
                        child: active
                            ? Padding(
                                padding: const EdgeInsets.only(left: 8),
                                child: Text(
                                  _destinations[i].label,
                                  style: TextStyle(
                                    fontSize: fontSize,
                                    fontWeight: themeData.isMaterial3
                                        ? FontWeight.w500
                                        : FontWeight.w600,
                                    color: themeData.activeTextColor,
                                  ),
                                ),
                              )
                            : const SizedBox.shrink(),
                      ),
                    ),
                  ],
                ),
                if (themeData.showDotIndicator && active) ...[
                  const SizedBox(height: 3),
                  Container(
                    width: 5,
                    height: 5,
                    decoration: BoxDecoration(
                      color: themeData.activeIconColor,
                      shape: BoxShape.circle,
                    ),
                  ),
                ],
              ],
            ),
          ),
        );

        return item;
      }),
    );
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: row,
    );
  }
}

class _SideNavBar extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;
  const _SideNavBar({required this.navigationShell});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final r = context.responsive;
    final cs = Theme.of(context).colorScheme;
    final h = r.heightTier;
    final uiPrefs = ref.watch(uiPrefsProvider);
    final navBarStyle = uiPrefs.navBarStyle;
    final selectedIndex = _selectedDestinationIndex(context, navigationShell);

    final isDocked = navBarStyle == NavBarStyle.docked;

    if (isDocked) {
      return SafeArea(
        child: Container(
          width: 80, // Material standard side rail width
          color: cs.surfaceContainer,
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 18.0, bottom: 18.0),
                child: const AppLogo(size: 32),
              ),
              Expanded(
                child: NavigationRail(
                  selectedIndex: selectedIndex,
                  onDestinationSelected: (i) =>
                      _selectDestination(context, navigationShell, i),
                  backgroundColor: Colors.transparent,
                  indicatorColor: cs.primaryContainer,
                  groupAlignment: 0.0, // Center alignment
                  destinations: [
                    ..._destinations.map(
                      (d) => NavigationRailDestination(
                        icon: Icon(d.icon),
                        label: Text(d.label),
                      ),
                    ),
                  ],
                  labelType: NavigationRailLabelType.all,
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(bottom: 24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _DockedActionItem(
                      icon: const Icon(Icons.settings_outlined),
                      label: 'Settings',
                      isActive: false,
                      onTap: () => context.push('/settings'),
                      cs: cs,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    final barWidth = h.pick(
      spacious: 80.0,
      normal: 72.0,
      compact: 64.0,
      tight: 54.0,
      cramped: 56.0,
    );
    final hPad = isDocked
        ? 0.0
        : h.pick(
            spacious: 10.0,
            normal: 8.0,
            compact: 6.0,
            tight: 6.0,
            cramped: 4.0,
          );
    final vOuterPad = isDocked
        ? 0.0
        : h.pick(
            spacious: 24.0,
            normal: 20.0,
            compact: 16.0,
            tight: 10.0,
            cramped: 6.0,
          );
    final hOuterPad = isDocked
        ? 0.0
        : h.pick(
            spacious: 16.0,
            normal: 16.0,
            compact: 14.0,
            tight: 8.0,
            cramped: 6.0,
          );
    final hideNavLabels = h == HeightTier.cramped;
    final itemsCol = Column(
      children: List.generate(_destinations.length, (i) {
        final active = selectedIndex == i;
        final themeData = NavBarThemeData.resolve(
          navBarStyle,
          cs,
          active,
          false,
        );
        final activeItemRadius = themeData.itemRadius(barWidth);

        return Expanded(
          child: InkWell(
            onTap: () => _selectDestination(context, navigationShell, i),
            borderRadius: BorderRadius.circular(activeItemRadius),
            focusColor: cs.primary.withValues(alpha: 0.2),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 350),
              curve: Curves.easeOutCubic,
              width: double.infinity,
              decoration:
                  (active
                          ? themeData.activeItemDecoration
                          : themeData.inactiveItemDecoration)
                      .copyWith(
                        borderRadius: BorderRadius.circular(activeItemRadius),
                      ),
              child: _PillContent(
                icon: _destinations[i].icon,
                label: _destinations[i].label,
                active: active,
                themeData: themeData,
                heightTier: h,
                forceHideLabel: hideNavLabels,
              ),
            ),
          ),
        );
      }),
    );

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.symmetric(
          vertical: vOuterPad,
          horizontal: hOuterPad,
        ),
        child: _SideBarContainer(
          width: barWidth,
          padding: hPad,
          navBarStyle: navBarStyle,
          cs: cs,
          child: itemsCol,
        ),
      ),
    );
  }
}

class _SideBarContainer extends StatelessWidget {
  final double width;
  final double padding;
  final Widget child;
  final NavBarStyle navBarStyle;
  final ColorScheme cs;

  const _SideBarContainer({
    required this.width,
    required this.padding,
    required this.child,
    required this.navBarStyle,
    required this.cs,
  });

  @override
  Widget build(BuildContext context) {
    final themeData = NavBarThemeData.resolve(navBarStyle, cs, false, false);
    final barRadius = themeData.barRadius(width);

    return SizedBox(
      width: width,
      child: LiquidGlass(
        radius: barRadius,
        blur: themeData.blurSigma ?? 6,
        fallbackColor: themeData.barDecoration.color,
        padding: EdgeInsets.all(padding),
        child: child,
      ),
    );
  }
}

class _PillContent extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  final NavBarThemeData themeData;
  final bool isDownload;
  final HeightTier heightTier;
  final bool forceHideLabel;

  const _PillContent({
    required this.icon,
    required this.label,
    required this.active,
    required this.themeData,
    required this.heightTier,
    this.forceHideLabel = false,
  }) : isDownload = false;

  @override
  Widget build(BuildContext context) {
    final iconSize = heightTier.pick(
      spacious: 26.0,
      normal: 25.0,
      compact: 23.0,
      tight: 21.0,
      cramped: 20.0,
    );
    final labelSize = heightTier.pick(
      spacious: 14.0,
      normal: 14.0,
      compact: 13.0,
      tight: 12.0,
      cramped: 11.0,
    );
    final labelSpacing = heightTier.pick(
      spacious: 2.0,
      normal: 2.0,
      compact: 1.8,
      tight: 1.6,
      cramped: 1.4,
    );
    final labelTopPad = heightTier.pick(
      spacious: 14.0,
      normal: 12.0,
      compact: 10.0,
      tight: 7.0,
      cramped: 5.0,
    );

    final showLabel = !forceHideLabel && (active || isDownload);

    final resolvedColor = active
        ? themeData.activeIconColor
        : (isDownload
              ? themeData.downloadIconColor
              : themeData.inactiveIconColor);
    final resolvedTextColor = active
        ? themeData.activeTextColor
        : themeData.inactiveIconColor;

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        AnimatedScale(
          scale: active ? themeData.activeScale : 1.0,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOutBack,
          child: AnimatedOpacity(
            opacity: active || isDownload ? 1.0 : 0.5,
            duration: const Duration(milliseconds: 250),
            child: Icon(icon, color: resolvedColor, size: iconSize),
          ),
        ),
        ClipRect(
          child: AnimatedSize(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOutCubic,
            child: showLabel
                ? Padding(
                    padding: EdgeInsets.only(top: labelTopPad),
                    child: RotatedBox(
                      quarterTurns: -1,
                      child: Text(
                        label.toUpperCase(),
                        style: TextStyle(
                          fontSize: labelSize,
                          letterSpacing: labelSpacing,
                          fontWeight: themeData.isMaterial3
                              ? FontWeight.w500
                              : FontWeight.bold,
                          color: resolvedTextColor,
                        ),
                      ),
                    ),
                  )
                : const SizedBox.shrink(),
          ),
        ),
        if (themeData.showDotIndicator && active) ...[
          const SizedBox(height: 5),
          Container(
            width: 5,
            height: 5,
            decoration: BoxDecoration(
              color: resolvedColor,
              shape: BoxShape.circle,
            ),
          ),
        ],
      ],
    );
  }
}

class _SideNavAttachment extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;
  const _SideNavAttachment({required this.navigationShell});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final navState = ref.watch(navBarProvider);
    if (navState.customBar != null) {
      return SafeArea(
        child: Align(
          alignment: Alignment.bottomCenter,
          child: Padding(
            padding: const EdgeInsets.only(bottom: 24),
            child: navState.customBar!,
          ),
        ),
      );
    }

    final activeWidget = navState.topForBranch(navigationShell.currentIndex);

    return SafeArea(
      child: Align(
        alignment: Alignment.bottomCenter,
        child: Padding(
          padding: const EdgeInsets.only(bottom: 24),
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 250),
            child: activeWidget ?? const SizedBox.shrink(),
          ),
        ),
      ),
    );
  }
}

class _DockedActionItem extends StatelessWidget {
  final Widget icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;
  final ColorScheme cs;

  const _DockedActionItem({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onTap,
    required this.cs,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
              decoration: BoxDecoration(
                color: isActive ? cs.primaryContainer : Colors.transparent,
                borderRadius: BorderRadius.circular(16),
              ),
              child: IconTheme(
                data: IconThemeData(
                  color: isActive ? cs.onPrimaryContainer : cs.onSurfaceVariant,
                ),
                child: icon,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: isActive ? cs.onPrimaryContainer : cs.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
