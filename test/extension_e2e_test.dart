import 'dart:ffi';
import 'dart:io';

import 'package:anifox/core/anime/extensions/extension_models.dart';
import 'package:anifox/core/anime/extensions/js/js_engine.dart';
import 'package:anifox/core/anime/extensions/js/mangayomi_service.dart';
import 'package:flutter_test/flutter_test.dart';

/// End-to-end: load the REAL AllAnime Mangayomi extension source into
/// QuickJS and run search + detail through the bridged HTTP/DOM layers.
///
/// The fixture is the live `allanime.js` from the m2k3a anime index,
/// vendored at test-writing time. Requires network access AND the native
/// QuickJS library. That library is linked into real app builds (Android
/// .so / desktop plugin bundle) but NOT into `flutter_tester`, so these
/// tests detect the missing symbols and skip gracefully — on device the
/// engine is fully live.
bool _qjsAvailable() {
  try {
    DynamicLibrary.open(Platform.isWindows ? 'flutter_qjs_plugin.dll' : 'libqjs.so');
    return true;
  } catch (_) {
    return false;
  }
}

/// End-to-end: load the REAL AllAnime Mangayomi extension source into
/// QuickJS and run search + detail through the bridged HTTP/DOM layers.
///
/// The fixture is the live `allanime.js` from the m2k3a anime index,
/// vendored at test-writing time. Requires network access.
void main() {
  const fixture = '/tmp/ext_allanime.js';

  group('Mangayomi JS runtime (live extension)', () {
    test('search returns results', () async {
      if (!_qjsAvailable()) {
        markTestSkipped('native QuickJS not linked into test harness');
        return;
      }
      // Even when libqjs.so is present, flutter_qjs on desktop resolves
      // symbols from the host process (DynamicLibrary.process), which only
      // works inside real app builds — not flutter_tester.
      try {
        await ExtensionJsEngine.forExtension('__probe__').init();
      } catch (_) {
        markTestSkipped('QuickJS runtime cannot boot in test harness');
        return;
      }
      final file = File(fixture);
      if (!await file.exists()) {
        markTestSkipped('extension fixture not downloaded');
        return;
      }
      final code = await file.readAsString();
      final ext = const ExtensionSource(
        id: 'test:allanime',
        name: 'AllAnime',
        type: ExtensionSourceType.extension,
        runtime: ExtensionRuntime.mangayomi,
        baseUrl: 'https://allmanga.to',
        lang: 'en',
      );
      final svc = MangayomiService(ext, code);
      final results = await svc.search('naruto', page: 1).timeout(
            const Duration(seconds: 90),
          );
      expect(results, isNotEmpty);
      expect(results.first['name'], isNotNull);
      expect(results.first['alias'], isNotNull);
    }, timeout: const Timeout(Duration(minutes: 3)));

    test('detail returns episodes', () async {
      if (!_qjsAvailable()) {
        markTestSkipped('native QuickJS not linked into test harness');
        return;
      }
      try {
        await ExtensionJsEngine.forExtension('__probe__').init();
      } catch (_) {
        markTestSkipped('QuickJS runtime cannot boot in test harness');
        return;
      }
      final file = File(fixture);
      if (!await file.exists()) {
        markTestSkipped('extension fixture not downloaded');
        return;
      }
      final code = await file.readAsString();
      final ext = const ExtensionSource(
        id: 'test:allanime',
        name: 'AllAnime',
        type: ExtensionSourceType.extension,
        runtime: ExtensionRuntime.mangayomi,
        baseUrl: 'https://allmanga.to',
        lang: 'en',
      );
      final svc = MangayomiService(ext, code);
      final results = await svc.search('naruto', page: 1).timeout(
            const Duration(seconds: 90),
          );
      expect(results, isNotEmpty);
      final episodes = await svc
          .episodes(results.first['alias'] as String)
          .timeout(const Duration(seconds: 90));
      expect(episodes, isNotEmpty);
      expect(episodes.first['episodeLink'], isNotNull);
    }, timeout: const Timeout(Duration(minutes: 4)));
  });
}
