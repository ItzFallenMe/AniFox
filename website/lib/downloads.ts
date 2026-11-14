import type { MediaType } from "@/lib/types";

export interface DownloadQuery {
  type: MediaType;
  tmdbId?: number | null;
  anilistId?: number | null;
  season?: number | null;
  episode?: number | null;
}

/**
 * Builds the same-origin API route that retrieves a provider's download links.
 *
 * The provider URL stays server-side; only validated, same-origin link routes
 * are sent to the browser.
 */
export function downloadUrl({ type, tmdbId, anilistId, season, episode }: DownloadQuery): string | null {
  let providerType: string;
  const params = new URLSearchParams();
  if (type === "movie") {
    if (!tmdbId) return null;
    providerType = "movie";
    params.set("tmdbId", String(tmdbId));
  } else if (type === "tv") {
    if (!tmdbId) return null;
    providerType = "tv";
    params.set("tmdbId", String(tmdbId));
    params.set("season", String(season ?? 1));
    params.set("episode", String(episode ?? 1));
  } else {
    if (!anilistId) return null;
    providerType = "anime";
    params.set("anilistId", String(anilistId));
    params.set("episode", String(episode ?? 1));
  }
  params.set("type", providerType);
  return `/api/download-links?${params.toString()}`;
}
