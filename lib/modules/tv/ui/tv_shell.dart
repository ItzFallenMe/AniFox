import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/modules/tv/ui/screens/tv_home_screen.dart';
import 'package:anifox/modules/tv/ui/screens/tv_library_screen.dart';
import 'package:anifox/modules/tv/ui/screens/tv_search_screen.dart';
import 'package:anifox/modules/tv/ui/tv_scale.dart';
import 'package:anifox/modules/tv/ui/widgets/tv_nav_bar.dart';

class TvShell extends ConsumerStatefulWidget {
  final StatefulNavigationShell? navigationShell;

  const TvShell({super.key, this.navigationShell});

  @override
  ConsumerState<TvShell> createState() => _TvShellState();
}

class _TvShellState extends ConsumerState<TvShell> {
  int _currentTabIndex = 0;
  GoRouter? _router;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (widget.navigationShell == null) return;

    final router = GoRouter.of(context);
    if (identical(router, _router)) return;

    _router?.routeInformationProvider.removeListener(_handleLocationChange);
    _router = router;
    router.routeInformationProvider.addListener(_handleLocationChange);
    _handleLocationChange();
  }

  @override
  void dispose() {
    _router?.routeInformationProvider.removeListener(_handleLocationChange);
    super.dispose();
  }

  void _handleLocationChange() {
    final path = _router?.routeInformationProvider.value.uri.path;
    final routeTab = switch (path) {
      '/home' => 0,
      '/discover' => 1,
      '/tv' => 2,
      '/anime' => 3,
      '/movies' => 4,
      '/library' => 5,
      _ => null,
    };
    if (routeTab != null && routeTab != _currentTabIndex && mounted) {
      setState(() => _currentTabIndex = routeTab);
    }
  }

  void _onTabSelected(int index) {
    setState(() => _currentTabIndex = index);
    if (widget.navigationShell != null) {
      if (index == 0 || index == 5) {
        final branchIndex = index == 0 ? 0 : 2;
        widget.navigationShell!.goBranch(
          branchIndex,
          initialLocation: branchIndex == widget.navigationShell!.currentIndex,
        );
      } else {
        final location = switch (index) {
          1 => '/discover',
          2 => '/tv',
          3 => '/anime',
          4 => '/movies',
          _ => '/discover',
        };
        context.go(location);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    final scale = context.tvScale;
    final navBarHeight = (66.0 * scale).clamp(64.0, 96.0);

    return MediaQuery(
      data: mq.copyWith(textScaler: TextScaler.linear(scale)),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: Stack(
          fit: StackFit.expand,
          children: [
            Positioned.fill(
              top: navBarHeight,
              child: IndexedStack(
                index: _currentTabIndex,
                children: const [
                  TvHomeScreen(),
                  TvSearchScreen(),
                  TvSearchScreen(
                    key: ValueKey('tv-catalog'),
                    initialType: MediaType.TV,
                    showTypeToggle: false,
                  ),
                  TvSearchScreen(
                    key: ValueKey('anime-catalog'),
                    initialType: MediaType.ANIME,
                    showTypeToggle: false,
                  ),
                  TvSearchScreen(
                    key: ValueKey('movie-catalog'),
                    initialType: MediaType.MOVIE,
                    showTypeToggle: false,
                  ),
                  TvLibraryScreen(),
                ],
              ),
            ),
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: TvNavBar(
                selectedIndex: _currentTabIndex,
                onTabSelected: _onTabSelected,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
