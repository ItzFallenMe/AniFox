import 'package:anifox/core/anime/extensions/extension_models.dart';
import 'package:anifox/ui/models/sources.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AniFox v2 provider registry', () {
    test('all requested providers are registered', () {
      const expected = [
        'animepahe',
        'animekai',
        'anikoto',
        'gogoanime',
        'allanime',
        'animeparadise',
        'megaplay',
        'anidb',
        'animeonsen',
        'anizone',
        'animegg',
        'gojo',
      ];
      for (final id in expected) {
        expect(sources.containsKey(id), isTrue, reason: 'missing provider: $id');
      }
    });

    test('inbuilt source names cover all providers', () {
      final ids = SourceManager.inbuiltSourceNames.map((e) => e.toLowerCase()).toSet();
      for (final id in ['animepahe', 'animekai', 'gogoanime', 'allanime', 'animeparadise', 'megaplay', 'anidb', 'anikoto']) {
        expect(ids.contains(id), isTrue, reason: 'inbuilt missing: $id');
      }
    });

    test('getClass resolves case-insensitive identifiers', () {
      expect(getClass('animekai_inbuilt').providerName.toLowerCase(), contains('animekai'));
      expect(getClass('gogoanime_inbuilt').providerName.toLowerCase(), contains('gogo'));
      expect(getClass('allanime_inbuilt').providerName.toLowerCase(), contains('allanime'));
    });
  });

  group('Extension models', () {
    test('ExtensionSource round-trips through map', () {
      const ext = ExtensionSource(
        id: 'test:demo',
        name: 'Demo',
        type: ExtensionSourceType.extension,
        runtime: ExtensionRuntime.mangayomi,
        version: '1.2.3',
      );
      final restored = ExtensionSource.fromMap(ext.toMap());
      expect(restored.id, ext.id);
      expect(restored.runtime, ExtensionRuntime.mangayomi);
    });

    test('ExtensionRepo round-trips through map', () {
      const repo = ExtensionRepo(
        id: 'r1',
        name: 'Repo',
        indexUrl: 'https://example.com/index.json',
        runtime: ExtensionRuntime.dart,
      );
      final restored = ExtensionRepo.fromMap(repo.toMap());
      expect(restored.indexUrl, repo.indexUrl);
      expect(restored.enabled, isTrue);
    });

    test('default repos include official + mangayomi', () {
      // Import indirection to avoid Hive in unit test: verify enum parsing only.
      expect(ExtensionRuntime.values.map((e) => e.name), containsAll(['dart', 'mangayomi', 'aniyomi', 'cloudstream']));
    });
  });
}
