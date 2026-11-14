import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import 'package:webview_all/webview_all.dart';
import 'package:webview_all_android/webview_all_android.dart';

import 'package:anifox/common/state/security_prefs_provider.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/modules/history/models/models/history_entry.dart';
import 'package:anifox/modules/downloads/ui/download_options_screen.dart';
import 'package:anifox/modules/history/state/history_provider.dart';
import 'package:anifox/modules/playback/models/player_mode.dart';
import 'package:anifox/streaming/catalog.dart';
import 'package:anifox/streaming/embed_url.dart';
import 'package:anifox/streaming/tmdb_lookup.dart';
import 'package:anifox/streaming/models/stream_source.dart';

/// Plays an episode through one of the bundled embed hosts.
///
/// The hosts render the whole player themselves, so AniFox only supplies the
/// deep link built from TMDB/AniList/MAL identifiers.
class EmbedPlayerScreen extends ConsumerStatefulWidget {
  final PlayerModeOnline mode;

  const EmbedPlayerScreen({super.key, required this.mode});

  @override
  ConsumerState<EmbedPlayerScreen> createState() => _EmbedPlayerScreenState();
}

class _EmbedPlayerScreenState extends ConsumerState<EmbedPlayerScreen> {
  late final WebViewController _controller;
  late StreamSource _source;
  String? _url;
  bool _isLoading = true;
  int _progress = 0;
  bool _showTopBar = true;
  Timer? _topBarTimer;
  Widget? _fullscreenWebView;
  VoidCallback? _hideFullscreenWebView;

  UnifiedMedia get _media => widget.mode.media;
  int get _episodeNumber => widget.mode.episode.number.toInt();
  int get _season {
    final episodeSeason = widget.mode.episode.season;
    if (episodeSeason != null) return episodeSeason;
    final parsed = int.tryParse(_media.season ?? '');
    return parsed == null || parsed < 1 ? 1 : parsed;
  }

  @override
  void initState() {
    super.initState();
    _source = widget.mode.sourceInfo;
    _controller = WebViewController();
    _configureController();
    _loadSource(_source);
    _recordHistory();

    try {
      WakelockPlus.enable();
    } catch (_) {}
  }

  @override
  void dispose() {
    _topBarTimer?.cancel();
    try {
      WakelockPlus.disable();
    } catch (_) {}
    super.dispose();
  }

  /// The bundled hosts render their own controls, so AniFox's chrome stays out
  /// of the way and only reappears when the viewer taps the video.
  void _showTopBarTemporarily() {
    _topBarTimer?.cancel();
    if (!mounted) return;
    setState(() => _showTopBar = true);
    _topBarTimer = Timer(const Duration(seconds: 4), () {
      if (mounted && !_isLoading) setState(() => _showTopBar = false);
    });
  }

