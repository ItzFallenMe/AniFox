import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:anifox/core/anime/extensions/extension_manager.dart';
import 'package:anifox/core/anime/extensions/extension_models.dart';
import 'package:anifox/core/anime/extensions/js/mangayomi_service.dart';
import 'package:anifox/core/anime/providers/allanime_crypto.dart';
import 'package:anifox/core/network/http_response.dart';
import 'package:crypto/crypto.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AllAnimeCrypto', () {
    // Vectors generated with the reference (ani-cli) algorithm:
    // key 22196fa6..., epoch 4128, buildId "12", ts 1759999800000.
    const tobeparsed =
        'B8ke/k/1hIdM/doHWPun1xdpOTTYfb8P1Cs4l0Oy2fO8+VI14USMw7mDIZzkbRFt17yfK/GsoJY/zfgNVZVnCCiUrl20pjuQ6M1VpI9qAYiPgDznXKZLSYATnH1z3lvWGh6I7ue4j5fhtqGfdUpXmaFXI0VDisB3qkvfjqXfAR+vVrzUMBJFPfoBOvnkuU/J5Ps3baW6qJQOPgF+Y/1PD4Lb5PA=';
    const payload =
        '{"v": 1, "ts": 1759999800000, "epoch": 4128, "buildId": "12", "qh": "d405d0edd690624b66baba3068e0edc3ac90f1597d898a1ec8db4e5c43c00fec"}';

    test('decryptTobeparsed matches reference output', () {
      expect(AllAnimeCrypto.decryptTobeparsed(tobeparsed), payload);
    });

    test('buildExtensionsParam round-trips through decrypt', () {
      const ts = 1759999800000;
      final extJson = AllAnimeCrypto.buildExtensionsParam(windowMs: ts);
      final ext = jsonDecode(extJson) as Map<String, dynamic>;
      expect(ext['persistedQuery']['sha256Hash'], AllAnimeCrypto.episodeQueryHash);

      // Re-derive IV exactly like the server does and decrypt our own token.
      final raw = base64Decode(ext['aaReq'] as String);
      expect(raw.first, 0x01);
      final iv = Uint8List.fromList(raw.sublist(1, 13));
      final expectedIv = sha256
          .convert(utf8.encode(
              '${AllAnimeCrypto.epoch}:${AllAnimeCrypto.buildId}:${AllAnimeCrypto.episodeQueryHash}:$ts'))
          .bytes
          .sublist(0, 12);
      expect(iv, expectedIv);
      // Token must decrypt to the payload we signed.
      final tokenB64 =
          base64Encode(Uint8List.fromList([0x07, ...iv, ...raw.sublist(13)]));
      final plain = AllAnimeCrypto.decryptTobeparsed(tokenB64);
      final back = jsonDecode(plain) as Map<String, dynamic>;
      expect(back['ts'], ts);
      expect(back['buildId'], AllAnimeCrypto.buildId);
      expect(back['epoch'], AllAnimeCrypto.epoch);
    });

    test('currentWindow is a 5-minute boundary', () {
      final w = AllAnimeCrypto.currentWindow();
      expect(w % 300000, 0);
      expect(
          (DateTime.now().millisecondsSinceEpoch - w).abs(), lessThan(300000));
    });
  });

  group('HttpResponse guards', () {
    test('ensureSuccess throws on non-2xx with context', () {
      final res = HttpResponse(403, 'blocked', reasonPhrase: 'Forbidden');
      expect(() => res.ensureSuccess('test page'), throwsA(isA<HttpException>()));
    });

    test('ensureSuccess throws on empty body', () {
      expect(
          () => HttpResponse(200, '   ').ensureSuccess('test'),
          throwsA(isA<HttpException>()));
    });

    test('ensureSuccess passes on valid responses', () {
      HttpResponse(200, '{"a":1}').ensureSuccess('test');
    });

    test('json getter rejects HTML and error statuses', () {
      expect(() => HttpResponse(200, '<html></html>').json, throwsException);
      expect(() => HttpResponse(500, 'err').json, throwsA(isA<HttpException>()));
      expect((HttpResponse(200, '{"a":1}').json as Map)['a'], 1);
    });

    test('looksLikeChallenge detects CF pages', () {
      expect(HttpResponse(403, 'x').looksLikeChallenge, isTrue);
      expect(
          HttpResponse(200, '<title>Just a moment...</title>').looksLikeChallenge,
          isTrue);
      expect(HttpResponse(200, '{"data":[]}').looksLikeChallenge, isFalse);
    });
  });

  group('Kwik URL shapes', () {
    test('both packed-JS source patterns extract', () {
      const shape1 = 'foo;source=https://example.com/vid.m3u8;bar';
      const shape2 = "blah const source = 'https://example.com/v.m3u8';";
      expect(
          RegExp(r"source\s*=\s*(https?://[^;'\s]+)").firstMatch(shape1)?.group(1),
          'https://example.com/vid.m3u8');
      expect(
          RegExp(r"const\s+source\s*=\s*'([^']+\.m3u8[^']*)'")
              .firstMatch(shape2)
              ?.group(1),
          'https://example.com/v.m3u8');
    });
  });

  group('Mangayomi result mapping (allanime.js shapes)', () {
    test('maps search rows', () {
      final rows = MangayomiService.mapSearchResults([
        {'name': 'Naruto', 'imageUrl': 'https://x/n.jpg', 'link': '/bangumi/1/naruto'},
        {'title': 'Bleach', 'url': 'https://x/b', 'cover': 'https://x/b.jpg'},
      ]);
      expect(rows.length, 2);
      expect(rows[0]['name'], 'Naruto');
      expect(rows[0]['alias'], '/bangumi/1/naruto');
      expect(rows[1]['name'], 'Bleach');
      expect(rows[1]['imageUrl'], 'https://x/b.jpg');
    });

    test('maps episodes with dub scanlators, skips empty urls', () {
      final eps = MangayomiService.mapEpisodes([
        {'num': 1, 'name': 'Episode 1', 'url': '{"showId":"1"}', 'scanlator': 'sub'},
        {'num': 2, 'name': 'Ep 2', 'url': '{"showId":"1"}', 'scanlator': 'sub, dub'},
        {'num': 3, 'name': 'Ep 3', 'url': ''},
      ]);
      expect(eps.length, 2);
      expect(eps[0]['episodeNumber'], 1);
      expect(eps[0]['hasDub'], isFalse);
      expect(eps[1]['hasDub'], isTrue);
    });

    test('maps videos with subtitles and headers', () {
      final vids = MangayomiService.mapVideos([
        {
          'url': 'https://cdn/x.m3u8',
          'quality': '1080p',
          'headers': {'Referer': 'https://x/'},
          'subtitles': [
            {'file': 'https://x/en.vtt', 'label': 'English'},
          ],
        },
        {'url': '', 'quality': 'bad'},
      ], 'AllAnime', 'https://allmanga.to');
      expect(vids.length, 1);
      expect(vids[0]['quality'], '1080p');
      expect(vids[0]['headers'], {'Referer': 'https://x/'});
      expect((vids[0]['subtitles'] as List).length, 1);
    });
  });

  group('Extension index parsing', () {
    const repo = ExtensionRepo(
      id: 'test-repo',
      name: 'Test',
      indexUrl: 'https://example.com/anime_index.json',
      runtime: ExtensionRuntime.mangayomi,
    );

    test('parses real Mangayomi anime entries, skips manga', () {      const body = '''
[{"name":"Gogoanime","id":1061885186,"baseUrl":"https://anitaku.to","lang":"en",
"typeSource":"single","iconUrl":"https://x/icon.png","isNsfw":false,"hasCloudflare":false,
"sourceCodeUrl":"https://x/gogoanime.js","version":"0.1.2","isManga":false,
"itemType":1,"sourceCodeLanguage":1},
{"name":"SomeManga","id":1,"baseUrl":"https://x","lang":"en",
"sourceCodeUrl":"https://x/m.js","version":"1.0","isManga":true,"itemType":2,
"sourceCodeLanguage":1}]''';
      final parsed = ExtensionManager.parseIndex(body, repo);
      expect(parsed.length, 1);
      final ext = parsed.first;
      expect(ext.name, 'Gogoanime');
      expect(ext.id, 'test-repo:1061885186');
      expect(ext.sourceCodeUrl, 'https://x/gogoanime.js');
      expect(ext.sourceCodeLanguage, 1);
      expect(ext.baseUrl, 'https://anitaku.to');
    });

    test('parses old lnreader-style entries', () {
      const body = '''
[{"name":"OldSrc","site":"https://old.example","url":"https://old.example/src.js",
"lang":"en","version":"1.0","iconUrl":"https://old.example/i.png"}]''';
      final parsed = ExtensionManager.parseIndex(body, repo);
      expect(parsed.length, 1);
      expect(parsed.first.sourceCodeUrl, 'https://old.example/src.js');
      expect(parsed.first.baseUrl, 'https://old.example');
    });

    test('rejects garbage without throwing', () {
      expect(ExtensionManager.parseIndex('not json', repo), isEmpty);
      expect(ExtensionManager.parseIndex('{"a":1}', repo), isEmpty);
      expect(ExtensionManager.parseIndex('[42]', repo), isEmpty);
    });
  });
}
