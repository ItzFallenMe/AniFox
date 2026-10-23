import type { MediaType } from '../services/tmdbPolicy';

/**
 * The browsable catalog set, mirroring sarui-movies' `/popular`, `/now_playing`,
 * `/upcoming`, `/top_rated` and `/trending` routes (movies and series). Declared
 * as data so the Browse hub and the catalog screen never drift apart.
 */
export type CatalogKey =
  | 'popularMovies'
  | 'nowPlaying'
  | 'upcoming'
  | 'topRatedMovies'
  | 'trendingMovies'
  | 'popularTv'
  | 'airingToday'
  | 'onTheAir'
  | 'topRatedTv'
  | 'trendingTv';

export interface CatalogDefinition {
  key: CatalogKey;
  kicker: string;
  title: string;
  description: string;
  mediaType: MediaType;
}

export const MOVIE_CATALOGS: CatalogDefinition[] = [
  {
    key: 'popularMovies',
    kicker: 'What everyone is watching',
    title: 'Popular movies',
    description: 'The films topping TMDB right now.',
    mediaType: 'movie',
  },
  {
    key: 'nowPlaying',
    kicker: 'In theatres',
    title: 'Now playing',
    description: 'Currently showing in cinemas near you.',
    mediaType: 'movie',
  },
  {
    key: 'upcoming',
    kicker: 'Coming soon',
    title: 'Upcoming',
    description: 'Announced releases on the horizon.',
    mediaType: 'movie',
  },
  {
    key: 'topRatedMovies',
    kicker: 'Hall of fame',
    title: 'Top rated movies',
    description: 'The highest-scoring films of all time.',
    mediaType: 'movie',
  },
  {
    key: 'trendingMovies',
    kicker: 'Today',
    title: 'Trending movies',
    description: 'Spiking in searches over the last day.',
    mediaType: 'movie',
  },
];

export const TV_CATALOGS: CatalogDefinition[] = [
  {
    key: 'popularTv',
    kicker: 'What everyone is watching',
    title: 'Popular series',
    description: 'The shows topping TMDB right now.',
    mediaType: 'tv',
  },
  {
    key: 'airingToday',
    kicker: 'On tonight',
    title: 'Airing today',
    description: 'Episodes scheduled for today.',
    mediaType: 'tv',
  },
  {
    key: 'onTheAir',
    kicker: 'This week',
    title: 'On the air',
    description: 'Series with episodes airing within seven days.',
    mediaType: 'tv',
  },
  {
    key: 'topRatedTv',
    kicker: 'Hall of fame',
    title: 'Top rated series',
    description: 'The highest-scoring shows of all time.',
    mediaType: 'tv',
  },
  {
    key: 'trendingTv',
    kicker: 'Today',
    title: 'Trending series',
    description: 'Spiking in searches over the last day.',
    mediaType: 'tv',
  },
];

export const ALL_CATALOGS: CatalogDefinition[] = [...MOVIE_CATALOGS, ...TV_CATALOGS];

export const catalogByKey = (key: CatalogKey): CatalogDefinition =>
  ALL_CATALOGS.find(catalog => catalog.key === key) ?? ALL_CATALOGS[0];
