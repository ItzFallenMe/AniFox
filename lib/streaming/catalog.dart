import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/streaming/models/stream_source.dart';
import 'package:anifox/streaming/sources/manga_api_source.dart';

/// The four streaming backends bundled with AniFox.
///
/// Browsing, details and tracking data always come from TMDB, AniList or
/// MyAnimeList. These hosts are only responsible for playback.
const aniFoxStreamSources = <StreamSource>[
  StreamSource(
    id: 'vidly',
    name: 'Vidly',
    kind: StreamSourceKind.builtin,
    mediaType: MediaType.ANIME,
    baseUrl: 'https://vidly.pro',
    tagline: 'Server 1 · anime, TV and movies',
    supportsTmdb: true,
    supportsAniList: true,
    supportsMal: true,
  ),
  StreamSource(
    id: 'vidbolt',
    name: 'VidBolt',
    kind: StreamSourceKind.builtin,
    mediaType: MediaType.ANIME,
    baseUrl: 'https://vidbolt.xyz',
    tagline: 'Server 2 · anime, TV and movies',
    supportsTmdb: true,
    supportsAniList: true,
    supportsMal: true,
  ),
  StreamSource(
    id: 'vidy',
    name: 'Vidy',
    kind: StreamSourceKind.builtin,
    mediaType: MediaType.ANIME,
    baseUrl: 'https://vidy.st',
    tagline: 'Server 3 · anime and TV',
    supportsTmdb: true,
    supportsAniList: true,
  ),
  StreamSource(
    id: 'embedwave',
    name: 'EmbedWave',
    kind: StreamSourceKind.builtin,
    mediaType: MediaType.ANIME,
    baseUrl: 'https://embedwave.cc',
    tagline: 'Server 4 · TMDB powered player',
    supportsTmdb: true,
  ),
];

StreamSource? streamSourceById(String id) {
  for (final source in aniFoxStreamSources) {
    if (source.id == id) return source;
  }
  return null;
}

final availableAnimeSourcesProvider = FutureProvider<List<StreamSource>>(
  (ref) async => aniFoxStreamSources,
  name: 'availableAnimeSourcesProvider',
);

final availableMangaSourcesProvider = FutureProvider<List<StreamSource>>((
  ref,
) async {
  final source = MangaApiSource.configuredSource;
  return source == null ? const [] : [source];
}, name: 'availableMangaSourcesProvider');

typedef MangaCatalogSearch = ({String query, int page});

final mangaCatalogProvider = FutureProvider.family<List<UnifiedMedia>, int>((
  ref,
  page,
) async {
  final sources = await ref.watch(availableMangaSourcesProvider.future);
  if (sources.isEmpty) return const [];
  final source = MangaApiSource.fromSource(sources.first);
  if (source == null) return const [];
  return source.getTrending(page: page);
}, name: 'mangaCatalogProvider');

final mangaSearchProvider =
    FutureProvider.family<List<UnifiedMedia>, MangaCatalogSearch>((
      ref,
      args,
    ) async {
      final sources = await ref.watch(availableMangaSourcesProvider.future);
      if (sources.isEmpty) return const [];
      final source = MangaApiSource.fromSource(sources.first);
      if (source == null) return const [];
      return source.search(args.query, MediaType.MANGA, page: args.page);
    }, name: 'mangaSearchProvider');

final availableNovelSourcesProvider = FutureProvider<List<StreamSource>>(
  (ref) async => const [],
  name: 'availableNovelSourcesProvider',
);

final allAvailableSourcesProvider = FutureProvider<List<StreamSource>>((
  ref,
) async {
  final anime = await ref.watch(availableAnimeSourcesProvider.future);
  final manga = await ref.watch(availableMangaSourcesProvider.future);
  final novel = await ref.watch(availableNovelSourcesProvider.future);
  return [...anime, ...manga, ...novel];
}, name: 'allAvailableSourcesProvider');
