import type { MediaType } from "@/lib/types";

export interface DownloadQuery {
  type: MediaType;
  tmdbId?: number | null;
  anilistId?: number | null;
  season?: number | null;
  episode?: number | null;
}

function baseUrl() {
  return (process.env.NEXT_PUBLIC_DOWNLOAD_URL ?? "").trim().replace(/\/+$/, "");
}

export function isDownloadConfigured() {
  return baseUrl().length > 0;
}

/**
 * Builds the provider page for a title.
 *
 * The provider is embedded from its own domain and authorises the caller by
 * the referring domain, so no key is involved. Routes follow the provider's
 * public templates: `/movie/{tmdb}`, `/tv/{tmdb}/{season}/{episode}` and
 * `/anime/{anilist}/{episode}`.
 */
export function downloadUrl({ type, tmdbId, anilistId, season, episode }: DownloadQuery): string | null {
  const base = baseUrl();
  if (!base) return null;

  if (type === "movie") {
    return tmdbId ? `${base}/movie/${tmdbId}` : null;
  }

  if (type === "tv") {
    if (!tmdbId) return null;
    return `${base}/tv/${tmdbId}/${season ?? 1}/${episode ?? 1}`;
  }

  return anilistId ? `${base}/anime/${anilistId}/${episode ?? 1}` : null;
}
