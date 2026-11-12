import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/modules/browse/models/media_args.dart';
import 'package:anifox/modules/browse/state/media_preference_provider.dart';
import 'package:anifox/streaming/models/stream_source.dart';
import 'package:anifox/streaming/sources/manga_api_source.dart';

class MatchedMedia {
  final String id;
  final String title;

  const MatchedMedia({required this.id, required this.title});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MatchedMedia &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          title == other.title;

  @override
  int get hashCode => Object.hash(id, title);
}

class MatchedMediaState {
  final StreamSource sourceInfo;
  final MatchedMedia? matchedMedia;
  final bool isLoading;
  final String? error;

  const MatchedMediaState({
    required this.sourceInfo,
    this.matchedMedia,
    this.isLoading = false,
    this.error,
  });

  MatchedMediaState copyWith({
    StreamSource? sourceInfo,
    MatchedMedia? matchedMedia,
    bool? isLoading,
    String? error,
  }) {
    return MatchedMediaState(
      sourceInfo: sourceInfo ?? this.sourceInfo,
      matchedMedia: matchedMedia ?? this.matchedMedia,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MatchedMediaState &&
          runtimeType == other.runtimeType &&
          sourceInfo == other.sourceInfo &&
          matchedMedia == other.matchedMedia &&
          isLoading == other.isLoading &&
          error == other.error;

  @override
  int get hashCode => Object.hash(sourceInfo, matchedMedia, isLoading, error);
}

final matchedMediaProvider =
    AsyncNotifierProvider.family<
      MediaMatchNotifier,
      MatchedMediaState,
      MediaArgs
    >(MediaMatchNotifier.new, retry: (_, _) => null);

/// Resolves which bundled stream host plays this title.
///
/// The bundled hosts are metadata driven: they receive the TMDB/AniList/MAL
/// identifier of the title itself, so there is no separate "matching" step.
class MediaMatchNotifier extends AsyncNotifier<MatchedMediaState> {
  final MediaArgs args;

  MediaMatchNotifier(this.args);

  @override
  Future<MatchedMediaState> build() async {
    final prefs = await ref.watch(mediaPreferenceProvider(args).future);
    final mediaId = args.providerId ?? args.mediaId ?? args.mediaTitle;

    if (args.type == MediaType.MANGA) {
      final source = MangaApiSource.fromSource(prefs.sourceInfo);
      if (source == null) {
        throw const MangaApiException(
          'Configure MANGA_API_URL to enable the manga catalog and reader.',
        );
      }

      final savedId = prefs.matchedMediaId;
      if (savedId != null && savedId.isNotEmpty) {
        return MatchedMediaState(
          sourceInfo: prefs.sourceInfo,
          matchedMedia: MatchedMedia(
            id: savedId,
            title: prefs.matchedMediaTitle ?? args.mediaTitle,
          ),
        );
      }

      final queries = <String>{
        args.mediaTitle,
        if (args.mediaTitleRomaji?.trim().isNotEmpty == true)
          args.mediaTitleRomaji!.trim(),
        if (args.mediaTitleNative?.trim().isNotEmpty == true)
          args.mediaTitleNative!.trim(),
      };
      var results = <UnifiedMedia>[];
      for (final query in queries) {
        final matches = await source.search(query, args.type);
        if (matches.isNotEmpty) {
          results = matches;
          break;
        }
      }

      if (results.isEmpty) {
        throw MangaApiException(
          'No manga source match found for "${args.mediaTitle}".',
        );
      }

      final normalizedTitle = _normalize(args.mediaTitle);
      final best = results.firstWhere(
        (item) => _normalize(item.title.getPreferedTitle) == normalizedTitle,
        orElse: () => results.first,
      );
      final bestTitle = best.title.getPreferedTitle;

      await ref
          .read(mediaPreferenceProvider(args).notifier)
          .saveAutoMatch(best.id, bestTitle);

      return MatchedMediaState(
        sourceInfo: prefs.sourceInfo,
        matchedMedia: MatchedMedia(id: best.id, title: bestTitle),
      );
    }

    return MatchedMediaState(
      sourceInfo: prefs.sourceInfo,
      matchedMedia: MatchedMedia(id: mediaId, title: args.mediaTitle),
    );
  }

  String _normalize(String value) =>
      value.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '');
}
