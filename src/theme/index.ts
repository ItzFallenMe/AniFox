/**
 * AniFox design tokens.
 *
 * Visual language lifted from the ItzFallenMe dashboard: a pure black canvas,
 * white as the only primary colour, hairline white borders and soft glass
 * surfaces.
 */

export const colors = {
  background: '#000000',
  surface: '#0a0a0a',
  surfaceRaised: '#111111',
  glass: 'rgba(255, 255, 255, 0.03)',
  glassStrong: 'rgba(255, 255, 255, 0.06)',
  border: 'rgba(255, 255, 255, 0.10)',
  borderSubtle: 'rgba(255, 255, 255, 0.05)',
  primary: '#ffffff',
  onPrimary: '#000000',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textFaint: '#475569',
  danger: '#fca5a5',
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

/** The dashboard's black/white glow, used behind white CTAs. */
export const glow = {
  shadowColor: '#ffffff',
  shadowOpacity: 0.18,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 0 },
  elevation: 6,
} as const;
