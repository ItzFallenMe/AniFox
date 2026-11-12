"use client";

/**
 * Client helpers for the optional download provider.
 *
 * AniFox does not ship a download source. Operators point DOWNLOAD_API_URL at
 * their own (licensed) API, which must implement the contract documented in
 * website/README.md. The API key stays on the server.
 */

export interface DownloadOption {
  label: string;
  quality?: string | null;
  size?: string | null;
  url: string;
  format?: string | null;
}

export interface DownloadQuery {
  type: "movie" | "tv" | "anime";
  tmdbId?: number | null;
  anilistId?: number | null;
  malId?: number | null;
  season?: number | null;
  episode?: number | null;
}

/** Returns an empty list when no download provider is configured. */
export async function getDownloads(query: DownloadQuery): Promise<DownloadOption[]> {
  const url = new URL("/api/download/downloads", window.location.origin);
  if (query.type) url.searchParams.set("type", query.type);
  if (query.tmdbId) url.searchParams.set("tmdbId", String(query.tmdbId));
  if (query.anilistId) url.searchParams.set("anilistId", String(query.anilistId));
  if (query.malId) url.searchParams.set("malId", String(query.malId));
  if (query.season) url.searchParams.set("season", String(query.season));
  if (query.episode) url.searchParams.set("episode", String(query.episode));

  const response = await fetch(url.toString(), { headers: { accept: "application/json" } });
  if (response.status === 503 || response.status === 404) return [];
  if (!response.ok) throw new Error(`Download lookup failed (${response.status})`);

  const payload = (await response.json()) as { downloads?: unknown };
  if (!Array.isArray(payload.downloads)) return [];

  return payload.downloads
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      label: String(item.label ?? item.quality ?? "Download"),
      quality: item.quality ? String(item.quality) : null,
      size: item.size ? String(item.size) : null,
      url: String(item.url ?? ""),
      format: item.format ? String(item.format) : null,
    }))
    .filter((item) => /^https?:\/\//.test(item.url));
}
