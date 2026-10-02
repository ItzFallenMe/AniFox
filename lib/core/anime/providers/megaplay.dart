import 'dart:convert';

import 'package:anifox/core/anime/providers/animeProvider.dart';
import 'package:anifox/core/anime/providers/types.dart';
import 'package:anifox/core/app/logging.dart';
import 'package:anifox/core/app/values.dart';
import 'package:anifox/core/network/network.dart';
import 'package:html/parser.dart' as html;

/// MegaPlay provider.
///
/// MegaPlay (`https://megaplay.buzz`) resolves streams by TMDB/“media” id.
/// AniFox tracks anime by AniList/MAL ids, so this provider maps the search
/// query to MegaPlay's search API, lists episodes from the title page, and
/// resolves `stream/{type}/{id}/{season}/{episode}` embeds which return
/// m3u8 sources + subtitles.
class MegaPlay extends AnimeProvider {
  @override
  String providerName = "megaplay";

  static const _baseUrl = "https://megaplay.buzz";
  static const _apiUrl = "https://megaplay.buzz/api";

  Map<String, String> get _headers => {
        'Referer': '$_baseUrl/',
        'Origin': _baseUrl,
        'User-Agent': AppValues.defaultClientUserAgent,
      };

  @override
  Future<List<Map<String, String?>>> search(String query) async {
    final q = Uri.encodeQueryComponent(query.trim());
    final candidates = [
      "$_apiUrl/search?q=$q",
      "$_apiUrl/anime/search?q=$q",
      "$_baseUrl/api/search/$q",
    ];
    for (final url in candidates) {
      try {
        final res = await get(Uri.parse(url), headers: _headers, cacheDuration: const Duration(minutes: 5));
        if (res.statusCode != 200 || res.body.isEmpty) continue;
        final parsed = _parseSearchBody(res.body);
        if (parsed.isNotEmpty) return parsed;
      } catch (e) {
        Logs.app.log("MegaPlay search failed ($url): $e");
      }
    }
    return [];
  }

  List<Map<String, String?>> _parseSearchBody(String body) {
    // Try JSON first.
    try {
      final decoded = jsonDecode(body);
      final list = decoded is List ? decoded : (decoded['results'] ?? decoded['data'] ?? decoded['animes'] ?? []);
      final out = <Map<String, String?>>[];
      for (final it in (list as List)) {
        final title = it['title']?.toString() ?? it['name']?.toString();
        final id = it['id']?.toString() ?? it['tmdb_id']?.toString() ?? it['mal_id']?.toString();
        if (title == null || id == null) continue;
        final img = it['poster']?.toString() ?? it['image']?.toString() ?? it['poster_path']?.toString();
        out.add({
          'name': title,
          // alias encodes mediatype + id: "anime/<id>"
          'alias': 'anime/$id',
          'imageUrl': img == null ? null : (img.startsWith('http') ? img : 'https://image.tmdb.org/t/p/w500$img'),
        });
      }
      if (out.isNotEmpty) return out;
    } catch (_) {}
    // HTML fallback.
    final doc = html.parse(body);
    final out = <Map<String, String?>>[];
    for (final a in doc.querySelectorAll('a[href*="/anime/"], a[href*="/stream/"]')) {
      final href = a.attributes['href'];
      if (href == null) continue;
      final title = a.attributes['title'] ?? a.text.trim();
      if (title.isEmpty) continue;
      out.add({
        'name': title,
        'alias': href.startsWith('http') ? Uri.parse(href).path.replaceFirst('/', '') : href.replaceFirst('/', ''),
        'imageUrl': a.querySelector('img')?.attributes['src'],
      });
      if (out.length >= 30) break;
    }
    return out;
  }

  @override
  Future<List<Map<String, dynamic>>> getAnimeEpisodeLink(String aliasId, {bool dub = false}) async {
    // aliasId: "anime/<tmdbId>"
    final clean = aliasId.replaceFirst(RegExp(r'^/+'), '');
    // Try API episode count.
    final id = clean.split('/').last;
    final candidates = [
      "$_apiUrl/anime/$id",
      "$_apiUrl/info/$id",
      "$_baseUrl/api/anime/$id",
    ];
    for (final url in candidates) {
      try {
        final res = await get(Uri.parse(url), headers: _headers, cacheDuration: const Duration(minutes: 5));
        if (res.statusCode != 200) continue;
        final eps = _parseEpisodesBody(res.body, clean);
        if (eps.isNotEmpty) return eps;
      } catch (_) {}
    }
    // Fallback: scrape title page for episode count.
    try {
      final res = await get(Uri.parse("$_baseUrl/stream/$clean/1/1"), headers: _headers);
      final total = RegExp(r'"totalEpisodes"\s*:\s*(\d+)').firstMatch(res.body)?.group(1) ??
          RegExp(r'episodes?\s*[:=]\s*(\d+)', caseSensitive: false).firstMatch(res.body)?.group(1);
      final count = int.tryParse(total ?? '') ?? 12;
      return List.generate(count, (i) => {
            'episodeLink': '$clean/${i + 1}',
            'episodeNumber': i + 1,
            'episodeTitle': null,
            'thumbnail': null,
            'hasDub': true,
            'isFiller': false,
            'metadata': clean,
          });
    } catch (_) {}
    return List.generate(12, (i) => {
          'episodeLink': '$clean/${i + 1}',
          'episodeNumber': i + 1,
          'episodeTitle': null,
          'thumbnail': null,
          'hasDub': true,
          'isFiller': false,
          'metadata': clean,
        });
  }