  void _configureController() {
    _controller
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) {
              setState(() {
                _isLoading = true;
                _progress = 0;
              });
            }
          },
          onProgress: (value) {
            if (mounted) setState(() => _progress = value);
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _isLoading = false);
            _showTopBarTemporarily();
          },
        ),
      );

    if (_controller.platform is AndroidWebViewController) {
      unawaited(
        (_controller.platform as AndroidWebViewController)
            .setCustomWidgetCallbacks(
              onShowCustomWidget: _showFullscreenWebView,
              onHideCustomWidget: _onHideFullscreenWebView,
            ),
      );
    }
  }

  Future<void> _openDownloads() async {
    final episodeLabel = switch (_media.type) {
      MediaType.MOVIE => '',
      MediaType.TV => 'Season $_season · Episode $_episodeNumber',
      MediaType.ANIME => 'Episode $_episodeNumber',
      _ => '',
    };

    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => DownloadOptionsScreen(
          media: _media,
          season: _season,
          episode: _episodeNumber,
          episodeLabel: episodeLabel,
        ),
      ),
    );
  }

  void _showFullscreenWebView(
    Widget fullscreenWidget,
    VoidCallback onCustomWidgetHidden,
  ) {
    if (!mounted) {
      onCustomWidgetHidden();
      return;
    }
    setState(() {
      _fullscreenWebView = fullscreenWidget;
      _hideFullscreenWebView = onCustomWidgetHidden;
    });
  }

  void _onHideFullscreenWebView() {
    if (!mounted) {
      _fullscreenWebView = null;
      _hideFullscreenWebView = null;
      return;
    }
    setState(() {
      _fullscreenWebView = null;
      _hideFullscreenWebView = null;
    });
  }

  void _exitFullscreenWebView() {
    _hideFullscreenWebView?.call();
  }

  Future<void> _loadSource(StreamSource source) async {
    setState(() {
      _source = source;
      _url = null;
      _isLoading = true;
    });

    var url = buildEmbedUrl(
      source: source,
      media: _media,
      episode: _episodeNumber,
      season: _season,
    );

    // Movies and TV often reach the player with only a tracker id. Resolve a
    // TMDB id so every bundled host can address the title.
    if (url == null &&
        (_media.type == MediaType.MOVIE || _media.type == MediaType.TV)) {
      final tmdbId = await resolveTmdbId(
        title: _media.title.getPreferedTitle,
        isMovie: _media.type == MediaType.MOVIE,
        year: _media.year,
      );
      if (tmdbId != null) {
        url = buildEmbedUrl(
          source: source,
          media: _media,
          episode: _episodeNumber,
          season: _season,
          tmdbIdOverride: tmdbId,
        );
      }
    }

    if (!mounted) return;
    setState(() {
      _url = url;
      _isLoading = url != null;
    });

    if (url != null) {
      await _controller.loadRequest(Uri.parse(url));
    }
  }

  Future<void> _recordHistory() async {
    // This history model currently stores anime episodes and manga pages only.
    // Do not misfile movies or TV episodes as manga.
    if (_media.type != MediaType.ANIME) return;
    if (ref.read(securityPrefsProvider).incognitoMode) return;

    final repo = ref.read(historyRepositoryProvider);
    final entry = HistoryEntry()
      ..mediaId = _media.id
      ..mediaType = MediaType.ANIME.id
      ..itemNumber = widget.mode.episode.number
      ..itemTitle = widget.mode.episode.title
      ..mediaTitle = _media.title.getPreferedTitle
      ..cover = _media.cover
      ..banner = _media.banner
      ..totalItems = _media.episodes
      ..sourceId = _source.id
      ..sourceName = _source.name
      ..providerId = _media.providerId
      ..externalIds = _media.externalIds
      ..lastUpdated = DateTime.now();

    try {
      await repo.saveStartedEpisode(entry);
    } catch (_) {}
  }

  // The bundled hosts are video embed services. Their source category is
  // ANIME, but the same `/api/stream` route also supports movies and TV.
  List<StreamSource> get _selectableSources => aniFoxStreamSources;

  String get _title {
    final title = _media.title.getPreferedTitle;
    return switch (_media.type) {
      MediaType.MOVIE => title,
      MediaType.TV => '$title • Season $_season · Episode $_episodeNumber',
      MediaType.ANIME => '$title • Episode $_episodeNumber',
      _ => title,
    };
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: _fullscreenWebView == null,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _exitFullscreenWebView();
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Stack(
          children: [
            SafeArea(
              child: Stack(
                children: [
                  Positioned.fill(child: _buildPlayer()),
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    child: IgnorePointer(
                      ignoring: !_showTopBar,
                      child: AnimatedOpacity(
                        opacity: _showTopBar ? 1 : 0,
                        duration: const Duration(milliseconds: 250),
                        child: _buildTopBar(context),
                      ),
                    ),
                  ),
                  if (_isLoading && _url != null)
                    Positioned(
                      top: 0,
                      left: 0,
                      right: 0,
                      child: LinearProgressIndicator(
                        value: _progress > 0 ? _progress / 100 : null,
                        minHeight: 2,
                        backgroundColor: Colors.white12,
                      ),
                    ),
                ],
              ),
            ),
            if (_fullscreenWebView != null)
              Positioned.fill(
                child: ColoredBox(
                  color: Colors.black,
                  child: _fullscreenWebView!,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlayer() {
    if (_url == null) {
      return _buildUnsupported();
    }
    return Listener(
      behavior: HitTestBehavior.translucent,
      onPointerDown: (_) => _showTopBarTemporarily(),
      child: WebViewWidget(controller: _controller),
    );
  }

  Widget _buildUnsupported() {
    final sources = _selectableSources;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.link_off_rounded, size: 44, color: Colors.white54),
            const SizedBox(height: 14),
            Text(
              '${_source.name} cannot play this title yet.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Nothing in the metadata links this title to the host. '
              'Try another source:',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white60, fontSize: 13),
            ),
            const SizedBox(height: 18),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              alignment: WrapAlignment.center,
              children: [
                for (final source in sources)
                  OutlinedButton(
                    onPressed: source.id == _source.id
                        ? null
                        : () => _loadSource(source),
                    child: Text(source.name),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 14),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.black87, Colors.transparent],
        ),
      ),
      child: Row(
        children: [
          IconButton(
            tooltip: 'Close',
            onPressed: () => context.pop(),
            icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white),
          ),
          Expanded(
            child: Text(
              _title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          IconButton(
            tooltip: 'Download',
            onPressed: _openDownloads,
            icon: const Icon(Icons.download_rounded, color: Colors.white),
          ),

          PopupMenuButton<StreamSource>(
            tooltip: 'Source',
            initialValue: _source,
            onSelected: _loadSource,
            itemBuilder: (context) => [
              for (final source in _selectableSources)
                PopupMenuItem(value: source, child: Text(source.name)),
            ],
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.dns_outlined,
                      color: Colors.white70, size: 16),
                  const SizedBox(width: 6),
                  Text(
                    _source.name,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                  ),
                ],
              ),
            ),
          ),
          IconButton(
            tooltip: 'Reload',
            onPressed: () => _loadSource(_source),
            icon: const Icon(Icons.refresh_rounded, color: Colors.white),
          ),
        ],
      ),
    );
  }
}
