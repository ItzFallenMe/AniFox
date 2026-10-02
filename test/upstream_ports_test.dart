import 'package:anifox/core/anime/downloader/types.dart';
import 'package:anifox/core/app/platform.dart';
import 'package:anifox/core/commons/extensions.dart';
import 'package:anifox/core/data/types.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('upstream animestream bug-fix ports', () {
    test('DownloadStatus/DownloadItem expose isFailed', () {
      expect(DownloadStatus.failed.isFailed, isTrue);
      expect(DownloadStatus.downloading.isFailed, isFalse);
      expect(DownloadStatus.completed.isFailed, isFalse);
    });

    test('DownloadTaskIsolate defaults writeSubtitleTrackToVideo to false', () {
      // Regression guard: the isolate task must carry the flag so the
      // stream downloader can embed subs into remuxed MKVs.
      expect(
        DownloadTaskIsolate(
          url: 'https://example.com/a.m3u8',
          fileName: 'a',
          customHeaders: {},
          retryAttempts: 1,
          parallelBatches: 1,
          subsUrl: null,
          sendPort: null,
          id: 1,
          downloadPath: '/tmp',
        ).writeSubtitleTrackToVideo,
        isFalse,
      );
    });

    test('SettingsModal defaults writeSubtitleTrackToVideo to false', () {
      expect(SettingsModal.fromMap({}).writeSubtitleTrackToVideo, isFalse);
      final back = SettingsModal.fromMap(
          SettingsModal.fromMap({'writeSubtitleTrackToVideo': true}).toMap());
      expect(back.writeSubtitleTrackToVideo, isTrue);
    });
  });

  group('cross-platform helpers', () {
    test('AppPlatform getters are self-consistent', () {
      expect(AppPlatform.isDesktop, equals(AppPlatform.isWindows || AppPlatform.isLinux || AppPlatform.isMacOS));
      expect(AppPlatform.isMobile, equals(AppPlatform.isAndroid || AppPlatform.isIOS));
      // In the test VM (plain Linux/Dart) web is always false.
      expect(AppPlatform.isWeb, isFalse);
    });
  });
}
