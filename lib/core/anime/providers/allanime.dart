import 'dart:convert';

import 'package:anifox/core/anime/providers/allanime_crypto.dart';
import 'package:anifox/core/anime/providers/animeProvider.dart';
import 'package:anifox/core/anime/providers/types.dart';
import 'package:anifox/core/app/logging.dart';
import 'package:anifox/core/app/values.dart';
import 'package:anifox/core/network/network.dart';

/// AllAnime provider (GraphQL `api.allanime.day`, with `mkissa` mirrors).
///
/// 2026 notes: the API moved behind Referer/Origin checks and an `aaReq`
/// token for episode sources. This implementation:
///  - searches via POST GraphQL (falls back to GET),
///  - lists episodes via show query,
///  - resolves streams by decrypting `tobeparsed` payloads when possible
///    and otherwise returning the raw embed URLs as backup streams.
class AllAnime extends AnimeProvider {
  @override
  String providerName = "allanime";

  static const List<String> _apis = [
    "https://api.allanime.day/api",
    "https://api.mkissa.net/api",
  ];

  static const _referer = "https://mkissa.to";
  static const _base = "https://allanime.to";

  Map<String, String> get _headers => {
        'Referer': _referer,
        'Origin': _referer,
        'User-Agent': AppValues.defaultClientUserAgent,
        'Content-Type': 'application/json',
      };

  Future<dynamic> _graphql(String query, Map<String, dynamic> variables) async {
    Object? lastErr;
    for (final api in _apis) {
      // Try POST first (2026 preferred).
      try {
        final res = await post(
          Uri.parse(api),
          headers: _headers,
          body: jsonEncode({'query': query, 'variables': variables}),
          cacheDuration: const Duration(minutes: 5),
        );
        if (res.statusCode == 200 && res.body.contains('data')) {
          return res.json['data'];
        }
        lastErr = 'HTTP ${res.statusCode}';
      } catch (e) {
        lastErr = e;
      }
      // Fallback GET with encoded params.
      try {
        final uri = Uri.parse("$api?variables=${Uri.encodeComponent(jsonEncode(variables))}&query=${Uri.encodeComponent(query)}");
        final res = await get(uri, headers: _headers, cacheDuration: const Duration(minutes: 5));
        if (res.statusCode == 200 && res.body.contains('data')) {
          return res.json['data'];
        }
        lastErr = 'HTTP ${res.statusCode}';
      } catch (e) {
        lastErr = e;
      }
    }
    throw Exception("AllAnime API unreachable: $lastErr");
  }

  @override
  Future<List<Map<String, String?>>> search(String query) async {
    const gql = r'''
      query($search: SearchInput, $limit: Int, $page: Int, $translationType: VaildTranslationTypeEnumType, $countryOrigin: VaildCountryOriginEnumType) {
        shows(search: $search, limit: $limit, page: $page, translationType: $translationType, countryOrigin: $countryOrigin) {
          edges { _id name thumbnail availableEpisodes }
        }
      }
    ''';
    final data = await _graphql(gql, {
      "search": {"allowAdult": false, "allowUnknown": false, "query": query},
      "limit": 30,
      "page": 1,
      "translationType": "sub",
      "countryOrigin": "ALL",
    });
    final edges = (data?['shows']?['edges'] as List?) ?? [];
    return edges.map<Map<String, String?>>((e) {
      final thumb = e['thumbnail'] as String?;
      return {
        'name': e['name']?.toString(),
        'alias': e['_id']?.toString(),
        'imageUrl': thumb != null ? 'https://wp.youtube-anime.com/$thumb' : null,
      };
    }).toList();
  }

  @override
  Future<List<Map<String, dynamic>>> getAnimeEpisodeLink(String aliasId, {bool dub = false}) async {
    const gql = r'''
      query($showId: String!) {
        show(_id: $showId) {
          _id name
          availableEpisodes(sub: true, dub: true, raw: true)
          availableEpisodesDetail(sub: true, dub: true)
        }
      }
    ''';
    final data = await _graphql(gql, {"showId": aliasId});
    final show = data?['show'];
    if (show == null) return [];
    final Map<String, dynamic> epsMap = Map<String, dynamic>.from(show['availableEpisodes'] ?? {});
    final subEps = _expandRange(epsMap['sub']);
    final dubEps = _expandRange(epsMap['dub']);
    final rawEps = _expandRange(epsMap['raw']);

    final allNums = {...subEps, ...dubEps, ...rawEps}.toList()..sort(_epCompare);
    return allNums.map((ep) {
      return {
        'episodeLink': '$aliasId|$ep',
        'episodeNumber': int.tryParse(ep) ?? double.tryParse(ep)?.toInt() ?? 0,
        'episodeTitle': null,
        'thumbnail': null,
        'hasDub': dubEps.contains(ep),
        'isFiller': false,
        'metadata': aliasId,
      };
    }).toList();
  }

  List<String> _expandRange(dynamic v) {
    if (v == null) return [];
    if (v is List) return v.map((e) => e.toString()).toList();
    if (v is num) return List.generate(v.toInt(), (i) => '${i + 1}');
    return [];
  }

  int _epCompare(String a, String b) {
    final da = double.tryParse(a) ?? 0;
    final db = double.tryParse(b) ?? 0;
    return da.compareTo(db);
  }

