import 'dart:convert';

import 'package:anifox/core/anime/extensions/extension_models.dart';
import 'package:anifox/core/anime/providers/animeProvider.dart';
import 'package:anifox/core/anime/providers/types.dart';
import 'package:anifox/core/app/logging.dart';
import 'package:anifox/core/network/network.dart';

/// Adapter that executes a Mangayomi-style JS extension source.
///
/// ShonenX executes Mangayomi/JS sources natively via its runtime bridge.
/// AniFox v2 ships a lightweight compatible adapter: the JS source code is
/// fetched from the repo, cached locally, and executed through the app's
/// HTTP + HTML pipeline via well-known entry points (`search`, `episodes`,
/// `streams`). Sources that need a full JS engine degrade gracefully to
/// direct HTTP scraping with clear logging.
///
/// To plug a real JS engine later (e.g. `flutter_qjs`), implement
/// [JsEngine.execute] and pass it to [MangayomiExtensionAdapter.engine].
abstract class JsEngine {
  Future<String> execute(String code, String method, Map<String, dynamic> args);
}

class MangayomiExtensionAdapter extends AnimeProvider {
  MangayomiExtensionAdapter({
    required this.extension,
    required this.sourceCode,
    JsEngine? engine,
  }) : engine = engine ?? globalEngine;

  final ExtensionSource extension;
  final String sourceCode;

  /// Instance JS engine (falls back to [globalEngine]).
  final JsEngine? engine;

  /// Global JS engine (e.g. flutter_qjs). Set once at startup:
  /// `MangayomiExtensionAdapter.globalEngine = MyQjsEngine();`
  static JsEngine? globalEngine;

  @override
  String get providerName => extension.id;

  Map<String, String> get _headers => {
        'Referer': extension.baseUrl ?? 'https://www.google.com/',
      };

  /// Extract string constants that look like base URLs from JS code.
  String? _guessBaseUrl() {
    if (extension.baseUrl != null) return extension.baseUrl;
    final match = RegExp(r'''baseUrl\s*=\s*["'](https?://[^"']+)["']''')
        .firstMatch(sourceCode);
    return match?.group(1);
  }

  @override
  Future<List<Map<String, String?>>> search(String query) async {
    // 1. Try JS engine if available.
    if (engine != null) {
      try {
        final raw = await engine!.execute(sourceCode, 'search', {'query': query});
        final decoded = jsonDecode(raw);
        if (decoded is List) {
          return decoded.map<Map<String, String?>>((e) {
            final m = Map<String, dynamic>.from(e as Map);
            return {
              'name': m['name']?.toString() ?? m['title']?.toString(),
              'alias': m['alias']?.toString() ?? m['url']?.toString() ?? m['link']?.toString(),
              'imageUrl': m['imageUrl']?.toString() ?? m['image']?.toString(),
            };
          }).toList();
        }
      } catch (e) {
        Logs.app.log("Mangayomi JS search failed, HTTP fallback: $e");
      }
    }

    // 2. HTTP fallback: guess search endpoint from base URL.
    final base = _guessBaseUrl();
    if (base == null) {
      throw Exception("Extension ${extension.name} has no base URL and no JS engine.");
    }
    final url = "$base/search.html?keyword=${Uri.encodeQueryComponent(query)}";
    final res = await get(Uri.parse(url), headers: _headers, cacheDuration: const Duration(minutes: 5));
    // Very generic parse: links + titles.
    final results = <Map<String, String?>>[];
    final linkRe = RegExp(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', dotAll: true);
    final seen = <String>{};
    for (final m in linkRe.allMatches(res.body)) {
      final href = m.group(1)!;
      if (!href.contains('/') || !seen.add(href)) continue;
      final title = m.group(2)!.replaceAll(RegExp(r'<[^>]+>'), '').trim();
      if (title.isEmpty || title.length > 120) continue;
      results.add({
        'name': title,
        'alias': href.startsWith('http') ? href : '$base$href',
        'imageUrl': null,
      });
      if (results.length >= 25) break;
    }
    return results;
  }

  @override
  Future<List<Map<String, dynamic>>> getAnimeEpisodeLink(String aliasId, {bool dub = false}) async {
    if (engine != null) {
      try {
        final raw = await engine!.execute(sourceCode, 'episodes', {'alias': aliasId});
        final decoded = jsonDecode(raw);
        if (decoded is List) {
          return decoded.map<Map<String, dynamic>>((e) => Map<String, dynamic>.from(e as Map)).toList();
        }
      } catch (e) {
        Logs.app.log("Mangayomi JS episodes failed: $e");
      }
    }
    // HTTP fallback: scrape episode links from alias page.
    final pageUrl = aliasId.startsWith('http') ? aliasId : '${_guessBaseUrl() ?? ''}$aliasId';
    final res = await get(Uri.parse(pageUrl), headers: _headers, cacheDuration: const Duration(minutes: 5));
    final eps = <Map<String, dynamic>>[];
    final epRe = RegExp(r'href="([^"]*episode[^"]*)"', caseSensitive: false);
    int i = 1;
    for (final m in epRe.allMatches(res.body)) {
      eps.add({
        'episodeLink': m.group(1)!,
        'episodeNumber': i,
        'episodeTitle': null,
        'thumbnail': null,
        'hasDub': false,
        'isFiller': false,
      });
      i++;
    }
    return eps;
  }

  @override
  Future<void> getStreams(String episodeId, Function(List<VideoStream> list, bool) update,
      {bool dub = false, String? metadata}) async {
    if (engine != null) {
      try {
        final raw = await engine!.execute(sourceCode, 'streams', {'episode': episodeId, 'dub': dub});
        final decoded = jsonDecode(raw);
        if (decoded is List) {
          final streams = decoded.map<VideoStream>((e) {
            final m = Map<String, dynamic>.from(e as Map);
            return VideoStream(
              quality: m['quality']?.toString() ?? 'multi-quality',
              url: m['url'] as String,
              server: m['server']?.toString() ?? extension.name,
              backup: (m['backup'] ?? false) as bool,
              customHeaders: {'Referer': extension.baseUrl ?? ''},
            );
          }).toList();
          update(streams, true);
          return;
        }
      } catch (e) {
        Logs.app.log("Mangayomi JS streams failed: $e");
      }
    }
    // Without a JS engine we cannot resolve obfuscated streams.
    throw UnimplementedError(
      "Extension ${extension.name} requires a JS engine for streams. "
      "Set MangayomiExtensionAdapter.engine (e.g. flutter_qjs) to enable it.",
    );
  }

  @override
  Future<void> getDownloadSources(String episodeUrl, Function(List<VideoStream> list, bool) update,
      {bool dub = false, String? metadata}) {
    return getStreams(episodeUrl, update, dub: dub, metadata: metadata);
  }
}
