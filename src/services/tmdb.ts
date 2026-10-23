import { CATALOG_LANGUAGE, FALLBACK_LANGUAGE, TMDB_CONFIG } from '../config/env';
import type {
  CastMember,
  CreditsResponse,
  MediaItem,
  Movie,
  MovieDetails,
  SeasonDetails,
  TMDBResponse,
  TVShow,
  TVShowDetails,
} from '../types';
import {
  canShowInCatalog,
  getMediaTitle,
  getTrailerKey,
  needsOverviewFallback,
  type CatalogOptions,
  type MediaType,
  type PolicyMedia,
  type VideosResponse,
} from './tmdbPolicy';

type QueryParams = Record<string, string | number | boolean | undefined>;

const REQUEST_TIMEOUT_MS = 15000;

export class TMDBError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'TMDBError';
    this.status = status;
  }
}

const REQUEST_TIMEOUT_MESSAGE =
  'TMDB did not respond. Check your connection and try again.';

/** Detail payloads that can be missing some of their synopses. */
interface OverviewData {
  overview?: string;
  seasons?: { id: number; overview?: string }[];
  episodes?: { id: number; overview?: string }[];
}

/**
 * Catalog hygiene, applied to every list before it reaches a screen:
 * a real poster, a real title, and a release that has actually happened.
 * Titles are re-written to the cleanest available name.
 */
const applyCatalogPolicy = <T extends Movie | TVShow>(
  data: TMDBResponse<T>,
  type?: MediaType,
  options?: CatalogOptions,
): TMDBResponse<T> => {
  const results: T[] = [];

  for (const item of data.results) {
    const media = item as unknown as PolicyMedia;
    const mediaType = (media.media_type as MediaType | undefined) ?? type;
    if (!mediaType) continue;
    if (!canShowInCatalog(media, type, options)) continue;

    const title = getMediaTitle(media);
    results.push(
      (mediaType === 'tv' ? { ...item, name: title } : { ...item, title }) as T,
    );
  }

  return { ...data, results };
};

/** Merge synopses from a fallback-language copy, matched by media type + id. */
const mergeListOverviews = <T extends Movie | TVShow>(
  data: TMDBResponse<T>,
  fallback: TMDBResponse<T> | null,
): TMDBResponse<T> => {
  if (!fallback) return data;
  const key = (item: Movie | TVShow) =>
    `${(item as unknown as PolicyMedia).media_type ?? ''}-${item.id}`;
  const byId = new Map(fallback.results.map(item => [key(item), item.overview?.trim()]));

  return {
    ...data,
    results: data.results.map(item => ({
      ...item,
      overview: item.overview?.trim() || byId.get(key(item)) || '',
    })),
  };
};

/** Thin TMDB client on top of native fetch — no extra dependencies. */
class TMDBServiceImpl {
  private readonly baseUrl = TMDB_CONFIG.BASE_URL;
  private readonly apiKey = TMDB_CONFIG.API_KEY;

