import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subtitle appearance + auto-selection settings, ported from Flickv4's
 * `useSubtitleSettings`. Kept in a module-level store because both the
 * caption overlay and the player's subtitle sheet read it, and it should
 * survive leaving and re-entering the player during a session. Persisting
 * across app launches needs a storage dependency this project does not ship,
 * so these are session-level defaults.
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

let current: SubtitleSettings = DEFAULT_SUBTITLE_SETTINGS;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => current;

export const updateSubtitleSettings = (
  patch: Partial<SubtitleSettings>,
): void => {
  current = { ...current, ...patch };
  listeners.forEach(listener => listener());
};

export const useSubtitleSettings = () => {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setSettings = useCallback((patch: Partial<SubtitleSettings>) => {
    updateSubtitleSettings(patch);
  }, []);

  return { settings, setSettings };
};