  @override
  Future<void> getStreams(String episodeId, Function(List<VideoStream> list, bool) update,
      {bool dub = false, String? metadata}) async {
    try {
      // episodeLink format: "showId|ep"
      final parts = episodeId.split('|');
      final showId = parts.first;
      final ep = parts.length > 1 ? parts[1] : (metadata ?? '1');
      final translation = dub ? 'dub' : 'sub';

      final sources = await _fetchEpisodeSources(showId, translation, ep);
      if (sources.isEmpty) {
        update([], true);
        return;
      }

      final out = <VideoStream>[];
      for (final s in sources) {
        try {
          final stream = _parseSourceUrl(s, showId, ep);
          if (stream != null) out.add(stream);
        } catch (e) {
          Logs.app.log("AllAnime source parse failed: $e");
        }
      }
      update(out, true);
    } catch (e) {
      Logs.app.log("AllAnime getStreams failed: $e");
      update([], true);
    }
  }

  /// Fetches `sourceUrls` via the signed persisted-query form.
  ///
  /// Plain (unsigned) episode queries are rejected with AA_CRYPTO_MISSING,
  /// so this always sends the `aaReq` token (see [AllAnimeCrypto]). Handles
  /// both response shapes: direct `sourceUrls` lists and encrypted
  /// `tobeparsed` blobs.
  Future<List<dynamic>> _fetchEpisodeSources(
      String showId, String translation, String ep) async {
    final variables = jsonEncode({
      'showId': showId,
      'translationType': translation,
      'episodeString': ep,
    });
    Object? lastErr;
    for (final api in _apis) {
      try {
        final uri = Uri.parse(
            "$api?variables=${Uri.encodeComponent(variables)}"
            "&extensions=${Uri.encodeComponent(AllAnimeCrypto.buildExtensionsParam())}");
        final res = await get(uri, headers: _headers, cacheDuration: const Duration(minutes: 5));
        if (res.statusCode != 200 || res.body.isEmpty) {
          lastErr = 'HTTP ${res.statusCode}';
          continue;
        }
        final decoded = jsonDecode(res.body);
        // Surface server-side rejections with context (crypto rotation,
        // captcha, rate limits) instead of silently returning nothing.
        final errors = decoded['errors'] as List?;
        if (errors != null && errors.isNotEmpty) {
          final msg = errors.map((e) => e['message']).join('; ');
          Logs.app.log('AllAnime episode errors ($api): $msg');
          if (msg.contains('NEED_CAPTCHA')) {
            throw Exception(
                'AllAnime is asking for captcha verification right now. Try again later or switch source.');
          }
          lastErr = msg;
          continue;
        }
        final data = decoded['data']?['episode'];
        if (data == null) {
          // Encrypted shape: {"tobeparsed": "<base64>"} somewhere in body.
          final m = RegExp(r'"tobeparsed"\s*:\s*"([^"]+)"').firstMatch(res.body);
          if (m != null) {
            try {
              final plain = AllAnimeCrypto.decryptTobeparsed(m.group(1)!);
              final parsed = jsonDecode(plain);
              final list = _extractSourceList(parsed);
              if (list.isNotEmpty) return list;
            } catch (e) {
              Logs.app.log('AllAnime tobeparsed decrypt failed: $e');
            }
          }
          lastErr = 'empty episode data';
          continue;
        }
        final list = _extractSourceList(data);
        if (list.isNotEmpty) return list;
        lastErr = 'no sources in episode data';
      } catch (e) {
        lastErr = e;
      }
    }
    Logs.app.log('AllAnime episode sources failed on all mirrors: $lastErr');
    return [];
  }

  List<dynamic> _extractSourceList(dynamic data) {
    if (data is Map) {
      final direct = data['sourceUrls'];
      if (direct is List) return direct;
    }
    if (data is List) return data;
    return [];
  }

  VideoStream? _parseSourceUrl(dynamic s, String showId, String ep) {
    final raw = s['sourceUrl']?.toString() ?? '';
    final name = s['sourceName']?.toString() ?? 'AllAnime';
    if (raw.isEmpty) return null;
    // "--" prefixed URLs are internal encoded embeds.
    String url = raw;
    if (raw.startsWith('--')) {
      final decoded = _decodeAllAnimeLink(raw);
      url = decoded.startsWith('http') ? decoded : '$_base$decoded';
    }
    return VideoStream(
      quality: '${s['quality'] ?? 'multi-quality'}',
      url: url,
      server: name,
      backup: raw.startsWith('--'),
      customHeaders: {'Referer': _referer, 'Origin': _referer},
    );
  }

  /// Best-effort decode of AllAnime `--` links (hex swap + char replace).
  /// Full AES decryption of `tobeparsed` requires site keys; raw URL is
  /// returned as backup when decode is incomplete.
  String _decodeAllAnimeLink(String encoded) {
    try {
      var s = encoded.substring(2);
      // allanime encodes by replacing and hex-decoding in chunks.
      s = s.replaceAllMapped(RegExp(r'..'), (m) {
        final hex = m.group(0)!;
        final code = int.tryParse(hex, radix: 16);
        if (code == null) return hex;
        return String.fromCharCode(code);
      });
      if (s.startsWith('http') || s.startsWith('/')) return s;
      return encoded;
    } catch (_) {
      return encoded;
    }
  }

  @override
  Future<void> getDownloadSources(String episodeUrl, Function(List<VideoStream> list, bool) update,
      {bool dub = false, String? metadata}) {
    return getStreams(episodeUrl, update, dub: dub, metadata: metadata);
  }
}