  private async request<T>(path: string, params: QueryParams = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('language', CATALOG_LANGUAGE);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TMDBError(REQUEST_TIMEOUT_MESSAGE);
      }
      throw new TMDBError('Network request failed. Check your connection.');
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new TMDBError(
          'TMDB rejected the API key. Add a valid key in src/config/env.ts.',
          401,
        );
      }
      throw new TMDBError(`TMDB request failed (${response.status}).`, response.status);
    }

    try {
      return (await response.json()) as T;
    } catch {
      // TMDB occasionally answers 200 with an empty body; never surface a raw
      // JSON parse error to a screen.
      throw new TMDBError('TMDB returned an unreadable response. Try again.', 502);
    }
  }

  /**
   * One page of a catalog: fetch, apply the policy, then (only when the app is
   * running in a non-English locale) fill missing synopses from the fallback.
   */
  private async list<T extends Movie | TVShow>(
    path: string,
    params: QueryParams,
    type?: MediaType,
    options?: CatalogOptions,
  ): Promise<TMDBResponse<T>> {
    const data = applyCatalogPolicy(
      await this.request<TMDBResponse<T>>(path, params),
      type,
      options,
    );

    if (CATALOG_LANGUAGE === FALLBACK_LANGUAGE) return data;
    if (!data.results.some(item => !item.overview?.trim())) return data;

    let fallback: TMDBResponse<T> | null = null;
    try {
      fallback = await this.request<TMDBResponse<T>>(path, {
        ...params,
        language: FALLBACK_LANGUAGE,
      });
    } catch {
      fallback = null;
    }
    return mergeListOverviews(data, fallback);
  }

  /** Copy missing synopses — including seasons and episodes — from the fallback language. */
  private async fillDetailOverviews<T extends OverviewData>(
    path: string,
    data: T,
  ): Promise<T> {
    if (CATALOG_LANGUAGE === FALLBACK_LANGUAGE) return data;
    if (!needsOverviewFallback(data)) return data;

    let fallback: OverviewData | null = null;
    try {
      fallback = await this.request<OverviewData>(path, {
        language: FALLBACK_LANGUAGE,
      });
    } catch {
      fallback = null;
    }
    if (!fallback) return data;

    const fill = <I extends { id: number; overview?: string }>(
      items: I[] | undefined,
      source: { id: number; overview?: string }[] | undefined,
    ): I[] | undefined => {
      if (!items) return undefined;
      const byId = new Map(source?.map(item => [item.id, item.overview?.trim()]));
      return items.map(item => ({
        ...item,
        overview: item.overview?.trim() || byId.get(item.id) || '',
      }));
    };

    return {
      ...data,
      overview: data.overview?.trim() || fallback.overview?.trim() || '',
      ...(data.seasons ? { seasons: fill(data.seasons, fallback.seasons) } : {}),
      ...(data.episodes ? { episodes: fill(data.episodes, fallback.episodes) } : {}),
    };
  }

  private async detail<T extends MovieDetails | TVShowDetails>(
    type: MediaType,
    id: number,
  ): Promise<T> {
    const path = `/${type}/${id}`;
    const data = await this.request<T>(path);
    const title = getMediaTitle(data as unknown as PolicyMedia);
    const clean = {
      ...data,
      ...(type === 'movie' ? { title } : { name: title }),
    } as T;
    return this.fillDetailOverviews(path, clean);
  }

  private async videos(type: MediaType, id: number): Promise<VideosResponse> {
    const path = `/${type}/${id}/videos`;
    try {
      const localized = await this.request<VideosResponse>(path);
      if (getTrailerKey(localized)) return localized;
      if (CATALOG_LANGUAGE === FALLBACK_LANGUAGE) return localized;
      return await this.request<VideosResponse>(path, { language: FALLBACK_LANGUAGE });
    } catch {
      return { results: [] };
    }
  }

  // ── Images ───────────────────────────────────────────────────────────────
  imageUrl(
    path: string | null | undefined,
    size: 'w185' | 'w300' | 'w500' | 'w780' | 'original' = 'w500',
  ): string {
    if (!path) return '';
    return `${TMDB_CONFIG.IMAGE_BASE_URL}/${size}${path}`;
  }

  posterUrl(path: string | null | undefined, size: 'w185' | 'w500' = 'w500') {
    return this.imageUrl(path, size);
  }

  backdropUrl(path: string | null | undefined, size: 'w780' | 'original' = 'w780') {
    return this.imageUrl(path, size);
  }

  profileUrl(path: string | null | undefined) {
    return this.imageUrl(path, 'w185');
  }

  // ── Popular / curated catalogs ───────────────────────────────────────────
  getPopularMovies(page = 1, region?: string) {
    return this.list<Movie>('/movie/popular', { page, region }, 'movie');
  }

  getPopularTVShows(page = 1, region?: string) {
    return this.list<TVShow>('/tv/popular', { page, region }, 'tv');
  }

  getTopRatedMovies(page = 1, region?: string) {
    return this.list<Movie>('/movie/top_rated', { page, region }, 'movie');
  }

  getTopRatedTVShows(page = 1) {
    return this.list<TVShow>('/tv/top_rated', { page }, 'tv');
  }

  getNowPlayingMovies(page = 1, region?: string) {
    return this.list<Movie>('/movie/now_playing', { page, region }, 'movie');
  }

  /** The one catalog that deliberately keeps titles that have not aired yet. */
  getUpcomingMovies(page = 1, region?: string) {
    return this.list<Movie>('/movie/upcoming', { page, region }, 'movie', {
      allowUnreleased: true,
    });
  }

  getAiringTodayTV(page = 1) {
    return this.list<TVShow>('/tv/airing_today', { page }, 'tv');
  }

  getOnTheAirTV(page = 1) {
    return this.list<TVShow>('/tv/on_the_air', { page }, 'tv');
  }

  getTrendingMovies(page = 1, timeWindow: 'day' | 'week' = 'day') {
    return this.list<Movie>(`/trending/movie/${timeWindow}`, { page }, 'movie');
  }

  getTrendingTVShows(page = 1, timeWindow: 'day' | 'week' = 'day') {
    return this.list<TVShow>(`/trending/tv/${timeWindow}`, { page }, 'tv');
  }

  discoverMoviesByGenre(genreId: number, page = 1, region?: string) {
    return this.list<Movie>(
      '/discover/movie',
      {
        with_genres: genreId,
        sort_by: 'popularity.desc',
        page,
        region,
        watch_region: region,
      },
      'movie',
    );
  }

  discoverTVByGenre(genreId: number, page = 1, region?: string) {
    return this.list<TVShow>(
      '/discover/tv',
      {
        with_genres: genreId,
        sort_by: 'popularity.desc',
        page,
        region,
        watch_region: region,
      },
      'tv',
    );
  }

  /** Titles carried by a streaming provider in the catalog region. */
  discoverByWatchProvider(
    type: 'movie' | 'tv',
    providerId: number,
    page = 1,
    region?: string,
  ) {
    return this.list<Movie | TVShow>(
      `/discover/${type}`,
      {
        with_watch_providers: providerId,
        watch_region: region,
        sort_by: 'popularity.desc',
        page,
      },
      type,
    );
  }

  // ── Anime ────────────────────────────────────────────────────────────────
  /** Japanese animated series, the backbone of the Anime tab. */
  discoverAnimeTV(
    page = 1,
    sortBy: 'popularity.desc' | 'vote_average.desc' | 'first_air_date.desc' =
      'popularity.desc',
    extra: QueryParams = {},
  ) {
    return this.list<TVShow>(
      '/discover/tv',
      {
        with_genres: 16,
        with_original_language: 'ja',
        sort_by: sortBy,
        page,
        ...extra,
      },
      'tv',
    );
  }

  /** Japanese animated feature films. */
  discoverAnimeMovies(
    page = 1,
    sortBy: 'popularity.desc' | 'vote_average.desc' = 'popularity.desc',
  ) {
    return this.list<Movie>(
      '/discover/movie',
      {
        with_genres: 16,
        with_original_language: 'ja',
        sort_by: sortBy,
        page,
      },
      'movie',
    );
  }

  /** Anime series that started airing inside the current season. */
  discoverAiringAnime(page = 1) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const seasonStartMonth = Math.floor(month / 3) * 3;
    const start = new Date(Date.UTC(year, seasonStartMonth, 1));
    const end = new Date(Date.UTC(year, seasonStartMonth + 3, 0));
    const iso = (date: Date) => date.toISOString().slice(0, 10);

    return this.discoverAnimeTV(page, 'popularity.desc', {
      'first_air_date.gte': iso(start),
      'first_air_date.lte': iso(end),
    });
  }

  // ── Search ───────────────────────────────────────────────────────────────
  searchMulti(query: string, page = 1) {
    return this.list<MediaItem>('/search/multi', {
      query,
      page,
      include_adult: false,
    });
  }

  // ── Details ──────────────────────────────────────────────────────────────
  getMovieDetails(id: number) {
    return this.detail<MovieDetails>('movie', id);
  }

  getTVShowDetails(id: number) {
    return this.detail<TVShowDetails>('tv', id);
  }

  async getSeasonDetails(tvId: number, seasonNumber: number) {
    const path = `/tv/${tvId}/season/${seasonNumber}`;
    const data = await this.request<SeasonDetails>(path);
    return this.fillDetailOverviews(path, data);
  }

  async getMovieCredits(id: number): Promise<CastMember[]> {
    const data = await this.request<CreditsResponse>(`/movie/${id}/credits`);
    return data.cast;
  }

  async getTVShowCredits(id: number): Promise<CastMember[]> {
    const data = await this.request<CreditsResponse>(`/tv/${id}/credits`);
    return data.cast;
  }

  async getSimilarMovies(id: number, page = 1): Promise<MediaItem[]> {
    const data = await this.list<Movie>(`/movie/${id}/similar`, { page }, 'movie');
    return tagMovies(data.results);
  }

  async getSimilarTVShows(id: number, page = 1): Promise<MediaItem[]> {
    const data = await this.list<TVShow>(`/tv/${id}/similar`, { page }, 'tv');
    return tagShows(data.results);
  }

  // ── Trailers ─────────────────────────────────────────────────────────────
  getMovieVideos(id: number) {
    return this.videos('movie', id);
  }

  getTVShowVideos(id: number) {
    return this.videos('tv', id);
  }

  async getTrailerKey(type: MediaType, id: number): Promise<string | null> {
    return getTrailerKey(await this.videos(type, id));
  }
}

export const TMDBService = new TMDBServiceImpl();

/** Tag a page of raw movies/shows with their media_type for navigation. */
export const tagMovies = (movies: Movie[]): MediaItem[] =>
  movies.map(movie => ({ ...movie, media_type: 'movie' as const }));

export const tagShows = (shows: TVShow[]): MediaItem[] =>
  shows.map(show => ({ ...show, media_type: 'tv' as const }));
