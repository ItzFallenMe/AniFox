import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:encrypt/encrypt.dart' as enc;
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as p;

class HlsCanceledException implements Exception {
  const HlsCanceledException();
}

class HlsDownloadException implements Exception {
  final String message;

  const HlsDownloadException(this.message);

  @override
  String toString() => message;
}

class HlsDownloader {
  HlsDownloader({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;
  final Map<String, Uint8List> _keyCache = {};

  /// Downloads an HLS playlist (or a direct media file) to [outputPath].
  ///
  /// The highest-bandwidth variant is selected from master playlists and
  /// AES-128 encrypted segments are decrypted before being joined.
  Future<void> download({
    required String url,
    required String outputPath,
    required void Function(int completed, int total) onProgress,
    required bool Function() isCanceled,
    Map<String, String> headers = const {},
    int concurrency = 4,
  }) async {
    final parsed = Uri.tryParse(url);
    if (parsed == null) throw const HlsDownloadException('Invalid download URL.');

    final isHls = parsed.path.toLowerCase().endsWith('.m3u8') ||
        parsed.path.toLowerCase().endsWith('.m3u');

    final output = File(outputPath);
    await output.parent.create(recursive: true);

    if (!isHls) {
      await _downloadFile(parsed, output, onProgress, isCanceled, headers);
      return;
    }

    var playlistUri = parsed;
    var playlist = await _fetchText(playlistUri, headers);

    if (playlist.contains('#EXT-X-STREAM-INF')) {
      final variant = _pickVariant(playlist, playlistUri);
      if (variant == null) {
        throw const HlsDownloadException('No playable variant in playlist.');
      }
      playlistUri = variant;
      playlist = await _fetchText(playlistUri, headers);
    }

    final media = _parseMediaPlaylist(playlist, playlistUri);
    if (media.segments.isEmpty) {
      throw const HlsDownloadException('Playlist contains no segments.');
    }

    final tempDir = Directory(
      p.join(output.parent.path, '.anifox_${DateTime.now().microsecondsSinceEpoch}'),
    );
    await tempDir.create(recursive: true);

    try {
      Uint8List? initBytes;
      if (media.initSegment != null) {
        initBytes = await _downloadResource(
          media.initSegment!,
          media.initKey,
          headers,
          isCanceled,
        );
      }

      final segmentFiles = List<File?>.filled(media.segments.length, null);
      final total = media.segments.length;
      var nextIndex = 0;
      var completed = 0;
      Object? failure;

      Future<void> worker() async {
        while (true) {
          if (failure != null) return;
          if (isCanceled()) throw const HlsCanceledException();
          final index = nextIndex++;
          if (index >= total) return;

          try {
            final segment = media.segments[index];
            final bytes = await _downloadResource(
              segment.uri,
              segment.key,
              headers,
              isCanceled,
            );
            final file = File(p.join(tempDir.path, 'seg_$index.bin'));
            await file.writeAsBytes(bytes, flush: false);
            segmentFiles[index] = file;
            completed += 1;
            onProgress(completed, total);
          } catch (error) {
            failure = error;
            rethrow;
          }
        }
      }

      final workerCount = max(1, min(concurrency, total));
      final futures = List<Future<void>>.generate(workerCount, (_) => worker());
      try {
        await Future.wait(futures);
      } catch (_) {
        if (failure != null) throw failure!;
        rethrow;
      }

      final sink = output.openWrite();
      try {
        if (initBytes != null) sink.add(initBytes);
        for (final file in segmentFiles) {
          if (file == null) continue;
          sink.add(await file.readAsBytes());
        }
      } finally {
        await sink.close();
      }
    } finally {
      if (await tempDir.exists()) {
        await tempDir.delete(recursive: true);
      }
    }
  }

  Future<void> _downloadFile(
    Uri uri,
    File output,
    void Function(int completed, int total) onProgress,
    bool Function() isCanceled,
    Map<String, String> headers,
  ) async {
    final request = http.Request('GET', uri);
    request.headers.addAll(_defaultHeaders);
    request.headers.addAll(headers);

    final response = await _client.send(request);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw HlsDownloadException(
        'Download failed (HTTP ${response.statusCode}).',
      );
    }

    final total = response.contentLength ?? 0;
    var received = 0;
    final sink = output.openWrite();
    try {
      await for (final chunk in response.stream) {
        if (isCanceled()) throw const HlsCanceledException();
        sink.add(chunk);
        received += chunk.length;
        onProgress(received, total);
      }
    } finally {
      await sink.close();
    }
  }

  Future<Uint8List> _downloadResource(
    Uri uri,
    _SegmentKey? key,
    Map<String, String> headers,
    bool Function() isCanceled,
  ) async {
    if (isCanceled()) throw const HlsCanceledException();

    final response = await _client.get(uri, headers: {
      ..._defaultHeaders,
      ...headers,
    });
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw HlsDownloadException(
        'Segment request failed (HTTP ${response.statusCode}).',
      );
    }

    final bytes = response.bodyBytes;
    if (key == null) return bytes;

    final keyBytes = await _fetchKey(key, headers);
    final iv = key.iv ?? _sequenceIv(key.sequence);
    final encrypter = enc.Encrypter(
      enc.AES(enc.Key(keyBytes), mode: enc.AESMode.cbc),
    );
    try {
      final decrypted = encrypter.decryptBytes(
        enc.Encrypted(bytes),
        iv: enc.IV(iv),
      );
      return Uint8List.fromList(decrypted);
    } catch (_) {
      throw const HlsDownloadException(
        'Could not decrypt an encrypted segment.',
      );
    }
  }

