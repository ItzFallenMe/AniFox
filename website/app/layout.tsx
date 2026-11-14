import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppShell } from "@/components/app-shell";
import "./globals.css";
import "./player.css";
import "./shell.css";
import "./reference.css";
import "./anifox-system.css";

const inter = localFont({
  src: [
    { path: "./fonts/Inter-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Inter-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Inter-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Inter-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});

const outfit = localFont({
  src: [
    { path: "./fonts/Outfit-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Outfit-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/Outfit-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.ANIFOX_API_URL ??
      "https://anifox.invalid",
  ),
  title: {
    default: "AniFox — Anime, movies and stories in one place",
    template: "%s · AniFox",
  },
  description:
    "AniFox is a free, open-source app for discovering anime, movies, TV, and manga.",
  applicationName: "AniFox",
  authors: [{ name: "ItzFallenMe", url: "https://github.com/ItzFallenMe" }],
  creator: "ItzFallenMe",
  icons: { icon: "/anifox-logo-mark.png", apple: "/anifox-logo-mark.png" },
  openGraph: {
    title: "AniFox — Anime, movies and stories in one place",
    description: "Discover anime, movies, TV, and manga with AniFox.",
    siteName: "AniFox",
    type: "website",
    images: [{ url: "/anifox-banner.png", width: 1983, height: 793 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AniFox — Anime, movies and stories in one place",
    images: ["/anifox-banner.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#050506",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-background font-sans text-ink antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
