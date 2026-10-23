/** TMDB response types shared across the app. */

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  vote_average?: number;
  popularity?: number;
  genre_ids?: number[];
  media_type?: 'movie';
}

export interface TVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date?: string;
  vote_average?: number;
  popularity?: number;
  genre_ids?: number[];
  media_type?: 'tv';
}

export type MediaItem = Movie | TVShow;

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
}

export interface CreditsResponse {
  cast: CastMember[];
}

export interface Episode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  runtime?: number;
  air_date?: string;
}

export interface Season {
  id: number;
  season_number: number;
  name: string;
  episode_count?: number;
  poster_path: string | null;
}

export interface SeasonDetails extends Season {
  episodes: Episode[];
}

export interface MovieDetails extends Movie {
  runtime?: number;
  genres?: Genre[];
  tagline?: string;
  status?: string;
}

export interface NextEpisodeToAir {
  id?: number;
  name?: string;
  overview?: string;
  air_date?: string | null;
  episode_number?: number;
  season_number?: number;
  still_path?: string | null;
}

export interface TVShowDetails extends TVShow {
  genres?: Genre[];
  tagline?: string;
  status?: string;
  next_episode_to_air?: NextEpisodeToAir | null;
  last_episode_to_air?: NextEpisodeToAir | null;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Season[];
  created_by?: { id: number; name: string; profile_path?: string | null }[];
  type?: string;
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

/** Union of the movie/TV detail payloads the Detail screen can render. */
export type MediaDetails = MovieDetails | TVShowDetails;

/** Small helpers so screens never care whether an item is a movie or a show. */
export const isMovie = (item: MediaItem): item is Movie =>
  item.media_type === 'movie' || 'title' in item;

export const getTitle = (item: MediaItem): string =>
  isMovie(item) ? item.title : item.name;

export const getReleaseDate = (item: MediaItem): string =>
  (isMovie(item) ? item.release_date : item.first_air_date) ?? '';

export const getYear = (item: MediaItem): string =>
  getReleaseDate(item).slice(0, 4);

/** Stable storage key for a title, e.g. `movie-550` / `tv-1399`. */
export const getMediaKey = (item: MediaItem): string =>
  `${isMovie(item) ? 'movie' : 'tv'}-${item.id}`;
