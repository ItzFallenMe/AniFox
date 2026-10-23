/**
 * AniFox design tokens.
 *
 * Premium black-glass language: deep black canvas, floating glass surfaces,
 * low-opacity white hairlines, silver type and a single restrained rose accent
 * used sparingly for spotlights, live states and the play affordance.
 */

export const colors = {
  background: '#050506',
  surface: '#101014',
  surfaceRaised: '#19191F',
  glass: 'rgba(255, 255, 255, 0.035)',
  glassStrong: 'rgba(255, 255, 255, 0.06)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.045)',
  /** Silver action colour — primary CTAs, active tabs, focal icons. */
  primary: '#F5F5F7',
  primarySoft: 'rgba(255, 255, 255, 0.06)',
  primaryBorder: 'rgba(255, 255, 255, 0.14)',
  onPrimary: '#0A0A0B',
  /** Restrained rose, reserved for spotlights and live cues. */
  rose: '#F43F5E',
  roseSoft: 'rgba(244, 63, 94, 0.10)',
  roseBorder: 'rgba(244, 63, 94, 0.24)',
  /** Silver score colour used by rating pills. */
  accent: '#D4D4D8',
  /** Emerald "live / ongoing" accent, used for airing badges. */
  live: '#34D399',
  liveSoft: 'rgba(52, 211, 153, 0.10)',
  liveBorder: 'rgba(52, 211, 153, 0.24)',
  text: '#F5F5F7',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textFaint: '#52525B',
  danger: '#F87171',
  black: '#000000',
} as const;

export const fonts = {
  body: 'Inter-Regular',
  bodyMedium: 'Inter-Medium',
  bodySemiBold: 'Inter-SemiBold',
  bodyBold: 'Inter-Bold',
  display: 'Outfit-SemiBold',
  displayBold: 'Outfit-Bold',
  displayBlack: 'Outfit-ExtraBold',
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 30,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Soft white halo behind primary CTAs — restrained, never neon. */
export const glow = {
  shadowColor: '#ffffff',
  shadowOpacity: 0.14,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 0 },
  elevation: 5,
} as const;
