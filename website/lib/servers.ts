export type ServerId = "vidly" | "vidy" | "embedwave" | "vidbolt";

export interface ServerInfo {
  id: ServerId;
  name: string;
  baseUrl: string;
  tagline: string;
}

const BUNDLED_SERVERS: ServerInfo[] = [
  { id: "vidly", name: "Vidly", baseUrl: "https://vidly.pro", tagline: "Server 1 · anime, TV, movies" },
  { id: "vidbolt", name: "VidBolt", baseUrl: "https://vidbolt.xyz", tagline: "Server 2 · anime, TV, movies" },
  { id: "vidy", name: "Vidy", baseUrl: "https://vidy.st", tagline: "Server 3 · anime and TV" },
  { id: "embedwave", name: "EmbedWave", baseUrl: "https://embedwave.cc", tagline: "Server 4 · TMDB player" },
];

/** Streaming targets are resolved by the same-origin `/api/stream` route. */
export const SERVERS: ServerInfo[] = BUNDLED_SERVERS;

export const DEFAULT_SERVER: ServerId = "vidly";

export interface PlaybackInfo {
  type: "movie" | "tv" | "anime";
  tmdbId?: number | null;
  anilistId?: number | null;
  malId?: number | null;
  episode: number;
  season: number;
}

export function serverById(id: string | null | undefined): ServerInfo {
  return SERVERS.find((server) => server.id === id) ?? SERVERS[0];
}

/**
 * Builds the player URL for one of the bundled hosts.
 *
 * Mirrors `lib/streaming/embed_url.dart` in the Flutter app: anime prefers
 * AniList ids, movies and TV use TMDB ids. `null` means the host cannot play
 * this title with the metadata we have.
 */
export function buildEmbedUrl(info: PlaybackInfo, serverId: ServerId): string | null {
  const { type, tmdbId, anilistId, malId, episode, season } = info;
  if (type === "movie" && !tmdbId) return null;
  if (type === "tv" && !tmdbId) return null;
  if (type === "anime" && (serverId === "embedwave" || (!anilistId && !(malId && ["vidly", "vidbolt"].includes(serverId))))) return null;

  const query = new URLSearchParams({
    source: serverId,
    type,
    episode: String(Math.max(1, episode)),
    season: String(Math.max(1, season)),
  });
  if (tmdbId) query.set("tmdbId", String(tmdbId));
  if (anilistId) query.set("anilistId", String(anilistId));
  if (malId) query.set("malId", String(malId));
  return `/api/stream?${query.toString()}`;
}
