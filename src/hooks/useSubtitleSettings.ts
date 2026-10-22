import { useCallback, useSyncExternalStore } from 'react';

import { readStoredJson, writeStoredJson } from '../services/settingsStorage';

/**
 * Subtitle appearance + auto-selection settings, ported from Flickv4's
 * `useSubtitleSettings` and persisted with AsyncStorage.
 *
 * Kept in a module-level store because both the caption overlay and the
 * settings screen read it, and it should survive leaving and re-entering the
 * player.
 */

export interface SubtitleSettings {
  /** Caption size in dp. */
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  /** 0–1; 0 draws no background plate. */
  backgroundOpacity: number;
  bold: boolean;
  textShadow: boolean;
  /** ISO 639-1 auto-selected when tracks load; empty = no auto-select. */
  defaultLanguage: string;
}

export const DEFAULT_SUBTITLE_SETTINGS: SubtitleSettings = {
  fontSize: 15,
  textColor: '#ffffff',
  backgroundColor: '#000000',
  backgroundOpacity: 0.65,
  bold: false,
  textShadow: true,
  defaultLanguage: 'en',
};

const STORAGE_KEY = 'anifox.subtitleSettings.v1';

let current: SubtitleSettings = DEFAULT_SUBTITLE_SETTINGS;
let hydrated = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => current;

const save = () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    writeStoredJson(STORAGE_KEY, current);
  }, 250);
};

export const updateSubtitleSettings = (
  patch: Partial<SubtitleSettings>,
): void => {
  current = { ...current, ...patch };
  listeners.forEach(listener => listener());
  if (hydrated) save();
};

export const resetSubtitleSettings = (): void => {
  current = DEFAULT_SUBTITLE_SETTINGS;
  listeners.forEach(listener => listener());
  if (hydrated) save();
};

/** Read persisted subtitle settings once at launch. */
export const hydrateSubtitleSettings = async (): Promise<void> => {
  if (hydrated) return;
  hydrated = true;
  const stored = await readStoredJson<Partial<SubtitleSettings>>(STORAGE_KEY);
  if (!stored) return;
  current = { ...DEFAULT_SUBTITLE_SETTINGS, ...stored };
  listeners.forEach(listener => listener());
};

export const useSubtitleSettings = () => {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setSettings = useCallback((patch: Partial<SubtitleSettings>) => {
    updateSubtitleSettings(patch);
  }, []);

  return { settings, setSettings };
};