  Future<Uint8List> _fetchKey(
    _SegmentKey key,
    Map<String, String> headers,
  ) async {
    final cacheKey = key.uri.toString();
    final cached = _keyCache[cacheKey];
    if (cached != null) return cached;

    final response = await _client.get(key.uri, headers: {
      ..._defaultHeaders,
      ...headers,
    });
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw HlsDownloadException(
        'Key request failed (HTTP ${response.statusCode}).',
      );
    }
    final bytes = response.bodyBytes;
    if (bytes.length != 16) {
      throw const HlsDownloadException('Invalid AES-128 key length.');
    }
    _keyCache[cacheKey] = bytes;
    return bytes;
  }

  Future<String> _fetchText(Uri uri, Map<String, String> headers) async {
    final response = await _client.get(uri, headers: {
      ..._defaultHeaders,
      ...headers,
    });
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw HlsDownloadException(
        'Playlist request failed (HTTP ${response.statusCode}).',
      );
    }
    return utf8.decode(response.bodyBytes, allowMalformed: true);
  }

  Uri? _pickVariant(String playlist, Uri base) {
    final lines = const LineSplitter().convert(playlist);
    Uri? best;
    var bestBandwidth = -1;

    for (var index = 0; index < lines.length; index++) {
      final line = lines[index].trim();
      if (!line.startsWith('#EXT-X-STREAM-INF')) continue;

      final bandwidthMatch = RegExp(r'BANDWIDTH=(\d+)').firstMatch(line);
      final bandwidth = int.tryParse(bandwidthMatch?.group(1) ?? '') ?? 0;

      for (var next = index + 1; next < lines.length; next++) {
        final candidate = lines[next].trim();
        if (candidate.isEmpty || candidate.startsWith('#')) continue;
        if (bandwidth > bestBandwidth) {
          bestBandwidth = bandwidth;
          best = base.resolve(candidate);
        }
        break;
      }
    }

    return best;
  }

  _MediaPlaylist _parseMediaPlaylist(String playlist, Uri base) {
    final lines = const LineSplitter().convert(playlist);
    final segments = <_Segment>[];

    _SegmentKey? currentKey;
    Uri? initSegment;
    _SegmentKey? initKey;
    var sequence = 0;
    var mediaSequence = 0;

    for (final rawLine in lines) {
      final line = rawLine.trim();
      if (line.isEmpty) continue;

      if (line.startsWith('#EXT-X-MEDIA-SEQUENCE:')) {
        mediaSequence =
            int.tryParse(line.substring('#EXT-X-MEDIA-SEQUENCE:'.length)) ?? 0;
        sequence = mediaSequence;
        continue;
      }

      if (line.startsWith('#EXT-X-KEY:')) {
        final method = _attribute(line, 'METHOD');
        if (method == null || method == 'NONE') {
          currentKey = null;
        } else if (method == 'AES-128') {
          final uri = _attribute(line, 'URI');
          if (uri == null) {
            throw const HlsDownloadException('Encrypted playlist without key URI.');
          }
          final ivHex = _attribute(line, 'IV');
          currentKey = _SegmentKey(
            uri: base.resolve(uri),
            iv: ivHex == null ? null : _parseIv(ivHex),
            sequence: sequence,
          );
        } else {
          throw HlsDownloadException('Unsupported HLS encryption ($method).');
        }
        continue;
      }

      if (line.startsWith('#EXT-X-MAP:')) {
        final uri = _attribute(line, 'URI');
        if (uri != null) {
          initSegment = base.resolve(uri);
          initKey = currentKey;
        }
        continue;
      }

      if (line.startsWith('#')) continue;

      segments.add(
        _Segment(
          uri: base.resolve(line),
          key: currentKey == null
              ? null
              : _SegmentKey(
                  uri: currentKey.uri,
                  iv: currentKey.iv,
                  sequence: sequence,
                ),
        ),
      );
      sequence += 1;
    }

    return _MediaPlaylist(
      segments: segments,
      initSegment: initSegment,
      initKey: initKey,
    );
  }

  String? _attribute(String line, String name) {
    final match = RegExp('$name=("[^"]*"|[^,]*)').firstMatch(line);
    if (match == null) return null;
    final value = match.group(1)!.trim();
    if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
      return value.substring(1, value.length - 1);
    }
    return value;
  }

  Uint8List _parseIv(String value) {
    final hex = value.startsWith('0x') || value.startsWith('0X')
        ? value.substring(2)
        : value;
    final padded = hex.padLeft(32, '0');
    if (padded.length != 32) {
      throw const HlsDownloadException('Invalid AES IV.');
    }
    return Uint8List.fromList([
      for (var i = 0; i < 32; i += 2)
        int.parse(padded.substring(i, i + 2), radix: 16),
    ]);
  }

  Uint8List _sequenceIv(int sequence) {
    final iv = Uint8List(16);
    var value = sequence;
    for (var index = 15; index >= 8; index--) {
      iv[index] = value & 0xff;
      value >>= 8;
    }
    return iv;
  }

  static const _defaultHeaders = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
            '(KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  };
}

class _MediaPlaylist {
  final List<_Segment> segments;
  final Uri? initSegment;
  final _SegmentKey? initKey;

  const _MediaPlaylist({
    required this.segments,
    this.initSegment,
    this.initKey,
  });
}

class _Segment {
  final Uri uri;
  final _SegmentKey? key;

  const _Segment({required this.uri, this.key});
}

class _SegmentKey {
  final Uri uri;
  final Uint8List? iv;
  final int sequence;

  const _SegmentKey({required this.uri, this.iv, required this.sequence});
}
