import 'dart:convert';

import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/core/utils/env.dart';
import 'package:http/http.dart' as http;

class DownloadProviderLink {
  final String quality;
  final String source;
  final String details;
  final String size;
  final Uri url;

  const DownloadProviderLink({
    required this.quality,
    required this.source,
    required this.details,
    required this.size,
    required this.url,
  });
}

/// Reads movie and episode download choices from AniFox's same-origin API.
///
/// Provider configuration and tokens remain server-side, matching the
/// website's `/api/download-links` and `/api/download-link` flow.
class DownloadProvider {
  static String get _base =>
      Env.ANIFOX_API_URL.trim().replaceAll(RegExp(r'/+$'), '');

  static bool get isConfigured => _base.isNotEmpty;

  static Uri? linksUriFor(
    UnifiedMedia media, {
    int? season,
    int? episode,
  }) {
    final base = _base;
    if (base.isEmpty) return null;

    String? type;
    String? tmdbId;
    String? anilistId;
    final resolvedSeason = season == null || season < 1 ? 1 : season;
    final resolvedEpisode = episode == null || episode < 1 ? 1 : episode;

    switch (media.type) {
      case MediaType.MOVIE:
        type = 'movie';
        tmdbId = media.externalIds.tmdb;
        break;
      case MediaType.TV:
        type = 'tv';
        tmdbId = media.externalIds.tmdb;
        break;
      case MediaType.ANIME:
        type = 'anime';
        anilistId = media.externalIds.anilist ?? media.id;
        break;
      case MediaType.MANGA:
      case MediaType.NOVEL:
        return null;
    }

    if ((type == 'movie' || type == 'tv') &&
        (tmdbId == null || tmdbId.isEmpty)) {
      return null;
    }
    if (type == 'anime' && (anilistId == null || anilistId.isEmpty)) {
      return null;
    }

    final api = Uri.parse('$base/api/download-links');
    return api.replace(
      queryParameters: {
        'type': type,
        if (tmdbId != null) 'tmdbId': tmdbId,
        if (anilistId != null) 'anilistId': anilistId,
        if (type == 'tv') 'season': '$resolvedSeason',
        if (type != 'movie') 'episode': '$resolvedEpisode',
      },
    );
  }

  static Future<List<DownloadProviderLink>> loadLinks(Uri uri) async {
    final response = await http
        .get(uri, headers: const {'Accept': 'application/json'})
        .timeout(const Duration(seconds: 20));

    Map<String, dynamic> payload = const {};
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) payload = decoded;
    } on FormatException {
      // The API normally responds with JSON; surface a useful fallback below.
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw DownloadLinksException(
        payload['error'] as String? ?? 'Download links could not be loaded.',
      );
    }

    final rawLinks = payload['links'];
    if (rawLinks is! List) return const [];

    final links = <DownloadProviderLink>[];
    for (final item in rawLinks) {
      if (item is! Map<String, dynamic>) continue;
      final href = item['href'] as String?;
      if (href == null || href.isEmpty) continue;

      final target = uri.resolve(href);
      if ((target.scheme != 'https' && target.scheme != 'http') ||
          target.origin != uri.origin) {
        continue;
      }

      links.add(
        DownloadProviderLink(
          quality: item['quality'] as String? ?? 'Download',
          source: item['source'] as String? ?? 'Download source',
          details: item['details'] as String? ?? '',
          size: item['size'] as String? ?? '',
          url: target,
        ),
      );
    }
    return links;
  }
}

class DownloadLinksException implements Exception {
  final String message;

  const DownloadLinksException(this.message);

  @override
  String toString() => message;
}
