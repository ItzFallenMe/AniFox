export type MediaType = "movie" | "tv" | "anime";

export interface Media {
  /** Stable route key: `${type}-${id}`. */
  key: string;
  type: MediaType;
  /** TMDB id for movie/tv, AniList id for anime. */
  id: number;
  title: string;
  overview?: string | null;
  poster: string | null;
  backdrop: string | null;
  year?: string | null;
  score?: number | null;
  episodes?: number | null;
  seasons?: number | null;
  genres?: string[];
  anilistId?: number | null;
  malId?: number | null;
  tmdbId?: number | null;
  status?: string | null;
  format?: string | null;
}

export interface EpisodeInfo {
  number: number;
  title?: string | null;
  overview?: string | null;
  still?: string | null;
  airDate?: string | null;
  runtime?: number | null;
}

export interface SeasonInfo {
  number: number;
  name: string;
  episodes: number;
  poster: string | null;
}

export interface CastMember {
  id: number;
  name: string;
  character?: string | null;
  profile: string | null;
}

export interface MediaDetails extends Media {
  runtime?: number | null;
  tagline?: string | null;
  studios?: string[];
  cast?: CastMember[];
  director?: string | null;
  creators?: string[];
  countries?: string[];
  originalTitle?: string | null;
  language?: string | null;
  certification?: string | null;
  budget?: number | null;
  revenue?: number | null;
  seasonList?: SeasonInfo[];
  episodeList?: EpisodeInfo[];
}

export interface RailData {
  title: string;
  items: Media[];
  /** Wide 16:9 cards instead of posters. */
  wide?: boolean;
}
