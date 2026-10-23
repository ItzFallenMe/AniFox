import { createPersistedStore } from './persistedStore';

/** Recent search terms, newest first, deduped case-insensitively. */

const MAX_TERMS = 8;

const store = createPersistedStore<string[]>({
  key: 'anifox.searchHistory.v1',
  initial: [],
  sanitize: stored =>
    Array.isArray(stored)
      ? stored
          .filter((term): term is string => typeof term === 'string' && term.trim().length > 0)
          .slice(0, MAX_TERMS)
      : null,
});

export const searchHistoryStore = store;

export const hydrateSearchHistory = store.hydrate;

export const recordSearch = (term: string): void => {
  const value = term.trim();
  if (value.length < 2) return;
  store.update(current => [
    value,
    ...current.filter(existing => existing.toLowerCase() !== value.toLowerCase()),
  ].slice(0, MAX_TERMS));
};

export const clearSearchHistory = (): void => {
  store.update(() => []);
};
