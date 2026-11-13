import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:anifox/core/utils/app_logger.dart';
import 'package:anifox/modules/browse/models/media_args.dart';
import 'package:anifox/modules/browse/state/matched_media_provider.dart';
import 'package:anifox/modules/browse/state/media_preference_provider.dart';
import 'package:anifox/modules/episode_meta/state/episode_metadata_providers.dart';
import 'package:anifox/common/models/unified_episode.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/common/state/content_prefs_provider.dart';
import 'package:anifox/streaming/models/stream_source.dart';
import 'package:anifox/streaming/utils/media_type_utils.dart';
import 'package:anifox/streaming/sources/manga_api_source.dart';

class EpisodesListState {
  final StreamSource source;
  final List<UnifiedEpisode> episodes;

  EpisodesListState({required this.source, required this.episodes});
}

typedef SourceEpisodeArgs = ({
  String providerId,
  String sourceId,
  StreamSourceKind? sourceType,
  MediaType type,
  int? episodeCount,
  int? season,
});

/// Builds the episode list for a bundled stream host.
///
/// The hosts are embed players keyed by metadata ids, so the episode list is
/// derived from the title's own episode count instead of being scraped.
List<UnifiedEpisode> generateEpisodes({
  required String key,
  required MediaType type,
  int? episodeCount,
  int? season,
}) {
  final count = type == MediaType.MOVIE
      ? 1
      : (episodeCount ?? 1).clamp(1, 5000);

  return List<UnifiedEpisode>.generate(count, (index) {
    final number = index + 1;
    return UnifiedEpisode(
      id: '$key:$number',
      number: number.toDouble(),
      season: season,
      title: 'Episode $number',
    );
  }, growable: false);
}

List<UnifiedEpisode> generateEpisodesForMedia(MediaArgs args) {
  return generateEpisodes(
    key: args.providerId ?? args.mediaId ?? args.mediaTitle,
    type: args.type,
    episodeCount: args.episodeCount,
    season: args.season,
  );
}

class EpisodesListNotifier extends AsyncNotifier<EpisodesListState> {
  final MediaArgs arg;

  EpisodesListNotifier(this.arg);

  @override
  Future<EpisodesListState> build() async {
    final log = AppLogger.scope('EpisodesListProvider').child('fetch');

    ref.watch(mediaPreferenceProvider(arg));
    final contentPrefs = ref.watch(contentPrefsProvider);
    final metadataService = ref.watch(episodeMetadataServiceProvider);

    try {
      final matchState = await ref.watch(matchedMediaProvider(arg).future);

      if (arg.type == MediaType.MANGA) {
        final matched = matchState.matchedMedia;
        if (matched == null) {
          throw const MangaApiException(
            'Could not resolve this manga on the selected source.',
          );
        }
        final mangaSource = MangaApiSource.fromSource(matchState.sourceInfo);
        if (mangaSource == null) {
          throw const MangaApiException(
            'Configure ANIFOX_API_URL to load manga chapters.',
          );
        }
        final chapters = await mangaSource.getChapters(matched.id);
        return EpisodesListState(
          source: matchState.sourceInfo,
          episodes: chapters
              .map(UnifiedEpisode.fromChapter)
              .toList(growable: false),
        );
      }

      final rawEpisodes = generateEpisodesForMedia(arg);

      final baseState = EpisodesListState(
        source: matchState.sourceInfo,
        episodes: rawEpisodes,
      );

      if (!arg.type.usesAnimeSources || rawEpisodes.isEmpty) {
        return baseState;
      }

      try {
        final enrichedEpisodes = await metadataService.enrichEpisodes(
          media: arg.toMedia(),
          sourceEpisodes: rawEpisodes,
          mode: contentPrefs.episodeMetadataProvider,
          titlePreference: contentPrefs.titlePreference,
        );

        return EpisodesListState(
          source: matchState.sourceInfo,
          episodes: enrichedEpisodes,
        );
      } catch (enrichErr, enrichSt) {
        log.w('Episode enrichment failed, keeping raw episodes', [
          enrichErr,
          enrichSt,
        ]);
        return baseState;
      }
    } catch (e, st) {
      log.e('Failed to build episodes for "${arg.mediaTitle}"', [e, st]);
      rethrow;
    }
  }

  Future<void> refreshEpisodes() async {
    ref.invalidate(matchedMediaProvider(arg));
    ref.invalidateSelf();
  }
}

final episodesListProvider = AsyncNotifierProvider.family
    .autoDispose<EpisodesListNotifier, EpisodesListState, MediaArgs>(
      EpisodesListNotifier.new,
    );

class SourceEpisodesNotifier extends AsyncNotifier<EpisodesListState> {
  final SourceEpisodeArgs arg;
  SourceEpisodesNotifier(this.arg);

  @override
  Future<EpisodesListState> build() async {
    final log = AppLogger.scope('SourceEpisodesProvider').child('fetch');

    final sources = await ref.watch(arg.type.availableSourcesProvider.future);
    final sourceInfo = sources
        .where(
          (s) =>
              s.id == arg.sourceId &&
              (arg.sourceType == null || s.kind == arg.sourceType),
        )
        .firstOrNull;

    if (sourceInfo == null) {
      throw Exception('Source "${arg.sourceId}" not found');
    }

    if (arg.type == MediaType.MANGA) {
      final mangaSource = MangaApiSource.fromSource(sourceInfo);
      if (mangaSource == null) {
        throw const MangaApiException('Manga reading is not configured.');
      }
      final chapters = await mangaSource.getChapters(arg.providerId);
      return EpisodesListState(
        source: sourceInfo,
        episodes: chapters
            .map(UnifiedEpisode.fromChapter)
            .toList(growable: false),
      );
    }

    final episodes = generateEpisodes(
      key: arg.providerId,
      type: arg.type,
      episodeCount: arg.episodeCount,
      season: arg.season,
    );

    log.s('Prepared ${episodes.length} episodes for ${sourceInfo.name}');

    return EpisodesListState(source: sourceInfo, episodes: episodes);
  }

  void forceRefreshFetch() {
    ref.invalidateSelf();
  }
}

final sourceEpisodesProvider = AsyncNotifierProvider.family
    .autoDispose<SourceEpisodesNotifier, EpisodesListState, SourceEpisodeArgs>(
      SourceEpisodesNotifier.new,
    );
