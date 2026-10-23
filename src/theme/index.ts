/**
 * AniFox design tokens.
 *
 * Visual language ported from sarui-movies: a near-black zinc canvas, rose as
 * the action colour, amber for scores, hairline white borders and soft glass
 * surfaces.
 */

export const colors = {
  background: '#09090b',
  surface: '#111114',
  surfaceRaised: '#18181b',
  glass: 'rgba(255, 255, 255, 0.04)',
  glassStrong: 'rgba(255, 255, 255, 0.07)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.05)',
  /** Rose action colour — CTAs, active chips, focal icons. */
  primary: '#f43f5e',
  primarySoft: 'rgba(244, 63, 94, 0.12)',
  primaryBorder: 'rgba(244, 63, 94, 0.32)',
  onPrimary: '#ffffff',
  /** Amber score colour used by rating pills. */
  accent: '#fbbf24',
  /** Emerald "live / ongoing" accent, used for airing badges. */
  live: '#34d399',
  liveSoft: 'rgba(52, 211, 153, 0.12)',
  liveBorder: 'rgba(52, 211, 153, 0.28)',
  text: '#fafafa',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  textFaint: '#52525b',
  danger: '#f87171',
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

/** The rose glow behind primary CTAs. */
export const glow = {
  shadowColor: '#f43f5e',
  shadowOpacity: 0.35,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 0 },
  elevation: 6,
} as const;
