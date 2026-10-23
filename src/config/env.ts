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
 * Metadata language, as a TMDB locale. Ported from sarui-movies: when a title
 * has no synopsis in this language, the service re-requests it in
 * `FALLBACK_LANGUAGE` and copies only the missing overviews across.
 *
 * Leaving both at `en-US` keeps requests at one per endpoint; set this to
 * e.g. `id-ID` to localize titles and synopses.
 */
export const CATALOG_LANGUAGE = 'en-US';
export const FALLBACK_LANGUAGE = 'en-US';

/**
 * Discord Rich Presence.
 *
 * Paste the application id from https://discord.com/developers/applications
 * here, enable the Social SDK for that application, and link the native SDK
 * adapter (see `android/app/src/main/java/com/itzfallenme/anifox/discord/`).
 * Presence stays off until all three are in place.
 */
const DISCORD_CLIENT_ID = '';

export const DISCORD_CONFIG = {
  CLIENT_ID: DISCORD_CLIENT_ID.trim(),
} as const;

export const isDiscordConfigured = DISCORD_CONFIG.CLIENT_ID.length > 5;

export const APP_INFO = {
  name: 'AniFox',
  tagline: 'Anime & movies, beautifully unified.',
  creator: 'ItzFallenMe',
  creatorUrl: 'https://github.com/ItzFallenMe',
  version: '2.1.0',
  repository: 'https://github.com/ItzFallenMe/AniFox',
} as const;
