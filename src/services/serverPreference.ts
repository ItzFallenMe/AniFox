import { readStoredJson, writeStoredJson } from './settingsStorage';

/**
 * Remembers which playback server last resolved a stream for a title, so a
 * re-opened movie or episode starts on a server that is known to work for it
 * instead of re-failing through the list.
 *
 * Keyed per movie / per episode: a provider that carries a show may not carry
 * its finale, and vice versa.
 */

const STORAGE_KEY = 'anifox.serverPreference.v1';
const MAX_ENTRIES = 200;

type PreferenceMap = Record<string, string>;

let cached: PreferenceMap = {};
let hydrated = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const mediaKeyFor = (
  tmdbId: number,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number,
): string => `${type}:${tmdbId}:${season ?? 0}:${episode ?? 0}`;

/** Read the stored map once at launch. */
export const hydrateServerPreference = async (): Promise<void> => {
  if (hydrated) return;
  hydrated = true;
  const stored = await readStoredJson<PreferenceMap>(STORAGE_KEY);
  if (stored) cached = { ...stored };
};

export const getPreferredServerId = (key: string): string | null =>
  cached[key] ?? null;

const save = () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    writeStoredJson(STORAGE_KEY, cached);
  }, 400);
};

/** Record the server that just produced a playable stream. */
export const rememberWorkingServer = (key: string, serverId: string): void => {
  cached[key] = serverId;

  // Bound the map so it cannot grow forever — oldest keys go first.
  const keys = Object.keys(cached);
  if (keys.length > MAX_ENTRIES) {
    for (const stale of keys.slice(0, keys.length - MAX_ENTRIES)) {
      delete cached[stale];
    }
  }

  save();
};
