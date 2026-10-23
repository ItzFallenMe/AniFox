import { getMediaKey, type MediaItem } from '../types';
import { createPersistedStore } from './persistedStore';

/**
 * Saved titles ("My List").
 *
 * The whole `MediaItem` snapshot is stored so the watchlist screen renders
 * offline and without a TMDB round-trip; TMDB ids stay the identity.
 */

export interface SavedTitle {
  item: MediaItem;
  addedAt: number;
}

const MAX_ENTRIES = 200;

const isSavedTitle = (value: unknown): value is SavedTitle => {
  if (!value || typeof value !== 'object') return false;
  const entry = value as SavedTitle;
  return Boolean(entry.item) && typeof entry.item.id === 'number';
};

const store = createPersistedStore<SavedTitle[]>({
  key: 'anifox.watchlist.v1',
  initial: [],
  sanitize: stored =>
    Array.isArray(stored)
      ? stored.filter(isSavedTitle).slice(0, MAX_ENTRIES)
      : null,
});

export const watchlistStore = store;

export const hydrateWatchlist = store.hydrate;

export const isInWatchlist = (item: MediaItem): boolean => {
  const key = getMediaKey(item);
  return store.getSnapshot().some(entry => getMediaKey(entry.item) === key);
};

export const addToWatchlist = (item: MediaItem): void => {
  const key = getMediaKey(item);
  store.update(current =>
    current.some(entry => getMediaKey(entry.item) === key)
      ? current
      : [{ item, addedAt: Date.now() }, ...current].slice(0, MAX_ENTRIES),
  );
};

export const removeFromWatchlist = (item: MediaItem): void => {
  const key = getMediaKey(item);
  store.update(current =>
    current.filter(entry => getMediaKey(entry.item) !== key),
  );
};

export const toggleWatchlist = (item: MediaItem): boolean => {
  if (isInWatchlist(item)) {
    removeFromWatchlist(item);
    return false;
  }
  addToWatchlist(item);
  return true;
};

export const clearWatchlist = (): void => {
  store.update(() => []);
};
