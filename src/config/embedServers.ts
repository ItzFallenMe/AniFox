/**
 * Embed playback servers, ported from sarui-movies' player (`ui/Modal.tsx`).
 *
 * Each server is just an iframe/WebView URL builder: the provider does the
 * streaming, so the app never touches a media file, hosts nothing and needs no
 * scraping. Server 1 is sarui's own ad-free provider and is the default.
 */

export interface StreamContext {
  isSeries: boolean;
  tmdbId: string;
  season?: string;
  episode?: number;
  title: string;
}

export interface EmbedServer {
  id: string;
  label: string;
  /** Providers that stopped working are kept visible but unselectable. */
  disabled?: boolean;
  /** Short note shown in the player and settings. */
  note?: string;
  getUrl: (context: StreamContext) => string;
}

const trimSlash = (value: string) => value.replace(/\/+$/, '');

/** sarui-movies' own provider — no ads, no popunders. */
export const PROVIDER_BASE_URL = 'https://sarui-mov-provider.vercel.app';

const EMBED_BASES = {
  server3: 'https://embedwave.cc',
  server4: 'https://watch.embed-api.stream',
  server5: 'https://vidlink.pro',
  server6: 'https://multiembed.mov',
  server7: 'https://vidsrc.sh/embed',
} as const;

/** `movie/x` for films, `tv/x/s/e` for episodes — sarui's `seriesPath`. */
const seriesPath = (
  context: StreamContext,
  moviePath: string,
  tvPath: string,
): string =>
  context.isSeries && context.season && context.episode != null
    ? tvPath
    : moviePath;

const query = (params: Record<string, string | number | undefined>): string => {
  const parts = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

export const EMBED_SERVERS: EmbedServer[] = [
  {
    id: 'server1',
    label: 'Server 1',
    note: 'Ad-free provider',
    getUrl: context => {
      const base = trimSlash(PROVIDER_BASE_URL);
      const path =
        context.isSeries && context.season && context.episode != null
          ? `/embed/tv/${encodeURIComponent(context.tmdbId)}/${encodeURIComponent(
              context.season,
            )}/${context.episode}`
          : `/embed/movie/${encodeURIComponent(context.tmdbId)}`;
      return `${base}${path}${query({ autoplay: 1, title: context.title })}`;
    },
  },
  {
    id: 'server2',
    label: 'Server 2',
    disabled: true,
    getUrl: context => {
      const base = trimSlash('https://media-streaming-ecru.vercel.app');
      return seriesPath(
        context,
        `${base}/media/tmdb-movie-${context.tmdbId}-${formatEmbedTitle(context.title)}`,
        `${base}/media/tmdb-tv-${context.tmdbId}-${formatEmbedTitle(context.title)}`,
      );
    },
  },
  {
    id: 'server3',
    label: 'Server 3',
    getUrl: context => {
      const base = trimSlash(EMBED_BASES.server3);
      return seriesPath(
        context,
        `${base}/embed/movie/${context.tmdbId}`,
        `${base}/embed/tv/${context.tmdbId}/${context.season}/${context.episode}`,
      );
    },
  },
  {
    id: 'server4',
    label: 'Server 4',
    getUrl: context => {
      const base = trimSlash(EMBED_BASES.server4);
      return seriesPath(
        context,
        `${base}/embed/movie/${context.tmdbId}`,
        `${base}/embed/tv/${context.tmdbId}/${context.season}/${context.episode}`,
      );
    },
  },
  {
    id: 'server5',
    label: 'Server 5',
    note: 'Episode next button',
    getUrl: context => {
      const base = trimSlash(EMBED_BASES.server5);
      const path = seriesPath(
        context,
        `${base}/movie/${context.tmdbId}`,
        `${base}/tv/${context.tmdbId}/${context.season}/${context.episode}`,
      );
      return context.isSeries
        ? `${path}${query({ nextbutton: 'true' })}`
        : path;
    },
  },
  {
    id: 'server6',
    label: 'Server 6',
    getUrl: context => {
      const base = trimSlash(EMBED_BASES.server6);
      return `${base}/${query({
        video_id: context.tmdbId,
        tmdb: 1,
        s: context.isSeries ? context.season : undefined,
        e: context.isSeries ? context.episode : undefined,
      })}`;
    },
  },
  {
    id: 'server7',
    label: 'Server 7',
    getUrl: context => {
      const base = trimSlash(EMBED_BASES.server7);
      return seriesPath(
        context,
        `${base}/movie/${context.tmdbId}`,
        `${base}/tv/${context.tmdbId}/${context.season}/${context.episode}`,
      );
    },
  },
];

/** URL-safe title slug, as sarui uses for its second provider. */
export const formatEmbedTitle = (title: string): string =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const PLAYABLE_SERVERS = EMBED_SERVERS.filter(server => !server.disabled);

export const embedServerById = (id: string | null | undefined): EmbedServer =>
  PLAYABLE_SERVERS.find(server => server.id === id) ?? PLAYABLE_SERVERS[0];

/** YouTube trailer URL for a video key (sarui's trailer mode). */
export const trailerUrl = (key: string): string =>
  `https://www.youtube.com/embed/${encodeURIComponent(
    key,
  )}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;
