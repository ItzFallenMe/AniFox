import { TMDBService, tagMovies, tagShows } from './tmdb';
import type { MediaItem, Movie, TVShow } from '../types';

/**
 * A serializable description of one home-screen row, ported from Flickv4's
 * `services/categories`. Regional kinds bake in `region` so a later catalog
 * region change does not rewrite rows that already loaded.
 */
export type CategoryQuery =
  | { kind: 'trendingMovies' }
  | { kind: 'trendingTv' }
  | { kind: 'popularMovies'; region: string }
  | { kind: 'popularTv'; region: string }
  | { kind: 'genreMovie'; genreId: number; region: string }
  | { kind: 'genreTv'; genreId: number; region: string }
  | { kind: 'providerMovie'; providerId: number; region: string }
  | { kind: 'providerTv'; providerId: number; region: string }
  | { kind: 'providerMixed'; providerId: number; region: string }
  | { kind: 'airingAnime' }
  | { kind: 'animeMovies' };

const keyOf = (item: MediaItem) => `${item.media_type ?? ''}-${item.id}`;

/** Merge movie + TV pages, highest TMDB popularity first, no duplicates. */
export const interleaveByPopularity = (
  movies: MediaItem[],
  shows: MediaItem[],
): MediaItem[] => {
  const seen = new Set<string>();
  return [...movies, ...shows]
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .filter(item => {
      const key = keyOf(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

/** Fetch one page of a category, tagged with its `media_type`. */
export const fetchCategoryPage = async (
  query: CategoryQuery,
  page = 1,
): Promise<MediaItem[]> => {
  switch (query.kind) {
    case 'trendingMovies': {
      const response = await TMDBService.getTrendingMovies(page);
      return tagMovies(response.results);
    }
    case 'trendingTv': {
      const response = await TMDBService.getTrendingTVShows(page);
      return tagShows(response.results);
    }
    case 'popularMovies': {
      const response = await TMDBService.getPopularMovies(page, query.region);
      return tagMovies(response.results);
    }
    case 'popularTv': {
      const response = await TMDBService.getPopularTVShows(page, query.region);
      return tagShows(response.results);
    }
    case 'genreMovie': {
      const response = await TMDBService.discoverMoviesByGenre(
        query.genreId,
        page,
        query.region,
      );
      return tagMovies(response.results);
    }
    case 'genreTv': {
      const response = await TMDBService.discoverTVByGenre(
        query.genreId,
        page,
        query.region,
      );
      return tagShows(response.results);
    }
    case 'providerMovie': {
      const response = await TMDBService.discoverByWatchProvider(
        'movie',
        query.providerId,
        page,
        query.region,
      );
      return tagMovies(response.results as Movie[]);
    }
    case 'providerTv': {
      const response = await TMDBService.discoverByWatchProvider(
        'tv',
        query.providerId,
        page,
        query.region,
      );
      return tagShows(response.results as TVShow[]);
    }
    case 'providerMixed': {
      const [movies, shows] = await Promise.all([
        TMDBService.discoverByWatchProvider(
          'movie',
          query.providerId,
          page,
          query.region,
        ),
        TMDBService.discoverByWatchProvider(
          'tv',
          query.providerId,
          page,
          query.region,
        ),
      ]);
      return interleaveByPopularity(
        tagMovies(movies.results as Movie[]),
        tagShows(shows.results as TVShow[]),
      );
    }
    case 'airingAnime': {
      const response = await TMDBService.discoverAiringAnime(page);
      return tagShows(response.results);
    }
    case 'animeMovies': {
      const response = await TMDBService.discoverAnimeMovies(page);
      return tagMovies(response.results);
    }
    default:
      return [];
  }
};
