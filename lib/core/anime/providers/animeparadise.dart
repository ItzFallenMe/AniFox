import 'dart:convert';

import 'package:anifox/core/anime/providers/animeProvider.dart';
import 'package:anifox/core/anime/providers/types.dart';
import 'package:anifox/core/app/logging.dart';
import 'package:anifox/core/app/values.dart';
import 'package:html/parser.dart' as html;
import 'package:anifox/core/network/network.dart';

/// AnimeParadise provider.
///
/// Base: `https://www.animeparadise.moe`. The site exposes anime pages at
/// `/anime/:slug` and episode watch pages with embedded video. This provider
/// scrapes search + episode lists from HTML and resolves streams by
/// extracting m3u8/mp4 embeds.
class AnimeParadise extends AnimeProvider {
  @override
  String providerName = "animeparadise";

  static const _baseUrl = "https://www.animeparadise.moe";

  Map<String, String> get _headers => {
        'Referer': '$_baseUrl/',
        'User-Agent': AppValues.defaultClientUserAgent,
      };

  @override
  Future<List<Map<String, String?>>> search(String query) async {
    final q = Uri.encodeQueryComponent(query.trim());
    // Site search route.
    final candidates = [
      "$_baseUrl/search?q=$q",
      "$_baseUrl/anime/search?q=$q",
      "$_baseUrl/api/search?query=$q",
    ];
    for (final url in candidates) {
      try {
        final res = await get(Uri.parse(url), headers: _headers, cacheDuration: const Duration(minutes: 5));
        if (res.statusCode != 200 || res.body.isEmpty) continue;
        List<Map<String, String?>> parsed;
        if (res.body.trim().startsWith('{') || res.body.trim().startsWith('[')) {
          parsed = _parseSearchJson(res.body);
        } else {
          parsed = _parseSearchHtml(res.body);
        }
        if (parsed.isNotEmpty) return parsed;
      } catch (e) {
        Logs.app.log("AnimeParadise search attempt failed ($url): $e");
      }
    }
    return [];
  }

  List<Map<String, String?>> _parseSearchJson(String body) {
    try {
      final decoded = jsonDecode(body);
      final list = decoded is List ? decoded : (decoded['results'] ?? decoded['data'] ?? decoded['anime'] ?? []);
      return (list as List).map<Map<String, String?>>((it) {
        final title = it['title']?.toString() ?? it['name']?.toString();
        final link = it['link']?.toString() ?? it['url']?.toString() ?? it['slug']?.toString() ?? it['_id']?.toString();
        final img = it['image']?.toString() ?? it['poster']?.toString() ?? it['cover']?.toString() ?? it['thumbnail']?.toString();
        if (title == null || link == null) return {'name': title, 'alias': link, 'imageUrl': img};
        final alias = link.startsWith('http') ? link : (link.startsWith('/anime') ? '$_baseUrl$link' : '$_baseUrl/anime/$link');
        final image = img == null ? null : (img.startsWith('http') ? img : '$_baseUrl$img');
        return {'name': title, 'alias': alias, 'imageUrl': image};
      }).toList();
    } catch (_) {
      return [];
    }
  }

  List<Map<String, String?>> _parseSearchHtml(String body) {
    final doc = html.parse(body);
    final results = <Map<String, String?>>[];
    final seen = <String>{};
    for (final a in doc.querySelectorAll('a[href*="/anime/"]')) {
      final href = a.attributes['href'];
      if (href == null || href == '/anime' || !seen.add(href)) continue;
      // Skip nav links without images/titles.
      final img = a.querySelector('img')?.attributes['src'] ?? a.querySelector('img')?.attributes['data-src'];
      final title = a.querySelector('.title, h3, h2, p')?.text.trim() ?? a.attributes['title']?.trim() ?? a.text.trim();
      if (title.isEmpty || title.length > 120) continue;
      results.add({
        'name': title,
        'alias': href.startsWith('http') ? href : '$_baseUrl$href',
        'imageUrl': img == null ? null : (img.startsWith('http') ? img : '$_baseUrl$img'),
      });
      if (results.length >= 30) break;
    }
    return results;
  }

