import type { CategoryQuery } from '../services/categories';
import { GENRE_IDS, getGenreName } from '../constants/genres';

/**
 * Home feed definition, ported from Flickv4's `config/homeFeed`.
 *
 * Rows are declared as data (id, title, query, wave) instead of being
 * hard-wired into the screen, so the same spec can drive pagination later and
 * the screen only learns how to render a `standard` or `topTen` row.
 *
 * Wave 1 is splash-blocking (anime + regional Top 10s), wave 2 streams in
 * afterwards so the first paint is never waiting on eighteen requests.
 */

/** TMDB watch-provider ids used by `/discover` `with_watch_providers`. */
export const WATCH_PROVIDERS = {
  netflix: 8,
  disneyPlus: 337,
  primeVideo: 9,
  appleTv: 350,
  max: 1899,
} as const;

export type HomeRowVariant = 'standard' | 'topTen';

export interface HomeRowSpec {
  id: string;
  kicker?: string;
  title: string;
  variant: HomeRowVariant;
  query: CategoryQuery;
  wave: 1 | 2;
}

const REGION_NAMES: Record<string, string> = {
  US: 'the US',
  GB: 'the UK',
  IN: 'India',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  JP: 'Japan',
};

export const regionName = (region: string): string =>
  REGION_NAMES[region.toUpperCase()] ?? region.toUpperCase();

export const buildHomeFeed = (region: string): HomeRowSpec[] => {
  const where = regionName(region);

  return [
    // ── Wave 1 ──────────────────────────────────────────────────────────────
    {
      id: 'airing-anime',
      kicker: 'This season',
      title: 'Airing now',
      variant: 'standard',
      query: { kind: 'airingAnime' },
      wave: 1,
    },
    {
      id: 'top-10-movies-regional',
      title: `Top 10 Movies in ${where}`,
      variant: 'topTen',
      query: { kind: 'popularMovies', region },
      wave: 1,
    },
    {
      id: 'anime-movies',
      kicker: 'Feature films',
      title: 'Anime movies',
      variant: 'standard',
      query: { kind: 'animeMovies' },
      wave: 1,
    },
    {
      id: 'top-10-tv-regional',
      title: `Top 10 TV in ${where}`,
      variant: 'topTen',
      query: { kind: 'popularTv', region },
      wave: 1,
    },

    // ── Wave 2 ──────────────────────────────────────────────────────────────
    {
      id: 'netflix',
      title: 'Popular on Netflix',
      variant: 'standard',
      query: {
        kind: 'providerMixed',
        providerId: WATCH_PROVIDERS.netflix,
        region,
      },
      wave: 2,
    },
    {
      id: 'top-10-movies-worldwide',
      title: 'Top 10 Movies Worldwide',
      variant: 'topTen',
      query: { kind: 'trendingMovies' },
      wave: 2,
    },
    {
      id: 'action',
      kicker: 'Adrenaline',
      title: getGenreName(GENRE_IDS.action),
      variant: 'standard',
      query: { kind: 'genreMovie', genreId: GENRE_IDS.action, region },
      wave: 2,
    },
    {
      id: 'disney-plus',
      title: 'Popular on Disney+',
      variant: 'standard',
      query: {
        kind: 'providerMixed',
        providerId: WATCH_PROVIDERS.disneyPlus,
        region,
      },
      wave: 2,
    },
    {
      id: 'top-10-tv-worldwide',
      title: 'Top 10 TV Worldwide',
      variant: 'topTen',
      query: { kind: 'trendingTv' },
      wave: 2,
    },
    {
      id: 'horror',
      kicker: 'After dark',
      title: getGenreName(GENRE_IDS.horror),
      variant: 'standard',
      query: { kind: 'genreMovie', genreId: GENRE_IDS.horror, region },
      wave: 2,
    },
    {
      id: 'animation',
      kicker: 'Drawn worlds',
      title: getGenreName(GENRE_IDS.animation),
      variant: 'standard',
      query: { kind: 'genreMovie', genreId: GENRE_IDS.animation, region },
      wave: 2,
    },
    {
      id: 'prime-video',
      title: 'Popular on Prime Video',
      variant: 'standard',
      query: {
        kind: 'providerMixed',
        providerId: WATCH_PROVIDERS.primeVideo,
        region,
      },
      wave: 2,
    },
    {
      id: 'comedy',
      kicker: 'Feel good',
      title: getGenreName(GENRE_IDS.comedy),
      variant: 'standard',
      query: { kind: 'genreMovie', genreId: GENRE_IDS.comedy, region },
      wave: 2,
    },
    {
      id: 'drama-tv',
      title: `${getGenreName(GENRE_IDS.drama)} TV`,
      variant: 'standard',
      query: { kind: 'genreTv', genreId: GENRE_IDS.drama, region },
      wave: 2,
    },
    {
      id: 'apple-tv',
      title: 'Popular on Apple TV+',
      variant: 'standard',
      query: {
        kind: 'providerMixed',
        providerId: WATCH_PROVIDERS.appleTv,
        region,
      },
      wave: 2,
    },
    {
      id: 'sci-fi',
      kicker: 'Far futures',
      title: getGenreName(GENRE_IDS.sciFi),
      variant: 'standard',
      query: { kind: 'genreMovie', genreId: GENRE_IDS.sciFi, region },
      wave: 2,
    },
    {
      id: 'crime-tv',
      title: `${getGenreName(GENRE_IDS.crime)} TV`,
      variant: 'standard',
      query: { kind: 'genreTv', genreId: GENRE_IDS.crime, region },
      wave: 2,
    },
    {
      id: 'max',
      title: 'Popular on Max',
      variant: 'standard',
      query: {
        kind: 'providerMixed',
        providerId: WATCH_PROVIDERS.max,
        region,
      },
      wave: 2,
    },
    {
      id: 'romance',
      kicker: 'Slow burn',
      title: getGenreName(GENRE_IDS.romance),
      variant: 'standard',
      query: { kind: 'genreMovie', genreId: GENRE_IDS.romance, region },
      wave: 2,
    },
    {
      id: 'thriller',
      kicker: 'Edge of the seat',
      title: getGenreName(GENRE_IDS.thriller),
      variant: 'standard',
      query: { kind: 'genreMovie', genreId: GENRE_IDS.thriller, region },
      wave: 2,
    },
  ];
};
