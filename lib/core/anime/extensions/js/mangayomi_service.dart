import 'dart:convert';

import 'package:anifox/core/anime/extensions/extension_models.dart';
import 'package:anifox/core/anime/extensions/js/js_engine.dart';
import 'package:anifox/core/app/logging.dart';

/// Runs one installed Mangayomi JS extension inside the shared QuickJS
/// runtime, mirroring ShonenX's `MangayomiSourceMethods` contract.
///
/// Two source shapes are supported (both exist in the wild):
/// 1. **Class API** — `class DefaultExtension extends MProvider` with
///    `search(query, page, filters)`, `getDetail(url)`, `getVideoList(url)`.
/// 2. **Simple-function API** — top-level `searchResults`, `extractDetails`,
///    `extractEpisodes`, `extractStreamUrl` functions.
///
/// Result shapes (same as the bridge):
/// - search/popular: `{list: [{name, imageUrl, link}], hasNextPage}`
/// - detail: `{description, author, status, genre, chapters|episodes: [{name, url, ...}]}`
/// - videos: `[{url, quality, originalUrl, headers, subtitles: [{file, label}]}]`
class MangayomiService {
  MangayomiService(this.extension, this.sourceCode);

  final ExtensionSource extension;
  final String sourceCode;

  /// Isolated runtime per extension (extension JS defines globals that must
  /// not leak into other extensions).
  ExtensionJsEngine get _engine => ExtensionJsEngine.forExtension(extension.id);

  String get _module => 'ext_${extension.id.hashCode.abs()}';
  bool _loaded = false;

  Future<void> _ensureLoaded() async {
    if (_loaded) return;
    final engine = _engine;
    await engine.init();
    // Provide `this.source` metadata the way the bridge does.
    await engine.eval('''
globalThis.__anifoxSource = ${const _SourceMetaEncoder().encode(extension)};
''');
    await engine.loadModule(_module, sourceCode);
    // Bind MProvider.source getter to our metadata.
    await engine.eval('''
try {
  const __m = globalThis['$_module'];
  if (__m != null && __m.source === undefined) {
    Object.defineProperty(Object.getPrototypeOf(__m), 'source', {
      get: function() { return globalThis.__anifoxSource; },
      configurable: true,
    });
  }
} catch (e) {}
''');
    _loaded = true;
  }

  Future<bool> _usesClassApi() async {
    await _ensureLoaded();
    return _engine.moduleHasClass(_module);
  }

  // ------------------------------------------------------------- search

  Future<List<Map<String, String?>>> search(String query, {int page = 1}) async {
    await _ensureLoaded();
    final engine = _engine;
    dynamic decoded;
    try {
      if (await _usesClassApi()) {
        decoded = await engine.callModuleMethod(_module, 'search', [query, page, []]);
      } else {
        decoded = await engine.callFunction('searchResults', [query]);
      }
    } catch (e) {
      Logs.app.log('Extension ${extension.name} search failed: $e');
      return [];
    }
    final list = _asList(decoded is Map ? decoded['list'] : decoded);
    return mapSearchResults(list);
  }

  /// Pure mapping: extension search items → AniFox search rows. Tested.
  static List<Map<String, String?>> mapSearchResults(List<dynamic> list) {
    return list.map<Map<String, String?>>((e) {
      final m = Map<String, dynamic>.from(e as Map);
      return {
        'name': m['name']?.toString() ?? m['title']?.toString(),
        'alias': m['link']?.toString() ?? m['url']?.toString() ?? m['alias']?.toString(),
        'imageUrl': m['imageUrl']?.toString() ?? m['image']?.toString() ?? m['cover']?.toString(),
      };
    }).toList();
  }

  // ------------------------------------------------------------ episodes

  Future<List<Map<String, dynamic>>> episodes(String aliasUrl, {bool dub = false}) async {
    await _ensureLoaded();
    final engine = _engine;
    dynamic decoded;
    try {
      if (await _usesClassApi()) {
        decoded = await engine.callModuleMethod(_module, 'getDetail', [aliasUrl]);
      } else {
        decoded = await engine.callFunction('extractDetails', [aliasUrl]);
        if (decoded is Map && decoded['episodes'] == null) {
          final eps = await engine.callFunction('extractEpisodes', [aliasUrl]);
          decoded = {...decoded, 'episodes': eps};
        }
      }
    } catch (e) {
      Logs.app.log('Extension ${extension.name} episodes failed: $e');
      return [];
    }
    if (decoded is! Map) return [];
    final raw = (decoded['episodes'] ?? decoded['chapters']);
    return mapEpisodes(_asList(raw));
  }

