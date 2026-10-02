import 'dart:convert';

import 'package:anifox/core/anime/extractors/streamwish.dart';
import 'package:anifox/core/anime/extractors/vidtube.dart';
import 'package:anifox/core/anime/providers/animeProvider.dart';
import 'package:anifox/core/anime/providers/types.dart';
import 'package:anifox/core/app/logging.dart';
import 'package:anifox/core/app/values.dart';
import 'package:html/parser.dart' as html;
import 'package:anifox/core/network/network.dart';

/// AnimeKai provider.
///
/// Mirrors the HiAnime/Anikoto ajax flow (`/ajax/...`) but against
/// `https://animekai.to`. AnimeKai encrypts some ajax tokens server-side
/// (enc-dec service). This implementation prefers plain HTML scraping with
/// ajax fallback so search + episodes work even when the enc service is
/// unavailable. Stream extraction supports vidtube/streamwish iframes and
/// returns raw iframe URLs as last resort so the player can still try them.
class AnimeKai extends AnimeProvider {
  @override
  String providerName = "animekai";

  static const _baseUrl = "https://animekai.to";
  static const _ajaxUrl = "https://animekai.to/ajax";

  final Map<String, String> _headers = {
    'Referer': '$_baseUrl/',
    'User-Agent': AppValues.defaultClientUserAgent,
    'X-Requested-With': 'XMLHttpRequest',
  };

  @override
  Future<List<Map<String, String?>>> search(String query) async {
    final q = Uri.encodeQueryComponent(query.trim());
    // Primary: ajax search endpoint (same shape as hianime template).
    try {
      final res = await get(
        Uri.parse("$_ajaxUrl/anime/search?keyword=$q"),
        headers: _headers,
        cacheDuration: const Duration(minutes: 5),
      );
      final decoded = jsonDecode(res.body);
      final htmlString = decoded['result']?['html'] ?? decoded['result'];
      if (htmlString is String && htmlString.isNotEmpty) {
        final parsed = _parseSearchHtml(htmlString);
        if (parsed.isNotEmpty) return parsed;
      }
    } catch (e) {
      Logs.app.log("AnimeKai ajax search failed, falling back: $e");
    }

    // Fallback: browser page HTML scraping.
    final res = await get(
      Uri.parse("$_baseUrl/browser?keyword=$q"),
      headers: {'Referer': '$_baseUrl/', 'User-Agent': AppValues.defaultClientUserAgent},
      cacheDuration: const Duration(minutes: 5),
    );
    return _parseSearchHtml(res.body);
  }

  List<Map<String, String?>> _parseSearchHtml(String htmlString) {
    final doc = html.parse(htmlString);
    final results = <Map<String, String?>>[];
    // AnimeKai cards: .aitem a[href*=/watch/] with img + title.
    final anchors = doc.querySelectorAll('a[href*="/watch/"], .aitem a, .film-list a');
    final seen = <String>{};
    for (final a in anchors) {
      final href = a.attributes['href'];
      if (href == null || !href.contains('/watch/')) continue;
      if (!seen.add(href)) continue;
      final title = a.querySelector('.title, .name, h3')?.text.trim().isNotEmpty == true
          ? a.querySelector('.title, .name, h3')!.text.trim()
          : a.text.trim().split('\n').first.trim();
      final img = a.querySelector('img')?.attributes['data-src'] ??
          a.querySelector('img')?.attributes['src'];
      if (title.isEmpty) continue;
      results.add({
        'name': title,
        'alias': href.startsWith('http') ? href : '$_baseUrl$href',
        'imageUrl': img?.startsWith('http') == true ? img : (img != null ? '$_baseUrl$img' : null),
      });
      if (results.length >= 30) break;
    }
    return results;
  }

