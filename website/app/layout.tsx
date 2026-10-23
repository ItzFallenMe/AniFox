import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// The same typefaces the Android app ships with, self-hosted so builds never
// depend on Google Fonts being reachable.
const inter = localFont({
  src: [
    { path: './fonts/Inter-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/Inter-Medium.ttf', weight: '500', style: 'normal' },
    { path: './fonts/Inter-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: './fonts/Inter-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = localFont({
  src: [
    { path: './fonts/Outfit-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: './fonts/Outfit-Bold.ttf', weight: '700', style: 'normal' },
    { path: './fonts/Outfit-ExtraBold.ttf', weight: '800', style: 'normal' },
  ],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://anifox.app'),
  title: 'AniFox — Anime & movies, beautifully unified',
  description:
    'AniFox is a free Android client for anime, movies and series. Ad-free player, seven streaming providers, watchlist, resume history, episode alerts and Discord Rich Presence.',
  keywords: [
    'AniFox',
    'anime app',
    'movie app',
    'Android streaming client',
    'TMDB',
    'watchlist',
  ],
  openGraph: {
    title: 'AniFox — Anime & movies, beautifully unified',
    description:
      'One black-glass Android client for anime, films and series. Ad-free playback, seven providers, a library that remembers where you left off.',
    url: '/',
    siteName: 'AniFox',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AniFox — Anime & movies, beautifully unified',
    description:
      'One black-glass Android client for anime, films and series. Ad-free playback, seven providers, and a library that remembers.',
  },
  icons: { icon: '/anifox-logo.png' },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-background font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
