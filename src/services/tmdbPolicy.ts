/**
 * Catalog policy, ported from sarui-movies' `lib/tmdb-policy`.
 *
 * Kept free of networking and React so every rule can be unit-tested: what
 * belongs in a catalog, how a title or synopsis is rendered, and which trailer
 * to play when TMDB offers several.
 */

export type MediaType = 'movie' | 'tv';

export interface Trailer {
  type: string;
  site: string;
  key: string;
  official?: boolean;
}

export interface VideosResponse {
  results?: Trailer[];
}

export interface PolicyMedia {
  id: number;
  adult?: boolean;
  media_type?: string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  original_language?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  status?: string;
  vote_average?: number;
}

/** TMDB poster paths are always `/abc.jpg`; anything else is unusable. */
export const isPosterValid = (posterPath?: string | null): boolean =>
  typeof posterPath === 'string' && /^\/[^\s]+$/.test(posterPath);

/** Released already — with a 24h buffer for time-zone skew. */
export const isDateReleased = (date?: string | null): boolean => {
  if (!date || !date.trim()) return false;
  const time = new Date(date).getTime();
  if (Number.isNaN(time)) return false;
  return time <= Date.now() + 86400000;
};

const UNRELEASED_STATUSES = ['in production', 'post production', 'planned', 'pilot'];

/** A movie is only live once TMDB says `Released`; a series once it has aired. */
export const isStatusReleased = (
  type: MediaType,
  status?: string | null,
  releaseDate?: string | null,
): boolean => {
  if (type === 'movie') {
    if (status) return status.toLowerCase() === 'released';
    return releaseDate ? isDateReleased(releaseDate) : true;
  }

  if (status && UNRELEASED_STATUSES.includes(status.toLowerCase())) return false;
  return releaseDate ? isDateReleased(releaseDate) : true;
};

export interface CatalogOptions {
  /**
   * Keep titles that have not aired yet. Only the Upcoming catalog wants
   * this — everywhere else an unreleased entry is a dead card.
   */
  allowUnreleased?: boolean;
}

/**
 * The catalog gate: movies and series with a real poster, a title and a
 * release date that has actually happened.
 */
export const canShowInCatalog = (
  media: PolicyMedia,
  type?: MediaType,
  options: CatalogOptions = {},
): boolean => {
  const mediaType = (media.media_type ?? type) as MediaType | undefined;
  if (mediaType !== 'movie' && mediaType !== 'tv') return false;

  if (!isPosterValid(media.poster_path)) return false;

  const title = (
    media.title ??
    media.name ??
    media.original_title ??
    media.original_name
  )?.trim();
  if (!title) return false;

  if (options.allowUnreleased) return true;

  const date = media.release_date ?? media.first_air_date;
  if (media.status && !isStatusReleased(mediaType, media.status, date)) {
    return false;
  }
  if (date && !isDateReleased(date)) return false;

  return true;
};

/** Cleanest available title: localized first, then TMDB's original. */
export const getMediaTitle = (media: PolicyMedia): string =>
  (media.title ?? media.name)?.trim() ||
  (media.original_title ?? media.original_name)?.trim() ||
  'Untitled';

/** Never render an empty synopsis paragraph. */
export const getOverviewText = (overview?: string | null): string =>
  overview?.trim() || 'Synopsis not yet available.';

/** First official YouTube trailer, else the first YouTube trailer at all. */
export const getTrailerKey = (videos?: VideosResponse): string | null => {
  const trailers =
    videos?.results?.filter(video => video.type === 'Trailer' && video.site === 'YouTube') ??
    [];
  return (trailers.find(video => video.official) ?? trailers[0])?.key ?? null;
};

/** True when a detail payload is missing any synopsis we could fill. */
export const needsOverviewFallback = (data: {
  overview?: string;
  seasons?: { overview?: string }[];
  episodes?: { overview?: string }[];
}): boolean =>
  !data.overview?.trim() ||
  Boolean(data.seasons?.some(season => !season.overview?.trim())) ||
  Boolean(data.episodes?.some(episode => !episode.overview?.trim()));