  @override
  Future<List<Map<String, dynamic>>> getAnimeEpisodeLink(String aliasId, {bool dub = false}) async {
    final pageUrl = aliasId.startsWith('http') ? aliasId : '$_baseUrl$aliasId';
    final res = await get(
      Uri.parse(pageUrl),
      headers: {'Referer': '$_baseUrl/', 'User-Agent': AppValues.defaultClientUserAgent},
      cacheDuration: const Duration(minutes: 5),
    );
    final doc = html.parse(res.body);

    // data-id used by /ajax/episodes/list
    final contentId = doc.querySelector('.rate-box')?.attributes['data-id'] ??
        doc.querySelector('[data-id]')?.attributes['data-id'];

    if (contentId != null && contentId.isNotEmpty) {
      try {
        return await _getEpisodesViaAjax(contentId);
      } catch (e) {
        Logs.app.log("AnimeKai ajax episodes failed, trying HTML: $e");
      }
    }

    // Fallback: parse episode links from watch page HTML.
    final eps = <Map<String, dynamic>>[];
    final links = doc.querySelectorAll('a[href*="ep="], .eplist a, .ep-list a, a.ep-item');
    int i = 1;
    for (final a in links) {
      final href = a.attributes['href'];
      if (href == null) continue;
      final epNum = int.tryParse(a.attributes['data-num'] ?? a.text.trim().replaceAll(RegExp(r'[^0-9]'), '')) ?? i;
      eps.add({
        'episodeLink': href.startsWith('http') ? href : '$_baseUrl$href',
        'episodeNumber': epNum,
        'episodeTitle': a.attributes['title'] ?? a.text.trim(),
        'thumbnail': null,
        'hasDub': doc.body?.text.toLowerCase().contains('dub') ?? false,
        'isFiller': false,
      });
      i++;
    }
    // Deduplicate by episode number, keep order ascending.
    final byNum = <int, Map<String, dynamic>>{};
    for (final e in eps) {
      byNum[e['episodeNumber'] as int] = e;
    }
    final sorted = byNum.values.toList()..sort((a, b) => (a['episodeNumber'] as int).compareTo(b['episodeNumber'] as int));
    return sorted;
  }

  Future<List<Map<String, dynamic>>> _getEpisodesViaAjax(String contentId) async {
    final url = "$_ajaxUrl/episodes/list?ani_id=$contentId";
    final res = await get(
      Uri.parse(url),
      headers: _headers,
      cacheDuration: const Duration(minutes: 5),
    );
    final decoded = jsonDecode(res.body);
    final htmlString = decoded['result'] as String?;
    if (htmlString == null || htmlString.isEmpty) return [];
    final doc = html.parse(htmlString);
    final items = doc.querySelectorAll('a[href*="ep="], a[data-id], .eplist a');
    final eps = <Map<String, dynamic>>[];
    for (final a in items) {
      final token = a.attributes['data-id'] ?? a.attributes['href'];
      final numStr = a.attributes['data-num'] ?? RegExp(r'ep=(\d+)').firstMatch(a.attributes['href'] ?? '')?.group(1) ?? a.text.trim();
      final num = int.tryParse(RegExp(r'\d+').firstMatch(numStr)?.group(0) ?? '') ?? (eps.length + 1);
      if (token == null) continue;
      eps.add({
        'episodeLink': token,
        'episodeNumber': num,
        'episodeTitle': a.attributes['title'] ?? a.text.trim(),
        'thumbnail': null,
        'hasDub': false,
        'isFiller': false,
        'metadata': contentId,
      });
    }
    eps.sort((a, b) => (a['episodeNumber'] as int).compareTo(b['episodeNumber'] as int));
    return eps;
  }