  @override
  Future<List<Map<String, dynamic>>> getAnimeEpisodeLink(String aliasId, {bool dub = false}) async {
    final pageUrl = aliasId.startsWith('http') ? aliasId : '$_baseUrl$aliasId';
    final res = await get(Uri.parse(pageUrl), headers: _headers, cacheDuration: const Duration(minutes: 5));
    // Try embedded JSON first (__NEXT_DATA__ / window state).
    final jsonEps = _parseEpisodesFromJson(res.body, pageUrl);
    if (jsonEps.isNotEmpty) return jsonEps;

    final doc = html.parse(res.body);
    final eps = <Map<String, dynamic>>[];
    final links = doc.querySelectorAll('a[href*="/watch"], a[href*="/episode"], .episode-list a, .episodes a');
    int i = 1;
    for (final a in links) {
      final href = a.attributes['href'];
      if (href == null) continue;
      final num = int.tryParse(a.attributes['data-episode'] ?? RegExp(r'(\d+)').firstMatch(a.text)?.group(1) ?? '') ?? i;
      eps.add({
        'episodeLink': href.startsWith('http') ? href : '$_baseUrl$href',
        'episodeNumber': num,
        'episodeTitle': a.attributes['title'] ?? (a.text.trim().isEmpty ? null : a.text.trim()),
        'thumbnail': a.querySelector('img')?.attributes['src'],
        'hasDub': res.body.toLowerCase().contains('"dub"') || href.toLowerCase().contains('dub'),
        'isFiller': false,
      });
      i++;
    }
    // De-dupe + sort.
    final byNum = <int, Map<String, dynamic>>{};
    for (final e in eps) {
      byNum[e['episodeNumber'] as int] = e;
    }
    final sorted = byNum.values.toList()..sort((a, b) => (a['episodeNumber'] as int).compareTo(b['episodeNumber'] as int));
    if (sorted.isEmpty) {
      // Movie / single episode fallback.
      sorted.add({
        'episodeLink': pageUrl,
        'episodeNumber': 1,
        'episodeTitle': doc.querySelector('h1')?.text.trim(),
        'thumbnail': doc.querySelector('img')?.attributes['src'],
        'hasDub': false,
        'isFiller': false,
      });
    }
    return sorted;
  }

  List<Map<String, dynamic>> _parseEpisodesFromJson(String body, String pageUrl) {
    try {
      final nextData = RegExp(r'<script[^>]*id="__NEXT_DATA__"[^>]*>(.*?)</script>', dotAll: true).firstMatch(body)?.group(1);
      if (nextData == null) return [];
      final decoded = jsonDecode(nextData);
      final str = jsonEncode(decoded);
      // Heuristic: find episode arrays with ep numbers + links.
      final epMatches = RegExp(r'"ep(?:isode)?(?:Num|Number|_num)?"\s*:\s*(\d+)').allMatches(str);
      if (epMatches.isEmpty) return [];
      final nums = epMatches.map((m) => int.parse(m.group(1)!)).toSet().toList()..sort();
      return nums.map((n) => {
            'episodeLink': '$pageUrl/$n',
            'episodeNumber': n,
            'episodeTitle': null,
            'thumbnail': null,
            'hasDub': false,
            'isFiller': false,
          }).toList();
    } catch (_) {
      return [];
    }
  }

  @override
  Future<void> getStreams(String episodeId, Function(List<VideoStream> list, bool) update,
      {bool dub = false, String? metadata}) async {
    try {
      final pageUrl = episodeId.startsWith('http') ? episodeId : '$_baseUrl$episodeId';
      final res = await get(Uri.parse(pageUrl), headers: _headers, cacheDuration: const Duration(hours: 1));
      final streams = _extractFromHtml(res.body, pageUrl);
      if (streams.isEmpty) {
        update([], true);
        return;
      }
      update(streams, true);
    } catch (e) {
      Logs.app.log("AnimeParadise getStreams failed: $e");
      update([], true);
    }
  }

  List<VideoStream> _extractFromHtml(String body, String referer) {
    final out = <VideoStream>[];
    final seen = <String>{};
    // Direct m3u8 / mp4 embeds.
    for (final m in RegExp(r'https?[^"\s\\]+\.m3u8[^"\s\\]*').allMatches(body)) {
      final url = m.group(0)!;
      if (seen.add(url)) {
        out.add(VideoStream(quality: 'multi-quality', url: url, server: 'AnimeParadise', backup: false, customHeaders: {'Referer': referer}));
      }
    }
    for (final m in RegExp(r'https?[^"\s\\]+\.mp4[^"\s\\]*').allMatches(body)) {
      final url = m.group(0)!;
      if (seen.add(url) && out.length < 6) {
        out.add(VideoStream(quality: 'single', url: url, server: 'AnimeParadise', backup: false, customHeaders: {'Referer': referer}));
      }
    }
    // Iframe fallbacks.
    if (out.isEmpty) {
      final doc = html.parse(body);
      for (final iframe in doc.querySelectorAll('iframe')) {
        final src = iframe.attributes['src'] ?? iframe.attributes['data-src'];
        if (src != null && src.startsWith('http') && seen.add(src)) {
          out.add(VideoStream(quality: 'multi-quality', url: src, server: 'AnimeParadise', backup: true, customHeaders: {'Referer': referer}));
        }
      }
    }
    return out;
  }

  @override
  Future<void> getDownloadSources(String episodeUrl, Function(List<VideoStream> list, bool) update,
      {bool dub = false, String? metadata}) {
    return getStreams(episodeUrl, update, dub: dub, metadata: metadata);
  }
}
