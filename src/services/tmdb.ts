import { TMDB_CONFIG } from '../config/env';
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

/** Thin TMDB client on top of native fetch — no extra dependencies. */
class TMDBServiceImpl {
  private readonly baseUrl = TMDB_CONFIG.BASE_URL;
  private readonly apiKey = TMDB_CONFIG.API_KEY;

  private async request<T>(path: string, params: QueryParams = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.set('api_key', this.apiKey);
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

    return (await response.json()) as T;
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

  // ── Popular ──────────────────────────────────────────────────────────────
  getPopularMovies(page = 1, region?: string) {
    return this.request<TMDBResponse<Movie>>('/movie/popular', { page, region });
  }

  getTopRatedTVShows(page = 1) {
    return this.request<TMDBResponse<TVShow>>('/tv/top_rated', { page });
  }

  discoverMoviesByGenre(genreId: number, page = 1, region?: string) {
    return this.request<TMDBResponse<Movie>>('/discover/movie', {
      with_genres: genreId,
      sort_by: 'popularity.desc',
      page,
      region,
      watch_region: region,
    });
  }

  // ── Anime ────────────────────────────────────────────────────────────────
  /** Japanese animated series, the backbone of the Anime tab. */
  discoverAnimeTV(
    page = 1,
    sortBy: 'popularity.desc' | 'vote_average.desc' | 'first_air_date.desc' =
      'popularity.desc',
    extra: QueryParams = {},
  ) {
    return this.request<TMDBResponse<TVShow>>('/discover/tv', {
      with_genres: 16,
      with_original_language: 'ja',
      sort_by: sortBy,
      page,
      ...extra,
    });
  }

  /** Japanese animated feature films. */
  discoverAnimeMovies(
    page = 1,
    sortBy: 'popularity.desc' | 'vote_average.desc' = 'popularity.desc',
  ) {
    return this.request<TMDBResponse<Movie>>('/discover/movie', {
      with_genres: 16,
      with_original_language: 'ja',
      sort_by: sortBy,
      page,
    });
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
  async searchMulti(query: string, page = 1): Promise<TMDBResponse<MediaItem>> {
    const data = await this.request<TMDBResponse<MediaItem>>('/search/multi', {
      query,
      page,
      include_adult: false,
    });
    return {
      ...data,
      results: data.results.filter(
        item => item.media_type === 'movie' || item.media_type === 'tv',
      ),
    };
  }

  // ── Details ──────────────────────────────────────────────────────────────
  getMovieDetails(id: number) {
    return this.request<MovieDetails>(`/movie/${id}`);
  }

  getTVShowDetails(id: number) {
    return this.request<TVShowDetails>(`/tv/${id}`);
  }

  getSeasonDetails(tvId: number, seasonNumber: number) {
    return this.request<SeasonDetails>(`/tv/${tvId}/season/${seasonNumber}`);
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
    const data = await this.request<TMDBResponse<Movie>>(`/movie/${id}/similar`, { page });
    return data.results.map(movie => ({ ...movie, media_type: 'movie' as const }));
  }

  async getSimilarTVShows(id: number, page = 1): Promise<MediaItem[]> {
    const data = await this.request<TMDBResponse<TVShow>>(`/tv/${id}/similar`, { page });
    return data.results.map(show => ({ ...show, media_type: 'tv' as const }));
  }
}

export const TMDBService = new TMDBServiceImpl();

/** Tag a page of raw movies/shows with their media_type for navigation. */
export const tagMovies = (movies: Movie[]): MediaItem[] =>
  movies.map(movie => ({ ...movie, media_type: 'movie' as const }));

export const tagShows = (shows: TVShow[]): MediaItem[] =>
  shows.map(show => ({ ...show, media_type: 'tv' as const }));
