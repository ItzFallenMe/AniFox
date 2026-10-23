import { readStoredJson, writeStoredJson } from './settingsStorage';

/**
 * Minimal persisted, subscribable store.
 *
 * Library features (watchlist, resume history, search history, episode alerts)
 * all need the same pattern: a module-level snapshot for `useSyncExternalStore`,
 * debounced AsyncStorage writes and a tolerant hydrate that never throws on a
 * hand-edited or older payload.
 */
export interface PersistedStore<T> {
  getSnapshot: () => T;
  subscribe: (listener: () => void) => () => void;
  update: (next: T | ((current: T) => T)) => void;
  hydrate: () => Promise<void>;
}

interface StoreOptions<T> {
  key: string;
  initial: T;
  /** Validate a decoded payload; return `null` to keep the defaults. */
  sanitize?: (stored: unknown) => T | null;
}

export const createPersistedStore = <T>({
  key,
  initial,
  sanitize,
}: StoreOptions<T>): PersistedStore<T> => {
  let current = initial;
  let hydrated = false;
  let hydration: Promise<void> | null = null;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach(listener => listener());

  const save = () => {
    if (saveTimer) clearTimeout(saveTimer);
    // Coalesce bursts (e.g. recording an episode then leaving the player).
    saveTimer = setTimeout(() => {
      saveTimer = null;
      writeStoredJson(key, current);
    }, 250);
  };

  return {
    getSnapshot: () => current,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update(next) {
      const value =
        typeof next === 'function' ? (next as (value: T) => T)(current) : next;
      if (Object.is(value, current)) return;
      current = value;
      emit();
      if (hydrated) save();
    },
    hydrate() {
      if (hydrated) return Promise.resolve();
      if (hydration) return hydration;
      hydrated = true;
      hydration = readStoredJson<unknown>(key).then(stored => {
        const value = sanitize ? sanitize(stored) : (stored as T | null);
        if (value == null) return;
        current = value;
        emit();
      });
      return hydration;
    },
  };
};