  /// Pure mapping: extension detail episodes → AniFox episode rows. Tested.
  static List<Map<String, dynamic>> mapEpisodes(List<dynamic> list) {
    final out = <Map<String, dynamic>>[];
    int i = 1;
    for (final e in list) {
      final m = Map<String, dynamic>.from(e as Map);
      final url = m['url']?.toString();
      if (url == null || url.isEmpty) {
        i++;
        continue;
      }
      final num = _episodeNumber(m['num'] ?? m['episodeNumber'] ?? m['name'], i);
      final scan = (m['scanlator']?.toString() ?? '').toLowerCase();
      out.add({
        'episodeLink': url,
        'episodeNumber': num,
        'episodeTitle': m['name']?.toString(),
        'thumbnail': m['thumbnailUrl']?.toString() ?? m['thumbnail']?.toString(),
        'hasDub': scan.contains('dub'),
        'isFiller': (m['isFiller'] ?? false) == true,
        'metadata': null,
      });
      i++;
    }
    out.sort((a, b) => (a['episodeNumber'] as int).compareTo(b['episodeNumber'] as int));
    return out;
  }

  static int _episodeNumber(dynamic v, int fallback) {
    if (v is num) return v.toInt();
    if (v is String) {
      final m = RegExp(r'(\d+(?:\.\d+)?)').firstMatch(v);
      if (m != null) return (double.tryParse(m.group(1)!) ?? fallback.toDouble()).toInt();
    }
    return fallback;
  }

  // ------------------------------------------------------------- streams

  Future<List<Map<String, dynamic>>> videos(String episodeUrl, {bool dub = false}) async {
    await _ensureLoaded();
    final engine = _engine;
    dynamic decoded;
    try {
      if (await _usesClassApi()) {
        decoded = await engine.callModuleMethod(_module, 'getVideoList', [episodeUrl]);
      } else {
        decoded = await engine.callFunction('extractStreamUrl', [episodeUrl]);
      }
    } catch (e) {
      Logs.app.log('Extension ${extension.name} videos failed: $e');
      return [];
    }
    final list = _asList(decoded);
    return mapVideos(list, extension.name, extension.baseUrl);
  }

  /// Pure mapping: extension video entries → AniFox stream rows. Tested.
  static List<Map<String, dynamic>> mapVideos(
      List<dynamic> list, String serverName, String? baseUrl) {
    final out = <Map<String, dynamic>>[];
    for (final e in list) {
      final m = Map<String, dynamic>.from(e as Map);
      final url = m['url']?.toString() ?? '';
      if (url.isEmpty) continue;
      out.add({
        'url': url,
        'quality': m['quality']?.toString() ?? m['title']?.toString() ?? 'multi-quality',
        'originalUrl': m['originalUrl']?.toString() ?? url,
        'server': m['server']?.toString() ?? serverName,
        'headers': (m['headers'] as Map?)?.map((k, v) => MapEntry(k.toString(), v.toString())),
        'subtitles': ((m['subtitles'] ?? m['subs']) as List?)
                ?.map((s) => Map<String, dynamic>.from(s as Map))
                .toList() ??
            const [],
      });
    }
    return out;
  }

  List<dynamic> _asList(dynamic v) {
    if (v is List) return v;
    if (v is Map && v['list'] is List) return v['list'] as List;
    return const [];
  }
}

class _SourceMetaEncoder {
  const _SourceMetaEncoder();

  String encode(ExtensionSource e) {
    // MProvider.source metadata as a JS object literal.
    return jsonEncode({
      'id': e.id.hashCode.abs(),
      'name': e.name,
      'baseUrl': e.baseUrl ?? '',
      'lang': e.lang ?? 'en',
      'isNsfw': e.isNsfw,
    });
  }
}
