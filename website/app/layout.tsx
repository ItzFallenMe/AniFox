import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import "./globals.css";
import "./player.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AniFox — Stream anime, movies and TV",
    template: "%s · AniFox",
  },
  description:
    "AniFox is an open-source streaming front-end for anime, movies and TV shows. Metadata by TMDB, AniList and MyAnimeList.",
  applicationName: "AniFox",
  authors: [{ name: "ItzFallenMe", url: "https://github.com/ItzFallenMe" }],
  creator: "ItzFallenMe",
  icons: { icon: "/logo.png", apple: "/logo.png" },
  openGraph: {
    title: "AniFox",
    description: "Anime, movies and TV in one place.",
    siteName: "AniFox",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050506",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable}`}>
      <body className="bg-ink font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
