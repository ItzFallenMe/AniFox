import 'dart:convert';

import 'package:anifox/core/anime/extractors/streamwish.dart';
import 'package:anifox/core/anime/providers/animeProvider.dart';
import 'package:anifox/core/anime/providers/types.dart';
import 'package:anifox/core/app/logging.dart';
import 'package:anifox/core/app/values.dart';
import 'package:html/parser.dart' as html;
import 'package:anifox/core/network/network.dart';

/// Gogoanime (Anitaku) provider.
///
/// Uses the `gogoanime.by` mirror (Sept 2026 verified) with automatic
/// fallback across known mirrors. Search scrapes `/search.html`,
/// episodes scrape the anime details page, streams resolve the episode
/// page's iframe through StreamWish/generic extractors.
class Gogoanime extends AnimeProvider {
  @override
  String providerName = "gogoanime";

  static const List<String> _mirrors = [
    "https://gogoanime.by",
    "https://anitaku.to",
    "https://gogoanime.gg",
  ];

  String _baseUrl = _mirrors.first;

  Map<String, String> get _headers => {
        'Referer': '$_baseUrl/',
        'User-Agent': AppValues.defaultClientUserAgent,
      };

  Future<String> _resolveWorkingMirror() async {
    for (final mirror in _mirrors) {
      try {
        final res = await get(Uri.parse(mirror), headers: {'User-Agent': AppValues.defaultClientUserAgent});
        if (res.statusCode == 200 && res.body.contains('gogo') || res.body.length > 5000) {
          _baseUrl = mirror;
          return mirror;
        }
      } catch (_) {
        continue;
      }
    }
    return _baseUrl;
  }

  @override
  Future<List<Map<String, String?>>> search(String query) async {
    await _resolveWorkingMirror();
    final q = Uri.encodeQueryComponent(query.trim());
    final url = "$_baseUrl/search.html?keyword=$q";
    final res = await get(Uri.parse(url), headers: _headers, cacheDuration: const Duration(minutes: 5));
    final doc = html.parse(res.body);
    final results = <Map<String, String?>>[];

    final items = doc.querySelectorAll('ul.items li, .last_episodes ul.items li, div.img a');
    // Primary selector used by gogo: ul.items > li > div.img > a + p.name > a
    final lis = doc.querySelectorAll('ul.items li');
    final source = lis.isNotEmpty ? lis : items;
    for (final li in source) {
      final a = li.querySelector('div.img a') ?? li.querySelector('p.name a') ?? li.querySelector('a');
      if (a == null) continue;
      final href = a.attributes['href'];
      final title = li.querySelector('p.name a')?.text.trim() ?? a.attributes['title']?.trim() ?? a.text.trim();
      final img = li.querySelector('div.img img')?.attributes['src'];
      if (href == null || title.isEmpty) continue;
      results.add({
        'name': title,
        'alias': href.startsWith('http') ? href : '$_baseUrl$href',
        'imageUrl': img?.startsWith('http') == true ? img : (img != null ? '$_baseUrl$img' : null),
      });
    }

    // Fallback: ajax search endpoint used by newer mirrors.
    if (results.isEmpty) {
      try {
        final ajax = await get(
          Uri.parse("$_baseUrl/search.json?keyword=$q"),
          headers: _headers,
          cacheDuration: const Duration(minutes: 5),
        );
        final decoded = jsonDecode(ajax.body);
        final list = decoded is List ? decoded : decoded['results'] ?? [];
        for (final it in (list as List)) {
          results.add({
            'name': it['title']?.toString() ?? it['name']?.toString(),
            'alias': '$_baseUrl${it['url'] ?? it['link'] ?? ''}',
            'imageUrl': it['image']?.toString() ?? it['thumbnail']?.toString(),
          });
        }
      } catch (_) {}
    }
    return results;
  }

