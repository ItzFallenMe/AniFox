import { originOf } from '../utils/streamUrl';

/**
 * Playback servers — the 14 requested providers first, then the previously
 * bundled extras plus the two additional providers sarui-movies ships.
 * Flickv4's own `servers/list.json` is the source for the defaults that ship
 * with both apps.
 *
 * Each server is an embed page the WebViewScraper loads; the scraper then
 * reports the underlying stream. Patterns support `{url}`, `{type}`,
 * `{tmdbId}`, `{imdbId}`, `{slug}`, `{season}` and `{episode}` placeholders
 * (see `buildEmbedUrl`).
 */
export interface PlaybackServer {
  id: string;
  name: string;
  url: string;
  movieUrlPattern?: string;
  tvUrlPattern?: string;
  movieTypeLabel?: string;
  tvTypeLabel?: string;
  scraperTimeoutSeconds?: number;
}

export const DEFAULT_SCRAPER_TIMEOUT_SECONDS = 60;

export const PLAYBACK_SERVERS: PlaybackServer[] = [
  {
    id: 'embedwave',
    name: 'EmbedWave',
    url: 'https://embedwave.cc',
    movieUrlPattern: '{url}/embed/movie/{tmdbId}',
    tvUrlPattern: '{url}/embed/tv/{tmdbId}/{season}/{episode}',
    scraperTimeoutSeconds: 45,
  },
  {
    id: 'vidlink',
    name: 'VidLink',
    url: 'https://vidlink.pro',
    movieUrlPattern: '{url}/movie/{tmdbId}?autoplay=true',
    tvUrlPattern: '{url}/tv/{tmdbId}/{season}/{episode}?autoplay=true',
    scraperTimeoutSeconds: 45,
  },
  {
    id: 'vidsrc-pm',
    name: 'VidSrc.pm',
    url: 'https://vidsrc.pm',
    movieUrlPattern: '{url}/embed/movie/{tmdbId}',
    tvUrlPattern: '{url}/embed/tv/{tmdbId}/{season}/{episode}',
    scraperTimeoutSeconds: 45,
  },
  {
    id: '2embed-skin',
    name: '2Embed.skin',
    url: 'https://www.2embed.skin',
    // 2Embed addresses titles with a bare id path segment and `&s=`/`&e=`
    // rather than slash segments, so both types need a custom pattern.
    movieUrlPattern: '{url}/embed/{tmdbId}',
    tvUrlPattern: '{url}/embedtv/{tmdbId}&s={season}&e={episode}',
    scraperTimeoutSeconds: 30,
  },
  {
    id: 'vidfast',
    name: 'VidFast',
    url: 'https://vidfast.vc',
    scraperTimeoutSeconds: 30,
  },
  {
    id: '2embed',
    name: '2Embed',
    url: 'https://www.2embed.cc',
    movieUrlPattern: '{url}/embed/{tmdbId}',
    tvUrlPattern: '{url}/embedtv/{tmdbId}&s={season}&e={episode}',
    scraperTimeoutSeconds: 30,
  },
  {
    id: 'videasy',
    name: 'Videasy',
    url: 'https://player.videasy.to',
    movieUrlPattern: '{url}/{type}/{tmdbId}',
    tvUrlPattern: '{url}/{type}/{tmdbId}/{season}/{episode}',
    scraperTimeoutSeconds: 30,
  },
  {
    id: 'vidsrc-to',
    name: 'VidSrc.to',
    url: 'https://vidsrc.to',
    movieUrlPattern: '{url}/embed/movie/{tmdbId}',
    tvUrlPattern: '{url}/embed/tv/{tmdbId}/{season}/{episode}',
    scraperTimeoutSeconds: 30,
  },
  {
    id: 'vidsrc-cc',
    name: 'VidSrc.cc',
    url: 'https://vidsrc.cc',
    movieUrlPattern: '{url}/v2/embed/movie/{tmdbId}',
    tvUrlPattern: '{url}/v2/embed/tv/{tmdbId}/{season}/{episode}',
    scraperTimeoutSeconds: 30,
  },
  {
    id: 'vidcore',
    name: 'VidCore',
    url: 'https://vidcore.org',
    movieUrlPattern: '{url}/embed/movie/{tmdbId}',
    tvUrlPattern: '{url}/embed/tv/{tmdbId}/{season}/{episode}',
    scraperTimeoutSeconds: 30,
  },
  {
    id: 'vixsrc',
    name: 'VixSrc',
    url: 'https://vixsrc.to',
    movieUrlPattern: '{url}/movie/{tmdbId}',
    tvUrlPattern: '{url}/tv/{tmdbId}/{season}/{episode}',
    scraperTimeoutSeconds: 30,
  },
  {
    id: '111movies',
    name: '111Movies',
    url: 'https://111movies.com',
    movieUrlPattern: '{url}/movie/{tmdbId}',
    tvUrlPattern: '{url}/tv/{tmdbId}/{season}/{episode}',
    scraperTimeoutSeconds: 30,
  },
  {
    id: 'vidsrc-su',
    name: 'VidSrc.su',
    url: 'https://vidsrc.su',
    movieUrlPattern: '{url}/embed/movie?tmdb={tmdbId}',
    tvUrlPattern:
      '{url}/embed/tv?tmdb={tmdbId}&season={season}&episode={episode}',
    scraperTimeoutSeconds: 30,
  },
  {
    id: 'multiembed',
    name: 'MultiEmbed',
    url: 'https://multiembed.mov',
    movieUrlPattern: '{url}/?video_id={tmdbId}&tmdb=1',
    tvUrlPattern: '{url}/?video_id={tmdbId}&tmdb=1&s={season}&e={episode}',
    scraperTimeoutSeconds: 30,
  },

  // ── Previously bundled servers ────────────────────────────────────────────
  {
    id: 'rive',
    name: 'Rive',
    url: 'https://www.rivestream.app',
    movieUrlPattern: '{url}/watch?type=movie&id={tmdbId}',
    tvUrlPattern: '{url}/watch?type=tv&id={tmdbId}&season={season}&episode={episode}',
    scraperTimeoutSeconds: 45,
  },
  {
    id: 'vidsrc',
    name: 'VidSrc',
    url: 'https://vidsrc.sbs',
    movieUrlPattern: '{url}/embed/movie/{tmdbId}?autoplay=true',
    tvUrlPattern: '{url}/embed/tv/{tmdbId}/{season}/{episode}?autoplay=true',
    scraperTimeoutSeconds: 45,
  },
  {
    id: 'cinejoy',
    name: 'CineJoy',
    url: 'https://cinejoy.to',
    movieUrlPattern: '{url}/watch/{type}/{tmdbId}',
    tvUrlPattern: '{url}/watch/{type}/{tmdbId}/{season}/{episode}',
    movieTypeLabel: 'movie',
    tvTypeLabel: 'tv',
    scraperTimeoutSeconds: 30,
  },
  {
    id: 'cinesrc',
    name: 'CineSrc',
    url: 'https://cinesrc.st/embed',
    scraperTimeoutSeconds: 30,
  },
  {
    id: 'cineplay',
    name: 'CinePlay',
    url: 'https://www.cineplay.to',
    movieUrlPattern: '{url}/{type}/{tmdbId}?play=true',
    tvUrlPattern: '{url}/{type}/{tmdbId}/{season}/{episode}?play=true',
    scraperTimeoutSeconds: 30,
  },
  {
    id: 'vidsrc-sh',
    name: 'VidSrc.sh',
    url: 'https://vidsrc.sh/embed',
    movieUrlPattern: '{url}/movie/{tmdbId}',
    tvUrlPattern: '{url}/tv/{tmdbId}/{season}/{episode}',
    scraperTimeoutSeconds: 30,
  },
  {
    id: 'embedapi',
    name: 'EmbedAPI',
    url: 'https://watch.embed-api.stream/embed',
    movieUrlPattern: '{url}/movie/{tmdbId}',
    tvUrlPattern: '{url}/tv/{tmdbId}/{season}/{episode}',
    scraperTimeoutSeconds: 30,
  },
  {
    id: 'screenscape',
    name: 'ScreenScape',
    url: 'https://screenscape.me',
    movieUrlPattern: '{url}/embed?tmdb={tmdbId}&type=movie&autoplay=true',
    tvUrlPattern: '{url}/embed?tmdb={tmdbId}&type=tv&s={season}&e={episode}&autoplay=true',
    scraperTimeoutSeconds: 45,
  },
];

/**
 * Many hosts 403 unless the request looks like it came from their page.
 *
 * When the scraper tells us which document actually produced the stream
 * (`pageUrl` — the embed page, or the nested player frame it was promoted
 * to), that document is the correct `Referer`/`Origin`; the server's
 * homepage is only a fallback. `cookies` come from the same page and are
 * only forwarded when the stream lives on the page's own registrable
 * domain.
 */
export const playbackHeadersFor = (
  server: PlaybackServer,
  pageUrl?: string | null,
  cookies?: string | null,
): Record<string, string> => {
  const referer =
    pageUrl && /^https?:\/\//i.test(pageUrl) ? pageUrl : `${server.url}/`;
  const headers: Record<string, string> = {
    Referer: referer,
    Origin: originOf(referer),
  };
  if (cookies) headers.Cookie = cookies;
  return headers;
};
