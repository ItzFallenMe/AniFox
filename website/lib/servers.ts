export type ServerId = "vidly" | "vidy" | "embedwave" | "vidbolt";

export interface ServerInfo {
  id: ServerId;
  name: string;
  baseUrl: string;
  tagline: string;
}

/** The four streaming backends bundled with AniFox. */
export const SERVERS: ServerInfo[] = [
  { id: "vidly", name: "Vidly", baseUrl: "https://vidly.pro", tagline: "Server 1 · anime, TV, movies" },
  { id: "vidbolt", name: "VidBolt", baseUrl: "https://vidbolt.xyz", tagline: "Server 2 · anime, TV, movies" },
  { id: "vidy", name: "Vidy", baseUrl: "https://vidy.st", tagline: "Server 3 · anime and TV" },
  { id: "embedwave", name: "EmbedWave", baseUrl: "https://embedwave.cc", tagline: "Server 4 · TMDB player" },
];

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
  const server = serverById(serverId);
  const base = server.baseUrl.replace(/\/+$/, "");
  const { type, tmdbId, anilistId, malId, episode, season } = info;
  const isAnime = type === "anime";
  const isMovie = type === "movie";

  switch (serverId) {
    case "vidly":
      if (isAnime) {
        if (anilistId) return `${base}/anime/${anilistId}/${episode}`;
        if (malId) return `${base}/anime/mal/${malId}/${episode}`;
      }
      if (isMovie && tmdbId) return `${base}/movie/${tmdbId}`;
      if (tmdbId) return `${base}/tv/${tmdbId}/${season}/${episode}`;
      return null;

    case "vidy":
      if (isAnime && anilistId) return `${base}/anime/${anilistId}/${episode}`;
      if (isMovie && tmdbId) return `${base}/movie/${tmdbId}`;
      if (tmdbId) return `${base}/tv/${tmdbId}/${season}/${episode}`;
      return null;

    case "embedwave":
      if (!tmdbId) return null;
      if (isMovie) return `${base}/embed/movie/${tmdbId}`;
      return `${base}/embed/tv/${tmdbId}/${season}/${episode}`;

    case "vidbolt":
      if (isAnime) {
        if (anilistId) return `${base}/anime/${anilistId}/${episode}`;
        if (malId) return `${base}/anime/mal/${malId}/${episode}`;
      }
      if (isMovie && tmdbId) return `${base}/movie/${tmdbId}`;
      if (tmdbId) return `${base}/tv/${tmdbId}/${season}/${episode}`;
      return null;
  }
}
