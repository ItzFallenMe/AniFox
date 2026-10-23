/**
 * App-wide preference types, defaults and display presets.
 *
 * Lives outside the store so it can be imported without pulling in
 * AsyncStorage (tests, theme code, other pure helpers).
 */export type GlassIntensity = 'soft' | 'regular' | 'strong';

export interface AppSettings {
  /** Liquid-glass treatment for the floating tab bar. */
  liquidGlass: boolean;
  /** How frosted the bar is — drives blur radius and tint opacity. */
  glassIntensity: GlassIntensity;
  /** Render the native blur layer (off keeps just the smoked glass tint). */
  frostedBlur: boolean;
  /** Embed server the player starts on; `null` uses the first in the list. */
  defaultServerId: string | null;
  /** Start playback as soon as the embed provider is ready. */
  autoPlay: boolean;
  /** Rotate the player to landscape fullscreen when a stream opens. */
  autoRotate: boolean;
  /** Publish "watching …" to Discord while the player is open. */
  discordPresence: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  liquidGlass: true,
  glassIntensity: 'regular',
  frostedBlur: true,
  defaultServerId: null,
  autoPlay: true,
  autoRotate: true,
  discordPresence: false,
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
