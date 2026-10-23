import { useCallback, useSyncExternalStore } from 'react';

import { DEFAULT_SETTINGS, type AppSettings } from '../config/settings';
import { readStoredJson, writeStoredJson } from '../services/settingsStorage';

export { DEFAULT_SETTINGS, glassPreset } from '../config/settings';
export type { AppSettings, GlassIntensity } from '../config/settings';

/**
 * App-wide preferences, persisted with AsyncStorage.
 *
 * Kept in a module-level store so the tab bar, player and settings screen all
 * read the same snapshot without a provider wrapper.
 */

const STORAGE_KEY = 'anifox.settings.v1';

let current: AppSettings = DEFAULT_SETTINGS;
let hydrated = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach(listener => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => current;

const save = () => {
  if (saveTimer) clearTimeout(saveTimer);
  // Coalesce rapid changes (steppers, sliders) into one write.
  saveTimer = setTimeout(() => {
    saveTimer = null;
    writeStoredJson(STORAGE_KEY, current);
  }, 250);
};

export const updateSettings = (patch: Partial<AppSettings>): void => {
  current = { ...current, ...patch };
  emit();
  if (hydrated) save();
};

export const resetSettings = (): void => {
  current = DEFAULT_SETTINGS;
  emit();
  if (hydrated) save();
};

/** Read persisted settings once at launch. Safe to call more than once. */
export const hydrateSettings = async (): Promise<void> => {
  if (hydrated) return;
  hydrated = true;
  const stored = await readStoredJson<Partial<AppSettings>>(STORAGE_KEY);
  if (!stored) return;
  current = { ...DEFAULT_SETTINGS, ...stored };
  emit();
};

export const useSettings = () => {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setSettings = useCallback((patch: Partial<AppSettings>) => {
    updateSettings(patch);
  }, []);

  return { settings, setSettings };
};
