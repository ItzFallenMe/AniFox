/**
 * App-wide preference types, defaults and display presets.
 *
 * Lives outside the store so it can be imported without pulling in
 * AsyncStorage (tests, theme code, other pure helpers).
 */

export type GlassIntensity = 'soft' | 'regular' | 'strong';

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export interface AppSettings {
  /** Liquid-glass treatment for the floating tab bar. */
  liquidGlass: boolean;
  /** How frosted the bar is — drives blur radius and tint opacity. */
  glassIntensity: GlassIntensity;
  /** Render the native blur layer (off keeps just the smoked glass tint). */
  frostedBlur: boolean;
  /** Server the player starts on; `null` uses the first in the list. */
  defaultServerId: string | null;
  /** Playback speed the player opens with. */
  defaultPlaybackRate: number;
  /** Start playback as soon as a stream resolves. */
  autoPlay: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  liquidGlass: true,
  glassIntensity: 'regular',
  frostedBlur: true,
  defaultServerId: null,
  defaultPlaybackRate: 1,
  autoPlay: true,
};

/** Blur radius + tint opacity for a given glass intensity. */
export const glassPreset = (intensity: GlassIntensity) => {
  switch (intensity) {
    case 'soft':
      return { blurAmount: 14, overlayColor: 'rgba(8,8,8,0.42)' };
    case 'strong':
      return { blurAmount: 64, overlayColor: 'rgba(8,8,8,0.24)' };
    default:
      return { blurAmount: 34, overlayColor: 'rgba(8,8,8,0.34)' };
  }
};
