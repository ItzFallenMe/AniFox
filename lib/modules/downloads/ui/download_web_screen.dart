import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:webview_all/webview_all.dart';

import 'package:anifox/modules/downloads/state/downloads_provider.dart';

/// Shows the operator's download provider inside AniFox and saves the file
/// links it opens into `AniFox/downloads` instead of handing them to a browser.
class DownloadWebScreen extends ConsumerStatefulWidget {
  final String pageUrl;
  final String mediaTitle;
  final String episodeLabel;

  const DownloadWebScreen({
    super.key,
    required this.pageUrl,
    required this.mediaTitle,
    required this.episodeLabel,
  });

  @override
  ConsumerState<DownloadWebScreen> createState() => _DownloadWebScreenState();
}

class _DownloadWebScreenState extends ConsumerState<DownloadWebScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _saving = false;

  static const _mediaExtensions = {
    '.mp4',
    '.mkv',
    '.webm',
    '.m3u8',
    '.mpd',
    '.mov',
  };

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0F1014))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) setState(() => _isLoading = true);
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _isLoading = false);
          },
          onNavigationRequest: _handleNavigation,
        ),
      )
      ..loadRequest(Uri.parse(widget.pageUrl));
  }

  bool _looksLikeMedia(Uri uri) {
    final path = uri.path.toLowerCase();
    if (_mediaExtensions.any(path.endsWith)) return true;
    final query = uri.query.toLowerCase();
    return query.contains('.mp4') ||
        query.contains('.mkv') ||
        query.contains('.m3u8') ||
        query.contains('download=');
  }

  NavigationDecision _handleNavigation(NavigationRequest request) {
    final uri = Uri.tryParse(request.url);
    if (uri == null) return NavigationDecision.navigate;

    if (uri.scheme != 'http' && uri.scheme != 'https') {
      _showMessage('This download link cannot be opened inside AniFox.');
      return NavigationDecision.prevent;
    }

    if (_looksLikeMedia(uri)) {
      _save(uri);
      return NavigationDecision.prevent;
    }

    return NavigationDecision.navigate;
  }

  Future<void> _save(Uri uri) async {
    if (_saving) return;
    setState(() => _saving = true);
    final messenger = ScaffoldMessenger.of(context);

    if (!kIsWeb && Platform.isAndroid) {
      var granted = await Permission.manageExternalStorage.request().isGranted;
      if (!granted) {
        granted = await Permission.storage.request().isGranted;
      }
      // Rebuild the notifier so it picks the shared folder now that storage
      // is available instead of the private fallback resolved at startup.
      if (granted && mounted) {
        ref.invalidate(downloadsProvider);
        await ref.read(downloadsProvider.future);
      }
    }
    try {
      await ref
          .read(downloadsProvider.notifier)
          .start(
            url: uri.toString(),
            mediaTitle: widget.mediaTitle,
            episodeLabel: widget.episodeLabel,
            sourceName: 'AniFox downloads',
            headers: {'Referer': widget.pageUrl},
          );

      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: const Text('Saving to AniFox/downloads'),
          action: SnackBarAction(
            label: 'View',
            onPressed: () => context.push('/downloads'),
          ),
        ),
      );
    } catch (_) {
      if (mounted) {
        _showMessage('The download could not be started.');
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFF0F1014),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F1014),
        foregroundColor: Colors.white,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Downloads',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            Text(
              'Saved to AniFox/downloads',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'My downloads',
            onPressed: () => context.push('/downloads'),
            icon: const Icon(Icons.download_for_offline_outlined),
          ),
        ],
        bottom: _saving
            ? const PreferredSize(
                preferredSize: Size.fromHeight(2),
                child: LinearProgressIndicator(minHeight: 2),
              )
            : null,
      ),
      body: Column(
        children: [
          if (_isLoading)
            const LinearProgressIndicator(minHeight: 2, color: Colors.white24),
          Expanded(
            child: WebViewWidget(controller: _controller),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: Text(
                'Pick a quality on this page. Files are kept inside AniFox '
                'and can be played from Downloads.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 11,
                  height: 1.5,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
