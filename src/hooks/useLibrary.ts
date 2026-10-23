import { useCallback, useSyncExternalStore } from 'react';

import { getMediaKey, type MediaItem } from '../types';
import {
  clearWatchlist,
  hydrateWatchlist,
  removeFromWatchlist,
  toggleWatchlist,
  watchlistStore,
} from '../services/watchlist';
import {
  clearWatchHistory,
  hydrateWatchHistory,
  recordWatch,
  removeWatchEntry,
  watchHistoryStore,
} from '../services/watchHistory';
import {
  clearSearchHistory,
  hydrateSearchHistory,
  recordSearch,
  searchHistoryStore,
} from '../services/searchHistory';
import {
  hydrateEpisodeAlerts,
  pruneEpisodeAlerts,
  episodeAlertStore,
  getEpisodeAlert,
} from '../services/episodeAlerts';

/**
 * Read-side hooks for the on-device library.
 *
 * All four stores are hydrated together at launch so screens can rely on real
 * data from their first render instead of flashing an empty state.
 */

const useStore = <T>(store: {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
}) => useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

export const hydrateLibrary = (): Promise<void> =>
  Promise.all([
    hydrateWatchlist(),
    hydrateWatchHistory(),
    hydrateSearchHistory(),
    hydrateEpisodeAlerts(),
  ]).then(() => {
    pruneEpisodeAlerts();
  });

export const useWatchlist = () => {
  const items = useStore(watchlistStore);

  const saved = useCallback(
    (item: MediaItem) =>
      items.some(entry => getMediaKey(entry.item) === getMediaKey(item)),
    [items],
  );

  const toggle = useCallback((item: MediaItem) => toggleWatchlist(item), []);
  const remove = useCallback((item: MediaItem) => removeFromWatchlist(item), []);

  return { items, saved, toggle, remove, clear: clearWatchlist };
};

export const useWatchHistory = () => {
  const entries = useStore(watchHistoryStore);

  const resumeFor = useCallback(
    (item: MediaItem) =>
      entries.find(entry => entry.key === getMediaKey(item)),
    [entries],
  );

  return {
    entries,
    resumeFor,
    record: recordWatch,
    remove: removeWatchEntry,
    clear: clearWatchHistory,
  };
};

export const useSearchHistory = () => {
  const terms = useStore(searchHistoryStore);

  return {
    terms,
    record: recordSearch,
    clear: clearSearchHistory,
  };
};

export const useEpisodeAlerts = () => {
  const alerts = useStore(episodeAlertStore);

  const alertFor = useCallback(
    (tvId: number) => alerts.find(alert => alert.tvId === tvId),
    [alerts],
  );

  return { alerts, alertFor };
};

export { getEpisodeAlert };
