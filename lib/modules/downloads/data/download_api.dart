import 'dart:convert';

import 'package:http/http.dart' as http;

import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/core/utils/env.dart';

class DownloadOption {
  const DownloadOption({
    required this.label,
    required this.url,
    this.quality,
    this.size,
    this.format,
  });

  final String label;
  final String url;
  final String? quality;
  final String? size;
  final String? format;

  String get detail => [format, size].whereType<String>().join(' · ');
}

class DownloadApiException implements Exception {
  const DownloadApiException(this.message);

  final String message;

  @override
  String toString() => message;
}

/// Reads download choices from the operator's licensed provider.
///
/// The provider is configured at build time with
/// `--dart-define=DOWNLOAD_API_URL=...` and optionally `DOWNLOAD_API_KEY`.
class DownloadApi {
  static String get _base => Env.DOWNLOAD_API_URL.trim().replaceAll(
        RegExp(r'/+$'),
        '',
      );

  static bool get isConfigured => _base.isNotEmpty;

  Future<List<DownloadOption>> forMedia(
    UnifiedMedia media, {
    int? season,
    int? episode,
  }) async {
    if (!isConfigured) {
      throw const DownloadApiException(
        'Downloads are not configured in this build.',
      );
    }

    final type = switch (media.type) {
      MediaType.ANIME => 'anime',
      MediaType.MOVIE => 'movie',
      _ => 'tv',
    };

    final query = <String, String>{'type': type};
    final tmdbId = media.externalIds.tmdb;
    final anilistId = media.externalIds.anilist ??
        (media.type == MediaType.ANIME ? media.id : null);
    final malId = media.idMal;

    if (tmdbId != null && tmdbId.isNotEmpty) query['tmdbId'] = tmdbId;
    if (anilistId != null && anilistId.isNotEmpty) {
      query['anilistId'] = anilistId;
    }
    if (malId != null && malId.isNotEmpty) query['malId'] = malId;
    if (season != null && season > 0) query['season'] = '$season';
    if (episode != null && episode > 0) query['episode'] = '$episode';

    final uri = Uri.parse('$_base/downloads').replace(queryParameters: query);
    final headers = <String, String>{'Accept': 'application/json'};
    if (Env.DOWNLOAD_API_KEY.trim().isNotEmpty) {
      headers['Authorization'] = 'Bearer ${Env.DOWNLOAD_API_KEY.trim()}';
    }

    final http.Response response;
    try {
      response = await http
          .get(uri, headers: headers)
          .timeout(const Duration(seconds: 20));
    } catch (_) {
      throw const DownloadApiException(
        'The download provider could not be reached.',
      );
    }

    if (response.statusCode != 200) {
      throw DownloadApiException(
        'The download provider returned ${response.statusCode}.',
      );
    }

    final Object? decoded;
    try {
      decoded = jsonDecode(response.body);
    } catch (_) {
      throw const DownloadApiException(
        'The download provider returned an invalid response.',
      );
    }

    if (decoded is! Map<String, dynamic>) return const [];
    final raw = decoded['downloads'];
    if (raw is! List) return const [];

    return [
      for (final item in raw)
        if (item is Map<String, dynamic> && _isHttpUrl(item['url']))
          DownloadOption(
            label: _text(item['label']) ??
                _text(item['quality']) ??
                'Download',
            quality: _text(item['quality']),
            size: _text(item['size']),
            format: _text(item['format']),
            url: item['url'] as String,
          ),
    ];
  }

  static bool _isHttpUrl(Object? value) =>
      value is String &&
      (value.startsWith('https://') || value.startsWith('http://'));

  static String? _text(Object? value) {
    if (value == null) return null;
    final text = value.toString().trim();
    return text.isEmpty ? null : text;
  }
}