  @override
  Future<void> getStreams(String episodeId, Function(List<VideoStream> list, bool) update,
      {bool dub = false, String? metadata}) async {
    try {
      // episodeId may be a token (ajax flow) or full watch URL.
      String watchUrl;
      if (episodeId.startsWith('http')) {
        watchUrl = episodeId;
      } else if (metadata != null && metadata.isNotEmpty) {
        watchUrl = "$_baseUrl/watch/${metadata.replaceAll(RegExp(r'^/+'), '')}";
      } else {
        // Try ajax servers list directly.
        await _getStreamsViaAjax(episodeId, update, dub: dub);
        return;
      }

      final res = await get(
        Uri.parse(watchUrl),
        headers: {'Referer': '$_baseUrl/', 'User-Agent': AppValues.defaultClientUserAgent},
        cacheDuration: const Duration(hours: 1),
      );
      final doc = html.parse(res.body);

      // Collect iframe / server links.
      final candidates = <String, String>{};
      for (final iframe in doc.querySelectorAll('iframe')) {
        final src = iframe.attributes['src'] ?? iframe.attributes['data-src'];
        if (src != null && src.isNotEmpty && src.startsWith('http')) {
          candidates[src] = 'iframe';
        }
      }
      for (final a in doc.querySelectorAll('a[data-lid], [data-link-id]')) {
        final lid = a.attributes['data-lid'] ?? a.attributes['data-link-id'];
        if (lid != null) candidates[lid] = a.text.trim();
      }

      if (candidates.isEmpty) {
        // Last resort: try ajax servers list with episodeId as token.
        await _getStreamsViaAjax(episodeId, update, dub: dub);
        return;
      }

      int done = 0;
      final total = candidates.length;
      for (final entry in candidates.entries) {
        try {
          final streams = await _extractStreams(entry.key, server: entry.value);
          done++;
          update(streams, done == total);
        } catch (e) {
          Logs.app.log("AnimeKai extract failed for ${entry.key}: $e");
          done++;
          update([], done == total);
        }
      }
    } catch (e) {
      Logs.app.log("AnimeKai getStreams failed: $e");
      update([], true);
    }
  }

  Future<void> _getStreamsViaAjax(String token, Function(List<VideoStream>, bool) update, {bool dub = false}) async {
    final url = "$_ajaxUrl/links/list?token=$token";
    final res = await get(Uri.parse(url), headers: _headers, cacheDuration: const Duration(hours: 1));
    final decoded = jsonDecode(res.body);
    final htmlString = decoded['result'] as String?;
    if (htmlString == null || htmlString.isEmpty) {
      update([], true);
      return;
    }
    final doc = html.parse(htmlString);
    final servers = doc.querySelectorAll('[data-lid]');
    if (servers.isEmpty) {
      update([], true);
      return;
    }
    int done = 0;
    for (final s in servers) {
      final lid = s.attributes['data-lid'];
      if (lid == null) {
        done++;
        continue;
      }
      try {
        final viewRes = await get(Uri.parse("$_ajaxUrl/links/view?id=$lid"), headers: _headers);
        final viewJson = jsonDecode(viewRes.body);
        final iframeUrl = viewJson['result']?['url'] as String?;
        if (iframeUrl == null) {
          done++;
          update([], done == servers.length);
          continue;
        }
        final streams = await _extractStreams(iframeUrl, server: s.text.trim());
        done++;
        update(streams, done == servers.length);
      } catch (_) {
        done++;
        update([], done == servers.length);
      }
    }
  }

  Future<List<VideoStream>> _extractStreams(String url, {String? server}) async {
    final host = Uri.tryParse(url)?.host.toLowerCase() ?? '';
    try {
      if (host.contains('vidtube')) {
        return await VidtubeExtractor().extract(url, server: server ?? 'Vidtube');
      }
      if (host.contains('streamwish') || host.contains('wish')) {
        return await StreamWish().extract(url);
      }
    } catch (e) {
      Logs.app.log("AnimeKai extractor failed for $host: $e");
    }
    // Fallback: return iframe directly so player can attempt playback.
    return [
      VideoStream(
        quality: 'multi-quality',
        url: url,
        server: server ?? 'AnimeKai',
        backup: true,
        customHeaders: {'Referer': '$_baseUrl/'},
      )
    ];
  }

  @override
  Future<void> getDownloadSources(String episodeUrl, Function(List<VideoStream> list, bool) update,
      {bool dub = false, String? metadata}) async {
    // Reuse stream URLs as downloadable where direct mp4/m3u8.
    return getStreams(episodeUrl, update, dub: dub, metadata: metadata);
  }
}
