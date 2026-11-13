import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';

import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/modules/downloads/data/download_provider.dart';
import 'package:anifox/modules/downloads/state/downloads_provider.dart';

class DownloadOptionsScreen extends ConsumerStatefulWidget {
  final UnifiedMedia media;
  final int season;
  final int episode;
  final String episodeLabel;

  const DownloadOptionsScreen({
    super.key,
    required this.media,
    this.season = 1,
    this.episode = 1,
    this.episodeLabel = '',
  });

  @override
  ConsumerState<DownloadOptionsScreen> createState() =>
      _DownloadOptionsScreenState();
}

class _DownloadOptionsScreenState
    extends ConsumerState<DownloadOptionsScreen> {
  late final Uri? _linksUri;
  late Future<List<DownloadProviderLink>> _links;
  String? _startingUrl;

  String get _title => widget.media.title.getPreferedTitle;

  @override
  void initState() {
    super.initState();
    _linksUri = DownloadProvider.linksUriFor(
      widget.media,
      season: widget.season,
      episode: widget.episode,
    );
    _links = _loadLinks();
  }

  Future<List<DownloadProviderLink>> _loadLinks() {
    final uri = _linksUri;
    if (uri == null) {
      return Future.error(
        const DownloadLinksException(
          'Downloads are not available for this title in this build.',
        ),
      );
    }
    return DownloadProvider.loadLinks(uri);
  }

  Future<void> _refresh() async {
    setState(() => _links = _loadLinks());
    try {
      await _links;
    } catch (_) {
      // FutureBuilder shows the request error and retry action.
    }
  }

  Future<void> _requestStorageAccess() async {
    if (kIsWeb || !Platform.isAndroid) return;

    try {
      var granted = await Permission.manageExternalStorage.request().isGranted;
      if (!granted) granted = await Permission.storage.request().isGranted;
      if (granted && mounted) {
        ref.invalidate(downloadsProvider);
        await ref.read(downloadsProvider.future);
      }
    } catch (_) {
      // The download store uses app-private storage when shared access is not
      // available or the user declines the permission.
    }
  }

  Future<void> _startDownload(DownloadProviderLink link) async {
    if (_startingUrl != null) return;
    setState(() => _startingUrl = link.url.toString());

    try {
      await _requestStorageAccess();
      await ref.read(downloadsProvider.future);
      await ref
          .read(downloadsProvider.notifier)
          .start(
            url: link.url.toString(),
            mediaTitle: _title,
            episodeLabel: widget.episodeLabel,
            sourceName: link.source,
            headers: {
              if (_linksUri != null) 'Referer': _linksUri.toString(),
            },
          );

      if (!mounted) return;
      context.push('/downloads');
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not start the download: $error')),
      );
    } finally {
      if (mounted) setState(() => _startingUrl = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final mediaType = widget.media.type == MediaType.MOVIE
        ? 'movie'
        : widget.media.type == MediaType.TV
        ? 'episode'
        : 'chapter';

    return Scaffold(
      appBar: AppBar(
        title: Text('Download $mediaType'),
        actions: [
          IconButton(
            tooltip: 'Refresh links',
            onPressed: _refresh,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: FutureBuilder<List<DownloadProviderLink>>(
        future: _links,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return _DownloadMessage(
              icon: Icons.cloud_off_rounded,
              message: '${snapshot.error}',
              actionLabel: 'Try again',
              onAction: _refresh,
            );
          }
          final links = snapshot.data ?? const [];
          if (links.isEmpty) {
            return const _DownloadMessage(
              icon: Icons.link_off_rounded,
              message: 'No download links were found for this title.',
            );
          }

          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            children: [
              Text(
                _title,
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              if (widget.episodeLabel.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  widget.episodeLabel,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
              const SizedBox(height: 8),
              Text(
                'Choose a quality to save it for offline viewing.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 20),
              for (final link in links) ...[
                _DownloadLinkTile(
                  link: link,
                  loading: _startingUrl == link.url.toString(),
                  disabled: _startingUrl != null,
                  onPressed: () => _startDownload(link),
                ),
                const SizedBox(height: 10),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _DownloadLinkTile extends StatelessWidget {
  final DownloadProviderLink link;
  final bool loading;
  final bool disabled;
  final VoidCallback onPressed;

  const _DownloadLinkTile({
    required this.link,
    required this.loading,
    required this.disabled,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: disabled ? null : onPressed,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: loading
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: colorScheme.onPrimaryContainer,
                        ),
                      )
                    : Icon(
                        Icons.download_rounded,
                        color: colorScheme.onPrimaryContainer,
                      ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      link.quality,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      link.source,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodyMedium,
                    ),
                    if (link.details.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        link.details,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (link.size.isNotEmpty) ...[
                const SizedBox(width: 8),
                Text(
                  link.size,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _DownloadMessage extends StatelessWidget {
  final IconData icon;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  const _DownloadMessage({
    required this.icon,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 42, color: theme.colorScheme.onSurfaceVariant),
            const SizedBox(height: 14),
            Text(message, textAlign: TextAlign.center),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 14),
              FilledButton.tonal(
                onPressed: onAction,
                child: Text(actionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
