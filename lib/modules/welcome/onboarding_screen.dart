import 'dart:io';
import 'package:anifox/common/widgets/smart_image.dart';
import 'package:flutter/foundation.dart';
import 'package:anifox/modules/tracking/models/models/tracker_type.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter/material.dart';
import 'package:anifox/common/widgets/app_logo.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:anifox/core/router/app_navigator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:collection/collection.dart';
import 'package:anifox/modules/browse/models/models/home_section.dart';
import 'package:anifox/modules/browse/state/home_layout_provider.dart';
import 'package:anifox/modules/tracking/models/models/tracker_category.dart';
import 'package:anifox/modules/tracking/models/models/tracked_status.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/common/state/theme_prefs_provider.dart';
import 'package:anifox/modules/tracking/state/tracker_auth_provider.dart';
import 'package:anifox/modules/welcome/onboarding_provider.dart';
import 'package:anifox/modules/tracking/engine/remote_tracker.dart';
import 'package:anifox/modules/tracking/state/tracker_registry.dart';
import 'package:anifox/common/widgets/permission_sheet.dart';
import 'package:anifox/common/widgets/svg_icon.dart';
import 'package:flex_color_scheme/flex_color_scheme.dart';
import 'package:anifox/modules/browse/ui/widgets/cards/media_card.dart';
import 'package:anifox/modules/browse/ui/widgets/continue/continue_card_layout.dart';
import 'package:anifox/common/state/ui_prefs_provider.dart';

