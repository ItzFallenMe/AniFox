/**
 * Embed playback providers.
 *
 * Each entry is just an iframe/WebView URL builder: the provider does the
 * streaming, so the app never touches a media file, hosts nothing and needs no
 * scraping. Order is the order shown in the player — fastest, healthiest
 * providers first.
 *
 * EmbedWave leads the list; the old sarui provider that used to be Server 1 is
 * gone (its deployment no longer resolves).
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

const query = (params: Record<string, string | number | undefined>): string => {
  const parts = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

const isEpisode = (context: StreamContext) =>
  context.isSeries && Boolean(context.season) && context.episode != null;

/** `movie/{id}` for films, `tv/{id}/{season}/{episode}` for episodes. */
export const seriesPath = (
  context: StreamContext,
  moviePath: string,
  tvPath: string,
): string => (isEpisode(context) && context.episode != null ? tvPath : moviePath);

/**
 * Provider whose film and episode URLs share `/{kind}/{id}` with an optional
 * season/episode tail (EmbedWave, VidLink, VidSrc, Videasy, Vidsrc.su).
 */
const pathProvider = (base: string) => (context: StreamContext) => {
  const root = trimSlash(base);
  return seriesPath(
    context,
    `${root}/movie/${context.tmdbId}`,
    `${root}/tv/${context.tmdbId}/${context.season}/${context.episode}`,
  );
};

export const EMBED_SERVERS: EmbedServer[] = [
  {
    id: 'embedwave',
    label: 'EmbedWave',
    note: 'Ad-free friendly · fastest',
    getUrl: context => {
      const base = trimSlash('https://embedwave.cc');
      return seriesPath(
        context,
        `${base}/embed/movie/${context.tmdbId}`,
        `${base}/embed/tv/${context.tmdbId}/${context.season}/${context.episode}`,
      );
    },
  },
  {
    id: 'vidlink',
    label: 'VidLink',
    note: 'Next-episode button',
    getUrl: context => {
      const base = trimSlash('https://vidlink.pro');
      const path = pathProvider(base)(context);
      return context.isSeries ? `${path}${query({ nextbutton: 'true' })}` : path;
    },
  },
  {
    id: 'vidsrc-pm',
    label: 'VidSrc.pm',
    note: 'Vidflix player',
    getUrl: context => {
      const base = trimSlash('https://vidsrc.pm');
      return seriesPath(
        context,
        `${base}/embed/movie/${context.tmdbId}`,
        `${base}/embed/tv/${context.tmdbId}/${context.season}/${context.episode}`,
      );
    },
  },
  {
    id: '2embed-skin',
    label: '2Embed.skin',
    note: 'Film and episode player',
    getUrl: context => {
      const base = trimSlash('https://www.2embed.skin');
      return seriesPath(
        context,
        `${base}/embed/movie/${context.tmdbId}`,
        `${base}/embedtv/${context.tmdbId}&s=${context.season}&e=${context.episode}`,
      );
    },
  },
  {
    id: '2embed',
    label: '2Embed',
    note: 'Fallback catalog',
    getUrl: context => {
      const base = trimSlash('https://www.2embed.cc');
      return seriesPath(
        context,
        `${base}/embed/${context.tmdbId}`,
        `${base}/embedtv/${context.tmdbId}&s=${context.season}&e=${context.episode}`,
      );
    },
  },
  {
    id: 'videasy',
    label: 'Videasy',
    note: 'Multi-quality player',
    getUrl: pathProvider('https://player.videasy.net'),
  },
  {
    id: '111movies',
    label: '111Movies',
    note: 'Fallback catalog',
    getUrl: pathProvider('https://111movies.com'),
  },
  {
    id: 'vidsrc-su',
    label: 'Vidsrc.su',
    note: 'Fallback catalog',
    getUrl: context => {
      const base = trimSlash('https://vidsrc.su');
      return seriesPath(
        context,
        `${base}/embed/movie/${context.tmdbId}`,
        `${base}/embed/tv/${context.tmdbId}/${context.season}/${context.episode}`,
      );
    },
  },
];

/** URL-safe title slug (kept for provider notes and deep links). */
export const formatEmbedTitle = (title: string): string =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const PLAYABLE_SERVERS = EMBED_SERVERS.filter(server => !server.disabled);

export const embedServerById = (id: string | null | undefined): EmbedServer =>
  PLAYABLE_SERVERS.find(server => server.id === id) ?? PLAYABLE_SERVERS[0];

/** YouTube trailer URL for a video key. */
export const trailerUrl = (key: string): string =>
  `https://www.youtube.com/embed/${encodeURIComponent(
    key,
  )}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;
