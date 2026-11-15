import 'package:flutter_test/flutter_test.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/core/privacy/embed_navigation_policy.dart';
import 'package:anifox/streaming/models/stream_source.dart';

void main() {
  const policy = EmbedNavigationPolicy();
  const vidly = StreamSource(
    id: 'vidly',
    name: 'Vidly',
    kind: StreamSourceKind.builtin,
    mediaType: MediaType.ANIME,
    baseUrl: 'https://vidly.pro',
  );

  group('EmbedNavigationPolicy', () {
    test('allows selected provider and its subdomains over HTTPS', () {
      expect(
        policy.allowsMainFrame(
          targetUrl: 'https://vidly.pro/embed/123',
          source: vidly,
          apiBaseUrl: 'https://anifox.example',
        ),
        isTrue,
      );
      expect(
        policy.allowsMainFrame(
          targetUrl: 'https://player.vidly.pro/watch/123',
          source: vidly,
          apiBaseUrl: 'https://anifox.example',
        ),
        isTrue,
      );
    });

    test('allows the configured AniFox API origin', () {
      expect(
        policy.allowsMainFrame(
          targetUrl: 'https://anifox.example/api/stream',
          source: vidly,
          apiBaseUrl: 'https://anifox.example/',
        ),
        isTrue,
      );
    });

    test('rejects unrelated hosts and lookalike domains', () {
      for (final url in [
        'https://example.com/',
        'https://vidly.pro.attacker.example/',
        'https://notvidly.pro/',
      ]) {
        expect(
          policy.allowsMainFrame(
            targetUrl: url,
            source: vidly,
            apiBaseUrl: 'https://anifox.example',
          ),
          isFalse,
          reason: url,
        );
      }
    });

    test('rejects insecure public navigation and credential URLs', () {
      for (final url in [
        'http://vidly.pro/',
        'https://user:pass@vidly.pro/',
        'javascript:alert(1)',
      ]) {
        expect(
          policy.allowsMainFrame(
            targetUrl: url,
            source: vidly,
            apiBaseUrl: 'https://anifox.example',
          ),
          isFalse,
          reason: url,
        );
      }
    });

    test('permits local HTTP development API on Android emulator', () {
      expect(
        policy.allowsMainFrame(
          targetUrl: 'http://10.0.2.2:3000/api/stream',
          source: vidly,
          apiBaseUrl: 'http://10.0.2.2:3000',
        ),
        isTrue,
      );
    });
  });
}