enum _CardTarget { browse, watching, reading }

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentIndex = 0;
  int _selectedContentFocus = 2;
  _CardTarget _selectedCardTarget = _CardTarget.browse;

  bool get _isMobile => !kIsWeb && (Platform.isAndroid || Platform.isIOS);
  int get _totalPages => _isMobile ? 7 : 6;

  void _nextPage() {
    if (_pageController.hasClients) {
      final int targetPage =
          (_pageController.page?.round() ?? _currentIndex) + 1;

      if (targetPage < _totalPages) {
        _pageController.animateToPage(
          targetPage,
          duration: const Duration(milliseconds: 500),
          curve: Curves.fastOutSlowIn,
        );
      } else {
        _finishOnboarding();
      }
    }
  }

  void _finishOnboarding() {
    ref.read(onboardingProvider.notifier).completeOnboarding();
    if (mounted) {
      context.goHome();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 500),
              color: cs.surface,
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16.0,
                    vertical: 4.0,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      AnimatedOpacity(
                        opacity:
                            (_currentIndex > 0 &&
                                _currentIndex < _totalPages - 1)
                            ? 1.0
                            : 0.0,
                        duration: const Duration(milliseconds: 250),
                        curve: Curves.easeInOut,
                        child: IgnorePointer(
                          ignoring:
                              !(_currentIndex > 0 &&
                                  _currentIndex < _totalPages - 1),
                          child: TextButton(
                            onPressed: _finishOnboarding,
                            style: TextButton.styleFrom(
                              foregroundColor: cs.onSurfaceVariant,
                            ),
                            child: const Text(
                              'Skip',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: PageView(
                    controller: _pageController,
                    onPageChanged: (index) {
                      setState(() => _currentIndex = index);
                    },
                    physics: const BouncingScrollPhysics(),
                    children: [
                      _buildWelcomePage(theme, cs),
                      _buildContentFocusPage(theme, cs),
                      _buildThemePage(theme, cs),
                      _buildCardStylePage(theme, cs),
                      _buildDiscoveryGuidePage(theme, cs),
                      _buildTrackersPage(theme, cs),
                      if (_isMobile) _buildNotificationsPage(theme, cs),
                    ],
                  ),
                ),
                _buildBottomControls(theme, cs),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomControls(ThemeData theme, ColorScheme cs) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 600),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: List.generate(_totalPages, (index) {
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.only(right: 8),
                    height: 8,
                    width: _currentIndex == index ? 32 : 8,
                    decoration: BoxDecoration(
                      color: _currentIndex == index
                          ? cs.primary
                          : cs.onSurface.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  );
                }),
              ),
              FilledButton(
                onPressed: _nextPage,
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 16,
                  ),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  child: Text(
                    _currentIndex == _totalPages - 1 ? 'Get Started' : 'Next',
                    key: ValueKey(_currentIndex == _totalPages - 1),
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWelcomePage(ThemeData theme, ColorScheme cs) {
    return _buildPageLayout(
      title: 'Welcome to AniFox',
      description:
          'Your premium, ad-free gateway to discovering and tracking the best anime and manga.',
      customIcon: const AppLogo(size: 110),
      theme: theme,
      cs: cs,
      customWidget: Padding(
        padding: const EdgeInsets.only(top: 24, left: 24, right: 24),
        child: Wrap(
          alignment: WrapAlignment.center,
          spacing: 12,
          runSpacing: 12,
          children: [
            FilledButton.icon(
              onPressed: () => launchUrl(
                Uri.parse('https://github.com/itzfallenme/anifox'),
                mode: LaunchMode.externalApplication,
              ),
              icon: const SvgIcon(
                '''<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16">
                    <path d="M0 0h16v16H0z" fill="none" />
                    <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
                      <path d="m5.75 14.25s-.5-2 .5-3c0 0-2 0-3.5-1.5s-1-4.5 0-5.5c-.5-1.5.5-2.5.5-2.5s1.5 0 2.5 1c1-.5 3.5-.5 4.5 0 1-1 2.5-1 2.5-1s1 1 .5 2.5c1 1 1.5 4 0 5.5s-3.5 1.5-3.5 1.5c1 1 .5 3 .5 3" />
                      <path d="m5.25 13.75c-1.5.5-3-.5-3.5-1" />
                    </g>
                  </svg>
                ''',
                size: 24,
                color: Colors.white,
              ),
              label: const Text('GitHub'),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF24292E),
                foregroundColor: Colors.white,
              ),
            ),
            FilledButton.icon(
              onPressed: () => launchUrl(
                Uri.parse('https://buymeacoffee.com/itzfallenme'),
                mode: LaunchMode.externalApplication,
              ),
              icon: const SvgIcon(
                '''<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 512 512">
                    <path d="M0 0h512v512H0z" fill="none" />
                    <path fill="#fd0" d="M268.4 236.5c-18.4 7.9-39.3 16.8-66.3 16.8c-11.3 0-22.6-1.6-33.5-4.6l18.7 192.1c.7 8 4.3 15.5 10.2 21s13.7 8.5 21.7 8.5c0 0 26.5 1.4 35.4 1.4c9.5 0 38.1-1.4 38.1-1.4c8.1 0 15.8-3 21.7-8.5s9.6-12.9 10.2-21l20-212.2c-9-3.1-18-5.1-28.2-5.1c-17.4-.1-31.6 6-48 13" />
                    <path fill="#0d0c22" d="m431.3 136.8l-2.8-14.2c-2.5-12.7-8.3-24.8-21.4-29.4c-4.2-1.5-9-2.1-12.2-5.2s-4.2-7.8-4.9-12.2c-1.4-8.1-2.7-16.1-4.1-24.2c-1.2-6.9-2.2-14.7-5.4-21c-4.1-8.5-12.7-13.5-21.2-16.8c-4.4-1.6-8.8-3-13.4-4.1C324.6 4.1 302.2 2 280.3.8c-26.3-1.5-52.7-1-78.9 1.3c-19.5 1.8-40.1 3.9-58.7 10.7c-6.8 2.5-13.8 5.4-18.9 10.7c-6.3 6.4-8.4 16.4-3.8 24.4c3.3 5.7 8.9 9.7 14.8 12.4q11.55 5.1 24 7.8c22.9 5.1 46.7 7.1 70.1 7.9c26 1 52 .2 77.8-2.5c6.4-.7 12.8-1.5 19.1-2.5c7.5-1.2 12.3-11 10.1-17.8c-2.6-8.2-9.8-11.3-17.8-10.1c-1.2.2-2.4.4-3.5.5l-.9.1c-2.7.3-5.4.7-8.2 1c-5.6.6-11.3 1.1-16.9 1.5c-12.7.9-25.4 1.3-38 1.3c-12.5 0-24.9-.4-37.4-1.2c-5.7-.4-11.3-.8-17-1.4c-2.6-.3-5.1-.6-7.7-.9l-2.4-.3l-.5-.1l-2.5-.4c-5.2-.8-10.3-1.7-15.4-2.8c-.5-.1-1-.4-1.3-.8s-.5-.9-.5-1.5c0-.5.2-1 .5-1.5c.3-.4.8-.7 1.3-.8h.1c4.4-.9 8.9-1.7 13.4-2.5c1.5-.2 3-.5 4.5-.7c2.8-.2 5.6-.7 8.4-1c24.3-2.5 48.7-3.4 73.1-2.6c11.8.3 23.7 1 35.5 2.2c2.5.3 5.1.5 7.6.8c1 .1 1.9.3 2.9.4l2 .3c5.7.8 11.4 1.9 17 3.1c8.4 1.8 19.1 2.4 22.8 11.6c1.2 2.9 1.7 6.1 2.4 9.2l.8 3.9v.2c2 9.2 3.9 18.4 5.9 27.6q.15 1.05 0 2.1c-.1.7-.4 1.3-.8 1.9s-.9 1-1.5 1.4s-1.3.6-1.9.7h-.1l-1.2.2l-1.2.2c-3.8.5-7.6 1-11.3 1.4c-7.5.8-14.9 1.6-22.4 2.2c-14.9 1.2-29.7 2-44.7 2.4q-11.4.3-22.8.3c-30.2 0-60.4-1.8-90.5-5.3c-3.3-.4-6.5-.8-9.8-1.2c2.5.3-1.8-.2-2.7-.4c-2.1-.3-4.1-.6-6.2-.9c-6.9-1-13.8-2.3-20.8-3.4c-8.4-1.4-16.4-.7-23.9 3.4c-6.2 3.4-11.2 8.6-14.4 14.9c-3.3 6.8-4.2 14.1-5.7 21.4s-3.7 15.1-2.9 22.5c1.9 16.1 13.1 29.1 29.2 32c15.2 2.8 30.5 5 45.8 6.9c60.2 7.4 121 8.3 181.4 2.6l14.7-1.5c1.5-.2 3.1 0 4.5.5q2.25.75 3.9 2.4t2.4 3.9c.5 1.5.7 3 .5 4.5l-1.5 14.9c-3.1 30-6.2 60.1-9.2 90.1c-3.2 31.5-6.4 63.1-9.7 94.6c-.9 8.9-1.8 17.8-2.8 26.6c-.9 8.7-1 17.8-2.7 26.4c-2.6 13.6-11.8 21.9-25.2 25c-12.3 2.8-24.9 4.3-37.5 4.4c-14 .1-27.9-.5-41.9-.5c-14.9.1-33.2-1.3-44.7-12.4c-10.1-9.8-11.5-25-12.9-38.2c-1.8-17.5-3.7-35-5.5-52.4L158 284.7l-6.6-62.9c-.1-1-.2-2.1-.3-3.1c-.8-7.5-6.1-14.8-14.5-14.5c-7.2.3-15.3 6.4-14.5 14.5l4.9 46.6l10 96.4c2.9 27.4 5.7 54.8 8.6 82.2c.6 5.2 1.1 10.5 1.6 15.8c3.1 28.7 25.1 44.1 52.2 48.5c15.8 2.5 32.1 3.1 48.1 3.3c20.6.3 41.4 1.1 61.7-2.6c30-5.5 52.6-25.6 55.8-56.7c.9-9 1.8-18 2.8-27c3.1-29.7 6.1-59.4 9.1-89.2l10-97.1l4.6-44.5c.2-2.2 1.2-4.3 2.7-5.9s3.5-2.7 5.7-3.2c8.6-1.7 16.8-4.5 22.9-11.1c10-10.1 11.9-23.7 8.5-37.4m-323.1 9.6c.1-.1-.1 1.1-.2 1.6c-.1-.8 0-1.5.2-1.6m.8 6.5c.1 0 .3.2.5.6c-.3-.4-.6-.6-.5-.6m.8 1.1c.3.5.5.8 0 0m1.7 1.3l.1.1s-.1 0-.1-.1m288.2-2c-3.1 2.9-7.7 4.3-12.3 5c-51.5 7.6-103.8 11.5-155.9 9.8c-37.3-1.3-74.2-5.4-111.1-10.6c-3.6-.5-7.5-1.2-10-3.8c-4.7-5-2.4-15.2-1.2-21.2c1.1-5.6 3.3-13 9.9-13.8c10.3-1.2 22.3 3.1 32.6 4.7c12.3 1.9 24.7 3.4 37.1 4.5c52.9 4.8 106.7 4.1 159.4-3c9.6-1.3 19.2-2.8 28.7-4.5c8.5-1.5 17.9-4.4 23 4.4c3.5 6 4 14 3.4 20.8c-.1 2.9-1.4 5.7-3.6 7.7" />
                  </svg>
                ''',
              ),
              label: const Text('Support'),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFFFDD00),
                foregroundColor: Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContentFocusPage(ThemeData theme, ColorScheme cs) {
    return _buildPageLayout(
      title: 'What Are You Exploring?',
      description:
          'Pick your content focus. We\'ll curate your initial home feed accordingly.',
      icon: Icons.explore_rounded,
      theme: theme,
      cs: cs,
      customWidget: Padding(
        padding: const EdgeInsets.only(top: 24),
        child: Column(
          children: [
            SizedBox(
              width: 340,
              child: SegmentedButton<int>(
                segments: const [
                  ButtonSegment(
                    value: 0,
                    icon: Icon(Icons.tv_rounded),
                    label: Text('Anime'),
                  ),
                  ButtonSegment(
                    value: 1,
                    icon: Icon(Icons.auto_stories_rounded),
                    label: Text('Manga'),
                  ),
                  ButtonSegment(
                    value: 2,
                    icon: Icon(Icons.auto_awesome_rounded),
                    label: Text('Both'),
                  ),
                ],
                selected: {_selectedContentFocus},
                onSelectionChanged: (Set<int> newSelection) {
                  final val = newSelection.first;
                  setState(() => _selectedContentFocus = val);
                  ref
                      .read(userHomeLayoutProvider.notifier)
                      .setupHomeLayoutForContentPreference(
                        includeAnime: val == 0 || val == 2,
                        includeManga: val == 1 || val == 2,
                      );
                },
                showSelectedIcon: false,
                style: SegmentedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 12,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: Text(
                _selectedContentFocus == 0
                    ? 'Curates your home feed for anime streaming and seasonal releases.'
                    : _selectedContentFocus == 1
                    ? 'Curates your home feed for manga reading and chapter tracking.'
                    : 'Curates your home feed for both anime watching and manga reading.',
                key: ValueKey(_selectedContentFocus),
                style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildThemePage(ThemeData theme, ColorScheme cs) {
    final themePrefs = ref.watch(themePrefsProvider);
    final notifier = ref.read(themePrefsProvider.notifier);

    final isDark =
        themePrefs.themeMode == ThemeMode.dark ||
        (themePrefs.themeMode == ThemeMode.system &&
            MediaQuery.platformBrightnessOf(context) == Brightness.dark);

    final curatedSchemes = [
      (FlexScheme.deepBlue, 'Deep Blue', const Color(0xFF1565C0)),
      (FlexScheme.redM3, 'Crimson', const Color(0xFFB3261E)),
      (FlexScheme.sakura, 'Sakura', const Color(0xFFCE5B78)),
      (FlexScheme.greenM3, 'Emerald', const Color(0xFF2E6C38)),
      (FlexScheme.deepPurple, 'Purple', const Color(0xFF6750A4)),
      (FlexScheme.mandyRed, 'Sunset', const Color(0xFFCD5758)),
    ];

    return _buildPageLayout(
      title: 'Choose Your Vibe',
      description: isDark
          ? 'Set your theme mode, pick your signature accent color, and enable pitch-black AMOLED.'
          : 'Set your theme mode and pick your signature accent color.',
      icon: Icons.palette_rounded,
      theme: theme,
      cs: cs,
      customWidget: Padding(
        padding: const EdgeInsets.only(top: 16),
        child: Column(
          children: [
            SizedBox(
              width: 260,
              child: SegmentedButton<ThemeMode>(
                segments: const [
                  ButtonSegment(
                    value: ThemeMode.system,
                    icon: Icon(Icons.brightness_auto_rounded),
                    tooltip: 'System',
                  ),
                  ButtonSegment(
                    value: ThemeMode.light,
                    icon: Icon(Icons.light_mode_rounded),
                    tooltip: 'Light',
                  ),
                  ButtonSegment(
                    value: ThemeMode.dark,
                    icon: Icon(Icons.dark_mode_rounded),
                    tooltip: 'Dark',
                  ),
                ],
                selected: {themePrefs.themeMode},
                onSelectionChanged: (Set<ThemeMode> newSelection) {
                  notifier.updateTheme(
                    (p) => p.copyWith(themeMode: newSelection.first),
                  );
                },
                showSelectedIcon: false,
                style: SegmentedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
            const SizedBox(height: 28),

            Wrap(
              spacing: 16,
              runSpacing: 12,
              alignment: WrapAlignment.center,
              children: curatedSchemes.map((scheme) {
                final isSelected = themePrefs.flexScheme == scheme.$1;
                return Tooltip(
                  message: scheme.$2,
                  child: InkWell(
                    onTap: () => notifier.setStandardScheme(scheme.$1),
                    borderRadius: BorderRadius.circular(24),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: scheme.$3,
                        shape: BoxShape.circle,
                        border: isSelected
                            ? Border.all(color: cs.onSurface, width: 3)
                            : Border.all(
                                color: cs.outlineVariant.withValues(alpha: 0.4),
                                width: 1.5,
                              ),
                        boxShadow: isSelected
                            ? [
                                BoxShadow(
                                  color: scheme.$3.withValues(alpha: 0.4),
                                  blurRadius: 10,
                                  spreadRadius: 2,
                                ),
                              ]
                            : null,
                      ),
                      child: isSelected
                          ? const Center(
                              child: Icon(
                                Icons.check_rounded,
                                color: Colors.white,
                                size: 20,
                              ),
                            )
                          : null,
                    ),
                  ),
                );
              }).toList(),
            ),

            AnimatedSize(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeInOut,
              child: isDark
                  ? Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const SizedBox(height: 28),
                        SwitchListTile.adaptive(
                          secondary: Icon(
                            Icons.contrast_rounded,
                            color: themePrefs.useAmoled
                                ? cs.primary
                                : cs.onSurfaceVariant,
                          ),
                          title: const Text(
                            'Pure Black (AMOLED)',
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 15,
                            ),
                          ),
                          subtitle: Text(
                            'Deep pitch-black backgrounds for OLED displays',
                            style: TextStyle(
                              fontSize: 12,
                              color: cs.onSurfaceVariant,
                            ),
                          ),
                          value: themePrefs.useAmoled,
                          onChanged: (val) {
                            notifier.updateTheme(
                              (p) => p.copyWith(
                                useAmoled: val,
                                useGradients: val ? false : p.useGradients,
                                useNoiseOverlay: val
                                    ? false
                                    : p.useNoiseOverlay,
                                clearWallpaperSettings: val,
                              ),
                            );
                          },
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 4,
                          ),
                        ),
                      ],
                    )
                  : const SizedBox.shrink(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCardStylePage(ThemeData theme, ColorScheme cs) {
    final uiPrefs = ref.watch(uiPrefsProvider);
    final uiNotifier = ref.read(uiPrefsProvider.notifier);

    final availableTargets = [
      _CardTarget.browse,
      if (_selectedContentFocus != 1) _CardTarget.watching,
      if (_selectedContentFocus != 0) _CardTarget.reading,
    ];

    final effectiveTarget = availableTargets.contains(_selectedCardTarget)
        ? _selectedCardTarget
        : _CardTarget.browse;

    final currentStyle = effectiveTarget == _CardTarget.watching
        ? uiPrefs.continueWatchingStyle
        : (effectiveTarget == _CardTarget.reading
              ? uiPrefs.continueReadingStyle
              : uiPrefs.cardStyle);

    final isWide = effectiveTarget == _CardTarget.watching
        ? uiPrefs.isContinueWatchingWide(currentStyle.name)
        : (effectiveTarget == _CardTarget.reading
              ? uiPrefs.isContinueReadingWide(currentStyle.name)
              : uiPrefs.isMediaCardWide(currentStyle.name));

    final styles = [
      (MediaCardStyle.classic, 'Classic', Icons.grid_view_rounded),
      (MediaCardStyle.minimal, 'Minimal', Icons.crop_portrait_rounded),
      (MediaCardStyle.expressive, 'Expressive', Icons.bubble_chart_rounded),
      (MediaCardStyle.neon, 'Neon', Icons.blur_on_rounded),
      (MediaCardStyle.editorial, 'Editorial', Icons.newspaper_rounded),
      (MediaCardStyle.material, 'Material', Icons.view_quilt_rounded),
    ];

    final scale = ref.watch(themePrefsProvider.select((s) => s.uiScaleFactor));
    final isManga = _selectedContentFocus == 1;
    final isWatching = effectiveTarget == _CardTarget.watching;
    final isReading = effectiveTarget == _CardTarget.reading;

    final layout = currentStyle.getScaledLayout(
      scale,
      isContinueWatching: isWatching,
      isContinueReading: isReading,
      isWideMode: isWide,
    );

    Widget previewCard;
    if (isWatching) {
      previewCard = ContinueCardLayout(
        variant: currentStyle.name,
        width: layout.width,
        height: layout.height,
        isActive: false,
        isLoading: false,
        isWideMode: isWide,
        title: "Frieren: Beyond Journey's End",
        subtitle: 'EP 18 • Well, It\'s a Long Journey',
        progress: 0.65,
        progressText: '14:20 / 24:00',
        badgeText: 'EP 18',
        imageUrl: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg',
        fallbackIcon: Icons.play_circle_outline_rounded,
        badgeType: 'WATCHING',
      );
    } else if (isReading) {
      previewCard = ContinueCardLayout(
        variant: currentStyle.name,
        width: layout.width,
        height: layout.height,
        isActive: false,
        isLoading: false,
        isWideMode: isWide,
        title: "Frieren: Beyond Journey's End",
        subtitle: 'Ch 45 • The First-Class Exam',
        progress: 0.75,
        progressText: 'Ch 45/60',
        badgeText: 'CH 45',
        imageUrl: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg',
        fallbackIcon: Icons.auto_stories_rounded,
        badgeType: 'READING',
      );
    } else {
      previewCard = MediaCard(
        media: UnifiedMedia(
          id: 'onboarding_preview',
          type: isManga ? MediaType.MANGA : MediaType.ANIME,
          title: MediaTitle(english: "Frieren: Beyond Journey's End"),
          cover: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg',
          format: isManga ? 'Manga' : 'TV',
          score: 9.1,
          year: 2023,
          status: 'Finished',
          genres: const ['Adventure', 'Fantasy'],
        ),
        tag: 'onboarding_preview_card',
        progress: 0.65,
        progressText: isManga ? 'Ch 45/60' : 'Ep 18/28',
        style: currentStyle,
        onTap: () {},
      );
    }

    return _buildPageLayout(
      title: 'Card Presentation Style',
      description: effectiveTarget == _CardTarget.watching
          ? 'Customize how continue watching anime episode cards look on your feed.'
          : (effectiveTarget == _CardTarget.reading
                ? 'Customize how continue reading manga chapter cards look on your feed.'
                : 'Customize how anime and manga discovery cards look throughout the app.'),
      icon: Icons.dashboard_outlined,
      theme: theme,
      cs: cs,
      customWidget: Padding(
        padding: const EdgeInsets.only(top: 16),
        child: Column(
          children: [
            SizedBox(
              width: availableTargets.length == 3 ? 370 : 310,
              child: SegmentedButton<_CardTarget>(
                segments: [
                  const ButtonSegment(
                    value: _CardTarget.browse,
                    icon: Icon(Icons.grid_view_rounded, size: 16),
                    label: Text('Browse'),
                  ),
                  if (_selectedContentFocus != 1)
                    const ButtonSegment(
                      value: _CardTarget.watching,
                      icon: Icon(Icons.play_circle_outline_rounded, size: 16),
                      label: Text('Watching'),
                    ),
                  if (_selectedContentFocus != 0)
                    const ButtonSegment(
                      value: _CardTarget.reading,
                      icon: Icon(Icons.auto_stories_rounded, size: 16),
                      label: Text('Reading'),
                    ),
                ],
                selected: {effectiveTarget},
                onSelectionChanged: (set) {
                  setState(() => _selectedCardTarget = set.first);
                },
                showSelectedIcon: false,
                style: SegmentedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 10,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),

            SizedBox(
              height: 250,
              child: Center(
                child: SizedBox(
                  width: layout.width,
                  height: layout.height,
                  child: previewCard,
                ),
              ),
            ),
            const SizedBox(height: 16),

            Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.center,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                ...styles.map((s) {
                  final isSelected = currentStyle == s.$1;
                  return ChoiceChip(
                    avatar: Icon(s.$3, size: 16),
                    label: Text(s.$2),
                    selected: isSelected,
                    onSelected: (selected) {
                      if (selected) {
                        if (effectiveTarget == _CardTarget.watching) {
                          uiNotifier.updateContinueWatchingStyle(s.$1);
                        } else if (effectiveTarget == _CardTarget.reading) {
                          uiNotifier.updateContinueReadingStyle(s.$1);
                        } else {
                          uiNotifier.updateCardStyle(s.$1);
                        }
                      }
                    },
                  );
                }),
                FilterChip(
                  avatar: Icon(
                    isWide
                        ? Icons.table_rows_rounded
                        : Icons.crop_portrait_rounded,
                    size: 16,
                  ),
                  label: Text(isWide ? 'Wide Mode' : 'Portrait Mode'),
                  selected: isWide,
                  onSelected: (_) {
                    if (effectiveTarget == _CardTarget.watching) {
                      uiNotifier.toggleContinueWatchingWide(currentStyle.name);
                    } else if (effectiveTarget == _CardTarget.reading) {
                      uiNotifier.toggleContinueReadingWide(currentStyle.name);
                    } else {
                      uiNotifier.toggleMediaCardWide(currentStyle.name);
                    }
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDiscoveryGuidePage(ThemeData theme, ColorScheme cs) {
    final homeSections = ref.watch(userHomeLayoutProvider);
    final layoutNotifier = ref.read(userHomeLayoutProvider.notifier);


    final isMangaMode = _selectedContentFocus == 1;
    final isBothMode = _selectedContentFocus == 2;
    final defaultMedia = isMangaMode ? MediaType.MANGA : MediaType.ANIME;
    final defaultLabel = isMangaMode ? 'Manga' : 'Anime';

    final hasContinue = homeSections.any(
      (s) => s.type == HomeSectionType.continueMedia,
    );
    final hasTrending = homeSections.any(
      (s) => s.trackerCategory == TrackerCategory.trending,
    );
    final hasUpcoming = homeSections.any(
      (s) => s.trackerCategory == TrackerCategory.upcoming,
    );
    final hasPopular = homeSections.any(
      (s) => s.trackerCategory == TrackerCategory.popular,
    );
    final hasTopRated = homeSections.any(
      (s) => s.trackerCategory == TrackerCategory.topRated,
    );

    bool hasLibraryStatus(TrackedStatus status) {
      return homeSections.any(
        (s) =>
            s.type == HomeSectionType.libraryStatus &&
            s.libraryStatus == status,
      );
    }

    final selectableStatuses = [
      TrackedStatus.watching,
      TrackedStatus.planning,
      TrackedStatus.completed,
      TrackedStatus.paused,
      TrackedStatus.dropped,
    ];

    return _buildPageLayout(
      title: 'Initial Home & Discovery Setup',
      description:
          'Customize your initial Home Feed layout and pick your preferred discovery engine.',
      icon: Icons.dashboard_customize_rounded,
      theme: theme,
      cs: cs,
      customWidget: Padding(
        padding: const EdgeInsets.only(top: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'DISCOVERY ENGINE',
              style: theme.textTheme.labelMedium?.copyWith(
                color: cs.primary,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.1,
              ),
            ),
            const SizedBox(height: 8),
            const SizedBox(height: 6),
            Text(
              '• Discovery rows (Trending, Popular, etc.) are powered by AniList/MAL metadata.',
              style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
            ),
            const SizedBox(height: 20),

            Text(
              'CONTINUE SECTION',
              style: theme.textTheme.labelMedium?.copyWith(
                color: cs.primary,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.1,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                FilterChip(
                  avatar: const Icon(
                    Icons.play_circle_outline_rounded,
                    size: 16,
                  ),
                  label: Text(
                    isMangaMode
                        ? 'Continue Reading'
                        : (isBothMode
                              ? 'Continue Watching & Reading'
                              : 'Continue Watching'),
                  ),
                  selected: hasContinue,
                  onSelected: (val) {
                    if (val) {
                      if (isMangaMode) {
                        layoutNotifier.addSection(
                          const HomeSection(
                            id: 'continue_manga',
                            title: 'Continue Reading',
                            type: HomeSectionType.continueMedia,
                            targetMediaType: MediaType.MANGA,
                          ),
                        );
                      } else if (isBothMode) {
                        layoutNotifier.addSection(
                          const HomeSection(
                            id: 'continue_anime',
                            title: 'Continue Watching',
                            type: HomeSectionType.continueMedia,
                            targetMediaType: MediaType.ANIME,
                          ),
                        );
                        layoutNotifier.addSection(
                          const HomeSection(
                            id: 'continue_manga',
                            title: 'Continue Reading',
                            type: HomeSectionType.continueMedia,
                            targetMediaType: MediaType.MANGA,
                          ),
                        );
                      } else {
                        layoutNotifier.addSection(
                          const HomeSection(
                            id: 'continue_anime',
                            title: 'Continue Watching',
                            type: HomeSectionType.continueMedia,
                            targetMediaType: MediaType.ANIME,
                          ),
                        );
                      }
                    } else {
                      final targets = homeSections
                          .where((s) => s.type == HomeSectionType.continueMedia)
                          .toList();
                      for (final t in targets) {
                        layoutNotifier.removeSection(t.id);
                      }
                    }
                  },
                ),
              ],
            ),
            const SizedBox(height: 20),

            Text(
              'LIBRARY SECTIONS (BY STATUS)',
              style: theme.textTheme.labelMedium?.copyWith(
                color: cs.primary,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.1,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: selectableStatuses.map((status) {
                final isSelected = hasLibraryStatus(status);
                final label = isMangaMode
                    ? status.getLabelForMedia(MediaType.MANGA)
                    : status.getLabelForMedia(MediaType.ANIME);
                return FilterChip(
                  avatar: const Icon(
                    Icons.collections_bookmark_rounded,
                    size: 16,
                  ),
                  label: Text(label),
                  selected: isSelected,
                  onSelected: (val) {
                    if (val) {
                      layoutNotifier.addSection(
                        HomeSection(
                          id: 'library_${status.name}_${defaultMedia.name}',
                          title: '$label $defaultLabel',
                          type: HomeSectionType.libraryStatus,
                          libraryStatus: status,
                          targetMediaType: defaultMedia,
                        ),
                      );
                    } else {
                      final targets = homeSections
                          .where(
                            (s) =>
                                s.type == HomeSectionType.libraryStatus &&
                                (s.libraryStatus == status ||
                                    s.libraryStatus == null),
                          )
                          .toList();
                      for (final t in targets) {
                        layoutNotifier.removeSection(t.id);
                      }
                    }
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 20),

            Text(
              'TRACKER DISCOVERY CATEGORIES',
              style: theme.textTheme.labelMedium?.copyWith(
                color: cs.primary,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.1,
              ),
            ),
            const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  FilterChip(
                    avatar: const Icon(
                      Icons.local_fire_department_rounded,
                      size: 16,
                    ),
                    label: Text('Trending $defaultLabel'),
                    selected: hasTrending,
                    onSelected: (val) {
                      if (val) {
                        layoutNotifier.addSection(
                          HomeSection(
                            id: 'trending_${defaultMedia.name}',
                            title: 'Trending $defaultLabel',
                            type: HomeSectionType.discovery,
                            trackerCategory: TrackerCategory.trending,
                            targetMediaType: defaultMedia,
                          ),
                        );
                      } else {
                        final target = homeSections.firstWhereOrNull(
                          (s) => s.trackerCategory == TrackerCategory.trending,
                        );
                        if (target != null) {
                          layoutNotifier.removeSection(target.id);
                        }
                      }
                    },
                  ),
                  if (!isMangaMode)
                    FilterChip(
                      avatar: const Icon(Icons.rocket_launch_rounded, size: 16),
                      label: Text('Upcoming $defaultLabel'),
                      selected: hasUpcoming,
                      onSelected: (val) {
                        if (val) {
                          layoutNotifier.addSection(
                            HomeSection(
                              id: 'upcoming_${defaultMedia.name}',
                              title: 'Upcoming $defaultLabel',
                              type: HomeSectionType.discovery,
                              trackerCategory: TrackerCategory.upcoming,
                              targetMediaType: defaultMedia,
                            ),
                          );
                        } else {
                          final target = homeSections.firstWhereOrNull(
                            (s) =>
                                s.trackerCategory == TrackerCategory.upcoming,
                          );
                          if (target != null) {
                            layoutNotifier.removeSection(target.id);
                          }
                        }
                      },
                    ),
                  FilterChip(
                    avatar: const Icon(Icons.emoji_events_rounded, size: 16),
                    label: Text('Popular $defaultLabel'),
                    selected: hasPopular,
                    onSelected: (val) {
                      if (val) {
                        layoutNotifier.addSection(
                          HomeSection(
                            id: 'popular_${defaultMedia.name}',
                            title: 'Popular $defaultLabel',
                            type: HomeSectionType.discovery,
                            trackerCategory: TrackerCategory.popular,
                            targetMediaType: defaultMedia,
                          ),
                        );
                      } else {
                        final target = homeSections.firstWhereOrNull(
                          (s) => s.trackerCategory == TrackerCategory.popular,
                        );
                        if (target != null) {
                          layoutNotifier.removeSection(target.id);
                        }
                      }
                    },
                  ),
                  FilterChip(
                    avatar: const Icon(Icons.star_rounded, size: 16),
                    label: Text('Top Rated $defaultLabel'),
                    selected: hasTopRated,
                    onSelected: (val) {
                      if (val) {
                        layoutNotifier.addSection(
                          HomeSection(
                            id: 'top_rated_${defaultMedia.name}',
                            title: 'Top Rated $defaultLabel',
                            type: HomeSectionType.discovery,
                            trackerCategory: TrackerCategory.topRated,
                            targetMediaType: defaultMedia,
                          ),
                        );
                      } else {
                        final target = homeSections.firstWhereOrNull(
                          (s) => s.trackerCategory == TrackerCategory.topRated,
                        );
                        if (target != null) {
                          layoutNotifier.removeSection(target.id);
                        }
                      }
                    },
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrackersPage(ThemeData theme, ColorScheme cs) {
    final authTokens = ref.watch(authTokensProvider).value ?? {};
    final allTrackers = ref.watch(availableTrackersProvider);

    return _buildPageLayout(
      title: 'Sync Your Progress',
      description:
          'Link your AniList or MyAnimeList account to effortlessly sync your watch history across devices.',
      icon: Icons.sync_rounded,
      theme: theme,
      cs: cs,
      customWidget: Padding(
        padding: const EdgeInsets.only(top: 20),
        child: Column(
          children: allTrackers.whereType<RemoteTracker>().map((tracker) {
            final isLoggedIn = authTokens.containsKey(tracker.type);
            final profileName = tracker.type.getProfile(ref)?.username;

            return ListTile(
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 6,
              ),
              leading: isLoggedIn
                  ? Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: cs.primary, width: 2),
                      ),
                      child: ClipOval(
                        child: SmartImage(
                          imageUrl:
                              tracker.type.getProfile(ref)?.avatarUrl ?? '',
                          fit: BoxFit.cover,
                          placeholder: (context, url) =>
                              const CircularProgressIndicator(strokeWidth: 2),
                          errorWidget: (context, url, error) =>
                              const Icon(Icons.person_outline),
                        ),
                      ),
                    )
                  : Padding(
                      padding: const EdgeInsets.all(4.0),
                      child: tracker.type.getIconWidget(
                        color: cs.onSurface,
                        size: 32,
                      ),
                    ),
              title: Text(
                tracker.type.displayName,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              subtitle: Text(
                isLoggedIn ? 'Logged in as $profileName' : 'Not linked',
                style: TextStyle(
                  color: isLoggedIn ? cs.primary : cs.onSurfaceVariant,
                  fontWeight: FontWeight.w600,
                ),
              ),
              trailing: FilledButton.tonalIcon(
                style: FilledButton.styleFrom(
                  backgroundColor: isLoggedIn
                      ? cs.errorContainer
                      : cs.primaryContainer,
                  foregroundColor: isLoggedIn
                      ? cs.onErrorContainer
                      : cs.onPrimaryContainer,
                ),
                onPressed: () {
                  if (isLoggedIn) {
                    ref.read(authTokensProvider.notifier).logout(tracker);
                  } else {
                    ref.read(authTokensProvider.notifier).login(tracker);
                  }
                },
                icon: Icon(isLoggedIn ? Icons.logout : Icons.login, size: 18),
                label: Text(isLoggedIn ? 'Unlink' : 'Link'),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildNotificationsPage(ThemeData theme, ColorScheme cs) {
    return _buildPageLayout(
      title: 'Stay Updated',
      description:
          'Never miss an episode. Allow notifications to receive background download progress and timely release reminders.',
      icon: Icons.notifications_active_rounded,
      theme: theme,
      cs: cs,
      customWidget: Padding(
        padding: const EdgeInsets.only(top: 24),
        child: FilledButton.icon(
          onPressed: () async {
            final notifGranted = await PermissionSheet.show(
              context,
              permission: Permission.notification,
              title: 'Allow Notifications',
              description:
                  'AniFox needs notification access to keep you updated.',
              rationale:
                  'This allows the app to show background download progress and notify you when new episodes of your tracked anime are released.',
            );

            bool alarmGranted = false;
            if (Platform.isAndroid && mounted) {
              alarmGranted = await PermissionSheet.show(
                context,
                permission: Permission.scheduleExactAlarm,
                title: 'Exact Alarms',
                description:
                    'Allow AniFox to schedule precise notifications for release reminders.',
                rationale:
                    'Android restricts background tasks. Exact alarm permission ensures you receive notifications at the exact minute an episode airs, rather than hours later.',
              );
            }

            if (mounted) {
              final String msg;
              if (Platform.isAndroid) {
                if (notifGranted && alarmGranted) {
                  msg = 'Notifications & Exact Alarms Enabled!';
                } else if (notifGranted) {
                  msg = 'Notifications Enabled (Exact Alarms Denied)';
                } else if (alarmGranted) {
                  msg = 'Exact Alarms Enabled (Notifications Denied)';
                } else {
                  msg = 'Permissions Denied';
                }
              } else {
                msg = notifGranted
                    ? 'Notifications Enabled!'
                    : 'Notifications Denied';
              }

              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(msg),
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              );
            }
          },
          style: FilledButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            shape: const StadiumBorder(),
          ),
          icon: const Icon(Icons.notifications_rounded),
          label: const Text(
            'Grant Permission',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
        ),
      ),
    );
  }

  Widget _buildPageLayout({
    required String title,
    required String description,
    IconData? icon,
    Widget? customIcon,
    required ThemeData theme,
    required ColorScheme cs,
    Widget? customWidget,
  }) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          physics: const BouncingScrollPhysics(),
          child: Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: constraints.maxHeight > 32
                    ? constraints.maxHeight - 32.0
                    : constraints.maxHeight,
                maxWidth: 600,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    height: 120,
                    alignment: Alignment.center,
                    child:
                        customIcon ?? Icon(icon, size: 72, color: cs.primary),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    title,
                    style: theme.textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    description,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: cs.onSurfaceVariant,
                      height: 1.5,
                      fontSize: 15,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  if (customWidget != null) customWidget,
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
