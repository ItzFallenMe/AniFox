import { originOf } from '../utils/streamUrl';

/**
 * Playback servers, copied from Flickv4's `servers/list.json`.
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
    id: 'rive',
    name: 'Rive',
    url: 'https://www.rivestream.app',
    movieUrlPattern: '{url}/watch?type=movie&id={tmdbId}',
    tvUrlPattern: '{url}/watch?type=tv&id={tmdbId}&season={season}&episode={episode}',
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
    id: 'vidfast',
    name: 'VidFast',
    url: 'https://vidfast.vc',
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
    id: 'screenscape',
    name: 'ScreenScape',
    url: 'https://screenscape.me',
    movieUrlPattern: '{url}/embed?tmdb={tmdbId}&type=movie&autoplay=true',
    tvUrlPattern: '{url}/embed?tmdb={tmdbId}&type=tv&s={season}&e={episode}&autoplay=true',
    scraperTimeoutSeconds: 45,
  },
  {
    id: 'videasy',
    name: 'Videasy',
    url: 'https://player.videasy.to',
    movieUrlPattern: '{url}/{type}/{tmdbId}',
    tvUrlPattern: '{url}/{type}/{tmdbId}/{season}/{episode}',
    scraperTimeoutSeconds: 30,
  },
];

/** Many hosts 403 unless the request looks like it came from their page. */
export const playbackHeadersFor = (server: PlaybackServer) => ({
  Referer: `${server.url}/`,
  Origin: originOf(server.url),
});
