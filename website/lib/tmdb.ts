import type { CastMember, EpisodeInfo, Media, MediaDetails, SeasonInfo } from "./types";

const IMAGE_BASE = "https://image.tmdb.org/t/p";

export class MissingTmdbKeyError extends Error {
  constructor() {
    super("A TMDB API key is required to browse movies and TV shows.");
    this.name = "MissingTmdbKeyError";
  }
}

export function tmdbImage(path: string | null | undefined, size = "w500"): string | null {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

interface TmdbItem {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
}

interface TmdbList {
  results: TmdbItem[];
  page: number;
  total_pages: number;
}

async function tmdb<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<T> {
  const url = new URL(`/api/tmdb${path}`, window.location.origin);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(name, String(value));
  }

  const res = await fetch(url.toString(), { headers: { accept: "application/json" } });
  if (!res.ok) {
    if (res.status === 401 || res.status === 503) throw new MissingTmdbKeyError();
    throw new Error(`TMDB request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

function yearOf(item: TmdbItem): string | null {
  const date = item.release_date || item.first_air_date;
  return date ? date.slice(0, 4) : null;
}

function mapItem(item: TmdbItem, type: "movie" | "tv"): Media {
  return {
    key: `${type}-${item.id}`,
    type,
    id: item.id,
    tmdbId: item.id,
    title: item.title || item.name || item.original_title || item.original_name || "Untitled",
    overview: item.overview,
    poster: tmdbImage(item.poster_path, "w500"),
    backdrop: tmdbImage(item.backdrop_path, "w1280"),
    year: yearOf(item),
    score: item.vote_average ? Number(item.vote_average.toFixed(1)) : null,
  };
}

function timeWindow(): "day" | "week" {
  return "week";
}

export async function getTrending(): Promise<Media[]> {
  const data = await tmdb<TmdbList>(`/trending/all/${timeWindow()}`);
  const items: Media[] = [];
  for (const item of data.results) {
    if (item.media_type === "movie") items.push(mapItem(item, "movie"));
    else if (item.media_type === "tv") items.push(mapItem(item, "tv"));
  }
  return items;
}

export async function getMovieList(
  category: "popular" | "top_rated" | "upcoming" | "now_playing",
): Promise<Media[]> {
  const data = await tmdb<TmdbList>(`/movie/${category}`);
  return data.results.map((item) => mapItem(item, "movie"));
}

export async function getTvList(
  category: "popular" | "top_rated" | "airing_today" | "on_the_air",
): Promise<Media[]> {
  const data = await tmdb<TmdbList>(`/tv/${category}`);
  return data.results.map((item) => mapItem(item, "tv"));
}

export async function searchTmdb(query: string): Promise<Media[]> {
  if (!query.trim()) return [];
  const data = await tmdb<TmdbList>("/search/multi", {
    query,
    include_adult: false,
  });
  const items: Media[] = [];
  for (const item of data.results) {
    if (item.media_type === "movie") items.push(mapItem(item, "movie"));
    else if (item.media_type === "tv") items.push(mapItem(item, "tv"));
  }
  return items;
}

interface TmdbDetails extends TmdbItem {
  runtime?: number;
  episode_run_time?: number[];
  tagline?: string;
  genres?: { id: number; name: string }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: {
    season_number: number;
    name: string;
    episode_count: number;
    poster_path: string | null;
  }[];
  production_companies?: { name: string }[];
  production_countries?: { name: string; iso_3166_1: string }[];
  original_language?: string;
  original_title?: string;
  original_name?: string;
  budget?: number;
  revenue?: number;
  created_by?: { name: string }[];
  release_dates?: {
    results?: Array<{
      iso_3166_1: string;
      release_dates?: Array<{ certification?: string; type?: number }>;
    }>;
  };
  content_ratings?: {
    results?: Array<{ iso_3166_1: string; rating: string }>;
  };
  credits?: {
    cast?: Array<{
      id: number;
      name: string;
      character?: string;
      profile_path?: string | null;
    }>;
    crew?: Array<{ job: string; name: string }>;
  };
  external_ids?: { imdb_id?: string };
}

function castOf(data: TmdbDetails): CastMember[] {
  return (data.credits?.cast ?? []).slice(0, 16).map((person) => ({
    id: person.id,
    name: person.name,
    character: person.character,
    profile: tmdbImage(person.profile_path, "w185"),
  }));
}

function directorOf(data: TmdbDetails): string | null {
  const names = [...new Set(
    (data.credits?.crew ?? [])
      .filter((person) => person.job === "Director")
      .map((person) => person.name.trim())
      .filter(Boolean),
  )];
  return names.length ? names.slice(0, 3).join(", ") : null;
}

function certificationOf(data: TmdbDetails): string | null {
  const usRelease = data.release_dates?.results?.find((release) => release.iso_3166_1 === "US");
  const certification = usRelease?.release_dates?.find((release) => release.certification?.trim())?.certification?.trim();
  return certification || null;
}

function tvCertificationOf(data: TmdbDetails): string | null {
  const usRating = data.content_ratings?.results?.find((rating) => rating.iso_3166_1 === "US")?.rating;
  return usRating?.trim() || null;
}

function productionCountriesOf(data: TmdbDetails): string[] {
  return [...new Set((data.production_countries ?? []).map((country) => country.name).filter(Boolean))];
}

export async function getMovieDetails(id: number): Promise<MediaDetails> {
  const data = await tmdb<TmdbDetails>(`/movie/${id}`, { append_to_response: "credits,external_ids,release_dates" });
  return {
    ...mapItem(data, "movie"),
    key: `movie-${data.id}`,
    runtime: data.runtime ?? null,
    tagline: data.tagline || null,
    genres: data.genres?.map((genre) => genre.name) ?? [],
    studios: data.production_companies?.map((company) => company.name) ?? [],
    cast: castOf(data),
    director: directorOf(data),
    countries: productionCountriesOf(data),
    originalTitle: data.original_title || null,
    language: data.original_language?.toUpperCase() || null,
    certification: certificationOf(data),
    budget: data.budget || null,
    revenue: data.revenue || null,
  };
}

export async function getTvDetails(id: number): Promise<MediaDetails> {
  const data = await tmdb<TmdbDetails>(`/tv/${id}`, { append_to_response: "credits,external_ids,content_ratings" });
  const seasons: SeasonInfo[] = (data.seasons ?? [])
    .filter((season) => season.season_number > 0)
    .map((season) => ({
      number: season.season_number,
      name: season.name,
      episodes: season.episode_count,
      poster: tmdbImage(season.poster_path, "w342"),
    }));
  return {
    ...mapItem(data, "tv"),
    key: `tv-${data.id}`,
    runtime: data.episode_run_time?.[0] ?? null,
    tagline: data.tagline || null,
    genres: data.genres?.map((genre) => genre.name) ?? [],
    studios: data.production_companies?.map((company) => company.name) ?? [],
    cast: castOf(data),
    creators: data.created_by?.map((creator) => creator.name) ?? [],
    countries: productionCountriesOf(data),
    originalTitle: data.original_name || null,
    language: data.original_language?.toUpperCase() || null,
    certification: tvCertificationOf(data),
    seasons: data.number_of_seasons ?? seasons.length,
    episodes: data.number_of_episodes ?? null,
    seasonList: seasons,
  };
}

interface TmdbEpisode {
  episode_number: number;
  name?: string;
  overview?: string;
  still_path?: string | null;
  air_date?: string | null;
  runtime?: number | null;
}

export async function getTvSeason(id: number, seasonNumber: number): Promise<EpisodeInfo[]> {
  const data = await tmdb<{ episodes: TmdbEpisode[] }>(`/tv/${id}/season/${seasonNumber}`);
  return data.episodes.map((episode) => ({
    number: episode.episode_number,
    title: episode.name,
    overview: episode.overview,
    still: tmdbImage(episode.still_path, "w300"),
    airDate: episode.air_date ?? null,
    runtime: episode.runtime ?? null,
  }));
}

/** Best-effort TMDB match for an anime title, used for hosts that require a TMDB id. */
export async function findTmdbMatch(
  title: string,
  year: string | null | undefined,
): Promise<number | null> {
  try {
    const results = await searchTmdb(title);
    if (!results.length) return null;
    if (year) {
      const sameYear = results.find((item) => item.year === year);
      if (sameYear) return sameYear.id;
    }
    return results[0].id;
  } catch {
    return null;
  }
}