  @override
  Future<List<Map<String, dynamic>>> getAnimeEpisodeLink(String aliasId, {bool dub = false}) async {
    final pageUrl = aliasId.startsWith('http') ? aliasId : '$_baseUrl$aliasId';
    final res = await get(Uri.parse(pageUrl), headers: _headers, cacheDuration: const Duration(minutes: 5));
    final doc = html.parse(res.body);

    // episode range: #episode_page + #episode_related
    int start = 1;
    int end = 0;
    final epStart = doc.querySelector('#episode_page a')?.attributes['ep_start'];
    final epEnd = doc.querySelector('#episode_page a.active')?.attributes['ep_end'] ??
        doc.querySelector('#episode_page a:last-child')?.attributes['ep_end'];
    end = int.tryParse(epEnd ?? '') ?? 0;
    start = int.tryParse(epStart ?? '1') ?? 1;

    // movieId for ajax episode list
    final movieId = doc.querySelector('#movie_id')?.attributes['value'] ??
        RegExp("movie_id\\s*=\\s*[\"']?(\\d+)").firstMatch(res.body)?.group(1);
    final alias = doc.querySelector('#alias_anime')?.attributes['value'] ??
        RegExp("alias_anime\\s*=\\s*[\"']?([^\"']+)").firstMatch(res.body)?.group(1);

    if (movieId != null && alias != null && end > 0) {
      try {
        return await _getEpisodesViaAjax(movieId, alias, start, end);
      } catch (e) {
        Logs.app.log("Gogoanime ajax episodes failed: $e");
      }
    }

    // Fallback: parse episode links directly.
    final eps = <Map<String, dynamic>>[];
    final links = doc.querySelectorAll('#episode_related a, ul#episode_page a, .anime_video_body a');
    int i = 1;
    for (final a in links.reversed) {
      final href = a.attributes['href'];
      if (href == null || !href.contains('-episode-')) continue;
      final num = int.tryParse(RegExp(r'episode-(\d+)').firstMatch(href)?.group(1) ?? '') ?? i;
      eps.add({
        'episodeLink': href.startsWith('http') ? href : '$_baseUrl$href',
        'episodeNumber': num,
        'episodeTitle': a.text.trim().isEmpty ? null : a.text.trim(),
        'thumbnail': null,
        'hasDub': pageUrl.toLowerCase().contains('-dub') || (doc.querySelector('.anime_info_body_bg .type')?.text.toLowerCase().contains('dub') ?? false),
        'isFiller': false,
      });
      i++;
    }
    if (eps.isEmpty) {
      // Single-episode (movie) fallback.
      eps.add({
        'episodeLink': pageUrl,
        'episodeNumber': 1,
        'episodeTitle': doc.querySelector('.anime_info_body_bg h1')?.text.trim(),
        'thumbnail': null,
        'hasDub': false,
        'isFiller': false,
      });
    }
    eps.sort((a, b) => (a['episodeNumber'] as int).compareTo(b['episodeNumber'] as int));
    return eps;
  }

  Future<List<Map<String, dynamic>>> _getEpisodesViaAjax(String movieId, String alias, int start, int end) async {
    final url = "https://ajax.gogo-load.com/ajax/load-list-episode?ep_start=$start&ep_end=$end&id=$movieId&default_ep=0&alias=$alias";
    final altUrl = "$_baseUrl/ajax/load-list-episode?ep_start=$start&ep_end=$end&id=$movieId&default_ep=0&alias=$alias";
    String body;
    try {
      final res = await get(Uri.parse(url), headers: _headers, cacheDuration: const Duration(minutes: 5));
      body = res.body;
    } catch (_) {
      final res = await get(Uri.parse(altUrl), headers: _headers, cacheDuration: const Duration(minutes: 5));
      body = res.body;
    }
    final doc = html.parse(body);
    final eps = <Map<String, dynamic>>[];
    for (final li in doc.querySelectorAll('li')) {
      final a = li.querySelector('a');
      if (a == null) continue;
      final href = a.attributes['href']?.trim();
      final name = li.querySelector('.name')?.text.trim() ?? a.text.trim();
      if (href == null) continue;
      final num = int.tryParse(RegExp(r'EP\s*(\d+)', caseSensitive: false).firstMatch(name)?.group(1) ?? '') ??
          int.tryParse(RegExp(r'episode-(\d+)').firstMatch(href)?.group(1) ?? '') ??
          (eps.length + 1);
      final subDub = li.querySelector('.cate')?.text.toLowerCase() ?? '';
      eps.add({
        'episodeLink': href.startsWith('http') ? href : '$_baseUrl$href',
        'episodeNumber': num,
        'episodeTitle': name,
        'thumbnail': null,
        'hasDub': subDub.contains('dub'),
        'isFiller': false,
      });
    }
    eps.sort((a, b) => (a['episodeNumber'] as int).compareTo(b['episodeNumber'] as int));
    return eps;
  }