  List<Map<String, dynamic>> _parseEpisodesBody(String body, String alias) {
    try {
      final decoded = jsonDecode(body);
      final total = decoded['totalEpisodes'] ?? decoded['episodes'] ?? decoded['episodeCount'];
      int count = 0;
      if (total is num) {
        count = total.toInt();
      } else if (total is List) {
        return total.asMap().entries.map((e) {
          final num = int.tryParse(e.value.toString()) ?? (e.key + 1);
          return {
            'episodeLink': '$alias/$num',
            'episodeNumber': num,
            'episodeTitle': null,
            'thumbnail': null,
            'hasDub': true,
            'isFiller': false,
            'metadata': alias,
          };
        }).toList();
      }
      if (count <= 0 || count > 3000) return [];
      return List.generate(count, (i) => {
            'episodeLink': '$alias/${i + 1}',
            'episodeNumber': i + 1,
            'episodeTitle': null,
            'thumbnail': null,
            'hasDub': true,
            'isFiller': false,
            'metadata': alias,
          });
    } catch (_) {
      return [];
    }
  }

  @override
  Future<void> getStreams(String episodeId, Function(List<VideoStream> list, bool) update,
      {bool dub = false, String? metadata}) async {
    try {
      // episodeId forms: "anime/<id>/<ep>" or with metadata "anime/<id>".
      String path = episodeId;
      if (metadata != null && metadata.isNotEmpty && !episodeId.contains('/')) {
        path = '$metadata/$episodeId';
      }
      path = path.replaceFirst(RegExp(r'^/+'), '');
      final epNum = RegExp(r'(\d+)$').firstMatch(path)?.group(1) ?? '1';
      final base = path.replaceAll(RegExp(r'/\d+$'), '');

      // MegaPlay stream API variants.
      final candidates = [
        "$_apiUrl/stream/$base/$epNum?dub=${dub ? 1 : 0}",
        "$_apiUrl/stream/$base?ep=$epNum",
        "$_baseUrl/stream/$base/$epNum",
      ];
      for (final url in candidates) {
        try {
          final res = await get(Uri.parse(url), headers: _headers, cacheDuration: const Duration(hours: 1));
          if (res.statusCode != 200 || res.body.isEmpty) continue;
          final streams = _parseStreamBody(res.body, url);
          if (streams.isNotEmpty) {
            update(streams, true);
            return;
          }
        } catch (e) {
          Logs.app.log("MegaPlay stream attempt failed ($url): $e");
        }
      }
      update([], true);
    } catch (e) {
      Logs.app.log("MegaPlay getStreams failed: $e");
      update([], true);
    }
  }

  List<VideoStream> _parseStreamBody(String body, String referer) {
    final out = <VideoStream>[];
    // JSON with sources array.
    try {
      final decoded = jsonDecode(body);
      final sources = decoded['sources'] ?? decoded['streams'] ?? decoded['links'] ?? [];
      final subs = decoded['subtitles'] ?? decoded['subs'] ?? decoded['tracks'] ?? [];
      String? subUrl;
      if (subs is List && subs.isNotEmpty) {
        final en = subs.where((s) => (s['lang']?.toString().toLowerCase() ?? s['label']?.toString().toLowerCase() ?? '').contains('en')).firstOrNull ?? subs.first;
        subUrl = en['file']?.toString() ?? en['url']?.toString();
      }
      for (final s in (sources as List)) {
        final url = s['url']?.toString() ?? s['file']?.toString();
        if (url == null) continue;
        out.add(VideoStream(
          quality: s['quality']?.toString() ?? s['label']?.toString() ?? 'multi-quality',
          url: url,
          server: 'MegaPlay',
          backup: false,
          subtitle: subUrl,
          subtitleFormat: subUrl != null ? (subUrl.endsWith('.vtt') ? 'vtt' : 'srt') : null,
          customHeaders: {'Referer': _baseUrl, 'Origin': _baseUrl},
        ));
      }
      if (out.isNotEmpty) return out;
    } catch (_) {}
    // Raw m3u8/mp4 in HTML/JS.
    final seen = <String>{};
    for (final m in RegExp(r'https?[^"\s\\]+\.m3u8[^"\s\\]*').allMatches(body)) {
      if (seen.add(m.group(0)!)) {
        out.add(VideoStream(quality: 'multi-quality', url: m.group(0)!, server: 'MegaPlay', backup: false, customHeaders: {'Referer': _baseUrl}));
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
