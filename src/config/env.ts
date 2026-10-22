/**
 * AniFox runtime configuration.
 *
 * ── ONE THING TO DO BEFORE RUNNING ───────────────────────────────────────────
 * Put your TMDB API key below. It is free:
 * https://www.themoviedb.org/settings/api
 *
 * The key is read at runtime, so no native rebuild is needed after pasting it
 * in — just restart Metro (`npm start -- --reset-cache`).
 */

const TMDB_API_KEY = 'f730113d6d84ac4f859940ee69f887e5';

export const TMDB_CONFIG = {
  BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
  API_KEY: TMDB_API_KEY.trim(),
} as const;

/** False until a real key has been pasted into `src/config/env.ts`. */
export const isTmdbConfigured =
  TMDB_CONFIG.API_KEY.length > 20 && TMDB_CONFIG.API_KEY !== 'YOUR_TMDB_API_KEY';

/** Region used for "popular in your country" style rows. */
export const CATALOG_REGION = 'US';

/**
 * Subtitle search — the same two catalogues Flickv4 uses.
 *
 * Vidrock's catalogue is keyless and needs no setup. Wyzie Subs
 * (https://docs.wyzie.io/subs/usage/direct) only contributes tracks once you
 * paste a key; leave `API_KEY` empty to search Vidrock alone.
 */
export const VDRK_SUBS_CONFIG = {
  BASE_URL: 'https://sub.vdrk.site/v1',
  TIMEOUT_MS: 10000,
} as const;

export const WYZIE_SUBS_CONFIG = {
  BASE_URL: 'https://sub.wyzie.io',
  API_KEY: '',
  TIMEOUT_MS: 10000,
} as const;

export const APP_INFO = {
  name: 'AniFox',
  tagline: 'Anime & movies, beautifully unified.',
  creator: 'ItzFallenMe',
  creatorUrl: 'https://github.com/ItzFallenMe',
  version: '1.0.0',
} as const;