  @override
  Future<void> getStreams(String episodeId, Function(List<VideoStream> list, bool) update,
      {bool dub = false, String? metadata}) async {
    try {
      final pageUrl = episodeId.startsWith('http') ? episodeId : '$_baseUrl$episodeId';
      final res = await get(Uri.parse(pageUrl), headers: _headers, cacheDuration: const Duration(hours: 1));
      final doc = html.parse(res.body);

      final iframe = doc.querySelector('iframe')?.attributes['src'] ??
          doc.querySelector('.play-video iframe')?.attributes['src'] ??
          RegExp(r'<iframe[^>]+src="([^"]+)"').firstMatch(res.body)?.group(1);

      // Download link is often direct and more reliable.
      final downloadLink = doc.querySelector('li.dowloads a, li.download a')?.attributes['href'];

      final targets = <String>[];
      if (iframe != null && iframe.startsWith('http')) targets.add(iframe.startsWith('//') ? 'https:$iframe' : iframe);
      if (downloadLink != null && downloadLink.startsWith('http')) targets.add(downloadLink);

      // Server list (vidcdn, streamwish, etc.)
      for (final s in doc.querySelectorAll('.anime_muti_link a')) {
        final dataVideo = s.attributes['data-video'];
        if (dataVideo != null && dataVideo.startsWith('http')) targets.add(dataVideo);
      }

      if (targets.isEmpty) {
        update([], true);
        return;
      }

      int done = 0;
      for (final target in targets.toSet()) {
        try {
          final streams = await _extractTarget(target);
          done++;
          update(streams, done == targets.toSet().length);
        } catch (e) {
          Logs.app.log("Gogoanime extract failed for $target: $e");
          done++;
          update([], done == targets.toSet().length);
        }
      }
    } catch (e) {
      Logs.app.log("Gogoanime getStreams failed: $e");
      update([], true);
    }
  }

  Future<List<VideoStream>> _extractTarget(String url) async {
    final host = Uri.tryParse(url)?.host.toLowerCase() ?? '';
    if (host.contains('streamwish') || host.contains('wish') || host.contains('s3taku') || host.contains('gogo')) {
      try {
        return await StreamWish().extract(url);
      } catch (_) {}
    }
    // Generic: fetch and look for m3u8/mp4.
    try {
      final res = await get(Uri.parse(url), headers: _headers, cacheDuration: const Duration(hours: 1));
      final m3u8 = RegExp(r'https?[^"\s]+\.m3u8[^"\s]*').firstMatch(res.body)?.group(0);
      if (m3u8 != null) {
        return [VideoStream(quality: 'multi-quality', url: m3u8, server: 'Gogoanime', backup: false, customHeaders: {'Referer': url})];
      }
      final mp4 = RegExp(r'https?[^"\s]+\.mp4[^"\s]*').firstMatch(res.body)?.group(0);
      if (mp4 != null) {
        return [VideoStream(quality: 'single', url: mp4, server: 'Gogoanime', backup: false, customHeaders: {'Referer': url})];
      }
    } catch (_) {}
    return [VideoStream(quality: 'multi-quality', url: url, server: 'Gogoanime', backup: true, customHeaders: {'Referer': _baseUrl})];
  }

  @override
  Future<void> getDownloadSources(String episodeUrl, Function(List<VideoStream> list, bool) update,
      {bool dub = false, String? metadata}) async {
    // Gogo download page exposes direct mp4 links per quality.
    try {
      final pageUrl = episodeUrl.startsWith('http') ? episodeUrl : '$_baseUrl$episodeUrl';
      final res = await get(Uri.parse(pageUrl), headers: _headers);
      final doc = html.parse(res.body);
      final dlPage = doc.querySelector('li.dowloads a, a[href*="download"]')?.attributes['href'];
      if (dlPage == null) {
        return getStreams(episodeUrl, update, dub: dub, metadata: metadata);
      }
      final dlRes = await get(Uri.parse(dlPage.startsWith('http') ? dlPage : '$_baseUrl$dlPage'), headers: _headers);
      final dlDoc = html.parse(dlRes.body);
      final links = dlDoc.querySelectorAll(r'.mirror_link a, .dowload a, a[href$=".mp4"]');
      if (links.isEmpty) {
        return getStreams(episodeUrl, update, dub: dub, metadata: metadata);
      }
      final out = <VideoStream>[];
      for (final a in links) {
        final href = a.attributes['href'];
        if (href == null) continue;
        out.add(VideoStream(
          quality: '${a.text.trim().isEmpty ? 'download' : a.text.trim()}',
          url: href,
          server: 'Gogoanime-DL',
          backup: false,
          customHeaders: {'Referer': _baseUrl},
        ));
      }
      update(out, true);
    } catch (e) {
      Logs.app.log("Gogoanime downloads failed: $e");
      return getStreams(episodeUrl, update, dub: dub, metadata: metadata);
    }
  }
}
