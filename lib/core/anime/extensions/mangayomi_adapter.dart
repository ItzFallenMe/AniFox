import 'package:anifox/core/anime/extensions/extension_models.dart';
import 'package:anifox/core/anime/extensions/js/mangayomi_service.dart';
import 'package:anifox/core/anime/providers/animeProvider.dart';
import 'package:anifox/core/anime/providers/types.dart';
import 'package:anifox/core/app/logging.dart';

/// Adapter that executes an installed Mangayomi JS extension through the
/// real QuickJS runtime ([MangayomiService]), mirroring how ShonenX runs
/// extension sources through its runtime bridge.
///
/// The extension's JS `search` / `getDetail` / `getVideoList` methods run
/// natively; HTTP, DOM, preferences and unpack helpers are bridged from
/// Dart. Results are mapped onto AniFox's [AnimeProvider] contract so
/// extensions behave exactly like inbuilt sources downstream.
class MangayomiExtensionAdapter extends AnimeProvider {
  MangayomiExtensionAdapter({
    required this.extension,
    required this.sourceCode,
  }) : _service = MangayomiService(extension, sourceCode);

  final ExtensionSource extension;
  final String sourceCode;
  final MangayomiService _service;

  @override
  String get providerName => extension.name;

  @override
  Future<List<Map<String, String?>>> search(String query) async {
    try {
      final results = await _service.search(query);
      if (results.isEmpty) {
        Logs.app.log('Extension ${extension.name} returned no results for "$query"');
      }
      return results;
    } catch (e) {
      Logs.app.log('Extension ${extension.name} search failed: $e');
      return [];
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getAnimeEpisodeLink(String aliasId, {bool dub = false}) async {
    try {
      final episodes = await _service.episodes(aliasId, dub: dub);
      if (!dub) return episodes;
      // Prefer dub entries when asked, but never return an empty list if
      // the extension simply doesn't tag dubs.
      final dubs = episodes.where((e) => e['hasDub'] == true).toList();
      return dubs.isNotEmpty ? dubs : episodes;
    } catch (e) {
      Logs.app.log('Extension ${extension.name} episodes failed: $e');
      return [];
    }
  }

  @override
  Future<void> getStreams(String episodeId, Function(List<VideoStream> list, bool) update,
      {bool dub = false, String? metadata}) async {
    try {
      final videos = await _service.videos(episodeId, dub: dub);
      if (videos.isEmpty) {
        update([], true);
        return;
      }
      update(
        videos.map((v) {
          final subs = (v['subtitles'] as List?) ?? const [];
          String? subUrl;
          String? subFormat;
          for (final s in subs) {
            final m = Map<String, dynamic>.from(s as Map);
            final file = m['file']?.toString();
            if (file == null || file.isEmpty) continue;
            final label = (m['label']?.toString() ?? '').toLowerCase();
            subUrl ??= file;
            subFormat ??= file.endsWith('.vtt')
                ? 'vtt'
                : (file.endsWith('.ass') || file.endsWith('.ssa') ? 'ass' : 'srt');
            if (label.contains('en')) {
              subUrl = file;
              subFormat = file.endsWith('.vtt')
                  ? 'vtt'
                  : (file.endsWith('.ass') || file.endsWith('.ssa') ? 'ass' : 'srt');
              break;
            }
          }
          final headers = (v['headers'] as Map?)
              ?.map((k, val) => MapEntry(k.toString(), val.toString()));
          return VideoStream(
            quality: v['quality']?.toString() ?? 'multi-quality',
            url: v['url'] as String,
            server: v['server']?.toString() ?? extension.name,
            backup: false,
            subtitle: subUrl,
            subtitleFormat: subFormat,
            customHeaders: headers ??
                (extension.baseUrl != null ? {'Referer': '${extension.baseUrl}/'} : null),
          );
        }).toList(),
        true,
      );
    } catch (e) {
      Logs.app.log('Extension ${extension.name} streams failed: $e');
      update([], true);
    }
  }

  @override
  Future<void> getDownloadSources(String episodeUrl, Function(List<VideoStream> list, bool) update,
      {bool dub = false, String? metadata}) {
    return getStreams(episodeUrl, update, dub: dub, metadata: metadata);
  }
}
