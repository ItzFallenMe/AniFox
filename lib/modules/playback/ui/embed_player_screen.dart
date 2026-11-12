import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import 'package:webview_all/webview_all.dart';

import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/modules/history/models/models/history_entry.dart';
import 'package:anifox/modules/downloads/state/downloads_provider.dart';
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
  final Set<String> _sniffed = <String>{};

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
    _controller.addJavaScriptChannel(
      'AniFoxSniffer',
      onMessageReceived: (message) => _onSniffed(message.message),
    );
    _configureController();
    _loadSource(_source);
    _recordHistory();

    try {
      WakelockPlus.enable();
    } catch (_) {}
  }

  @override
  void dispose() {
    try {
      WakelockPlus.disable();
    } catch (_) {}
    super.dispose();
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
            _injectSniffer();
          },
        ),
      );
  }

  void _injectSniffer() {
    _controller.runJavaScript(_snifferScript).catchError((Object _) {});
  }

  void _onSniffed(String raw) {
    final trimmed = raw.trim();
    if (trimmed.isEmpty) return;
    final uri = Uri.tryParse(trimmed);
    if (uri == null) return;
    final path = uri.path.toLowerCase();
    if (!path.endsWith('.m3u8') &&
        !path.endsWith('.mp4') &&
        !path.endsWith('.m4v')) {
      return;
    }
    if (_sniffed.add(trimmed) && mounted) {
      setState(() {});
    }
  }

  String _labelForUrl(String url) {
    final quality = RegExp(r'(\d{3,4})p').firstMatch(url);
    if (quality != null) return '${quality.group(1)}p stream';
    final segments = Uri.tryParse(url)?.pathSegments ?? const <String>[];
    final name = segments.isEmpty ? 'Stream' : segments.last;
    return name.length > 48 ? '${name.substring(0, 48)}…' : name;
  }

  Future<void> _openDownloadSheet() async {
    if (_sniffed.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Let the episode play for a few seconds, then tap download again.',
          ),
        ),
      );
      return;
    }

    final selected = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 0, 20, 8),
              child: Text(
                'Download stream',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
              child: Text(
                'Media captured from ${_source.name}. Pick the stream quality to save.',
                style: TextStyle(
                  fontSize: 12,
                  color: Theme.of(sheetContext).colorScheme.onSurfaceVariant,
                ),
              ),
            ),
            Flexible(
              child: ListView(
                shrinkWrap: true,
                children: [
                  for (final url in _sniffed)
                    ListTile(
                      leading: const Icon(Icons.movie_outlined),
                      title: Text(_labelForUrl(url)),
                      subtitle: Text(
                        Uri.tryParse(url)?.host ?? url,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      onTap: () => Navigator.of(sheetContext).pop(url),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );

    if (selected == null || !mounted) return;

    final pageUrl = _url;
    await ref
        .read(downloadsProvider.notifier)
        .start(
          url: selected,
          mediaTitle: _media.title.getPreferedTitle,
          episodeLabel: _episodeNumber > 0 ? 'Episode $_episodeNumber' : '',
          sourceName: _source.name,
          headers: {
            if (pageUrl != null) 'Referer': pageUrl,
            if (pageUrl != null) 'Origin': Uri.parse(pageUrl).origin,
          },
        );

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Download started.'),
        action: SnackBarAction(
          label: 'View',
          onPressed: () => context.push('/downloads'),
        ),
      ),
    );
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
    final repo = ref.read(historyRepositoryProvider);
    final entry = HistoryEntry()
      ..mediaId = _media.id
      ..mediaType = _media.type == MediaType.ANIME ? 'anime' : 'manga'
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
      await repo.saveProgress(entry);
    } catch (_) {}
  }

  List<StreamSource> get _selectableSources => aniFoxStreamSources
      .where((source) => source.mediaType == _media.type)
      .toList(growable: false);

  String get _title {
    final episode = _episodeNumber > 0 ? ' • Episode $_episodeNumber' : '';
    return '${_media.title.getPreferedTitle}$episode';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            Positioned.fill(child: _buildPlayer()),
            Positioned(top: 0, left: 0, right: 0, child: _buildTopBar(context)),
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
    );
  }

  Widget _buildPlayer() {
    if (_url == null) {
      return _buildUnsupported();
    }
    return WebViewWidget(controller: _controller);
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
            tooltip: _sniffed.isEmpty
                ? 'Download (play first to capture the stream)'
                : 'Download captured stream',
            onPressed: _openDownloadSheet,
            icon: Badge(
              isLabelVisible: _sniffed.isNotEmpty,
              smallSize: 7,
              child: const Icon(
                Icons.download_rounded,
                color: Colors.white,
              ),
            ),
          ),
          IconButton(
            tooltip: 'Downloads',
            onPressed: () => context.push('/downloads'),
            icon: const Icon(
              Icons.download_for_offline_outlined,
              color: Colors.white,
            ),
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


const _snifferScript = r"""
(function () {
  if (window.__aniFoxSniffer) return;
  window.__aniFoxSniffer = true;
  function send(value) {
    try {
      if (!value) return;
      var absolute = new URL(String(value), location.href).href;
      if (/\.(m3u8|mp4|m4v)(\?|#|$)/i.test(absolute)) {
        window.AniFoxSniffer.postMessage(absolute);
      }
    } catch (e) {}
  }
  try {
    var originalFetch = window.fetch;
    if (originalFetch) {
      window.fetch = function () {
        try {
          var input = arguments[0];
          send(typeof input === 'string' ? input : (input && input.url));
        } catch (e) {}
        return originalFetch.apply(this, arguments);
      };
    }
  } catch (e) {}
  try {
    var originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
      send(url);
      return originalOpen.apply(this, arguments);
    };
  } catch (e) {}
  try {
    new PerformanceObserver(function (list) {
      list.getEntries().forEach(function (entry) { send(entry.name); });
    }).observe({ type: 'resource', buffered: true });
  } catch (e) {}
  setInterval(function () {
    try {
      performance.getEntriesByType('resource').forEach(function (entry) {
        send(entry.name);
      });
      document.querySelectorAll('video').forEach(function (video) {
        send(video.currentSrc || video.src);
      });
    } catch (e) {}
  }, 2000);
})();
""";
