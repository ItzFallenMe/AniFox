import { getMediaKey, type MediaItem } from '../types';
import { createPersistedStore } from './persistedStore';

/**
 * Resume history — the "Continue watching" rail.
 *
 * One entry per title, moved to the front on every new episode, capped so the
 * store cannot grow without bound. The newest 30 titles are kept.
 */

export interface WatchEntry {
  key: string;
  item: MediaItem;
  season?: number;
  episode?: number;
  episodeName?: string;
  updatedAt: number;
}

const MAX_ENTRIES = 30;

const isWatchEntry = (value: unknown): value is WatchEntry => {
  if (!value || typeof value !== 'object') return false;
  const entry = value as WatchEntry;
  return Boolean(entry.item) && typeof entry.item.id === 'number';
};

const store = createPersistedStore<WatchEntry[]>({
  key: 'anifox.history.v1',
  initial: [],
  sanitize: stored =>
    Array.isArray(stored) ? stored.filter(isWatchEntry).slice(0, MAX_ENTRIES) : null,
});

export const watchHistoryStore = store;

export const hydrateWatchHistory = store.hydrate;

export const recordWatch = (
  item: MediaItem,
  episode?: { season?: number; episode?: number; episodeName?: string },
): void => {
  const key = getMediaKey(item);
  const entry: WatchEntry = {
    key,
    item,
    season: episode?.season,
    episode: episode?.episode,
    episodeName: episode?.episodeName,
    updatedAt: Date.now(),
  };

  store.update(current => [
    entry,
    ...current.filter(existing => existing.key !== key),
  ].slice(0, MAX_ENTRIES));
};

export const findWatchEntry = (item: MediaItem): WatchEntry | undefined =>
  store.getSnapshot().find(entry => entry.key === getMediaKey(item));

export const removeWatchEntry = (key: string): void => {
  store.update(current => current.filter(entry => entry.key !== key));
};

export const clearWatchHistory = (): void => {
  store.update(() => []);
};
