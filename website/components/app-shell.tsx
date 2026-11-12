"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { TopNav } from "./top-nav";
import { Sidebar } from "./sidebar";
import { ArrowUpIcon, GithubIcon } from "./icons";

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-4 z-[45] flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#141419]/90 text-white/80 shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition duration-300 ease-smooth hover:bg-[#1f1f26] hover:text-fox-soft active:scale-95 md:right-8 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <ArrowUpIcon className="h-4 w-4" />
    </button>
  );
}

function Footer() {
  return (
    <footer className="app-footer relative z-10 mt-auto w-full border-t border-white/[0.06] bg-black px-6 py-8 pb-16 text-white/50 md:pb-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-12">
        <p className="max-w-xl text-[11px] leading-[1.7] text-white/40">
          AniFox does not host, upload or store any media. Titles are indexed from
          public metadata providers (TMDB, AniList, MyAnimeList) and playback is
          provided by third-party embed hosts. AniFox only supplies links.
        </p>
        <div className="shrink-0 md:text-right">
          <p className="text-[11px] text-white/40">© {new Date().getFullYear()} AniFox · v1.0.0</p>
          <nav aria-label="Footer" className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1 text-[11px] text-white/40 md:justify-end">
            <Link className="underline decoration-white/15 underline-offset-2 transition-colors hover:text-white/70" href="/home">
              Web app
            </Link>
            <a
              className="inline-flex items-center gap-1 underline decoration-white/15 underline-offset-2 transition-colors hover:text-white/70"
              href="https://github.com/ItzFallenMe"
              target="_blank"
              rel="noreferrer"
            >
              <GithubIcon className="h-3 w-3" /> ItzFallenMe
            </a>
            <a
              className="underline decoration-white/15 underline-offset-2 transition-colors hover:text-white/70"
              href="https://github.com/ItzFallenMe/AniFox"
              target="_blank"
              rel="noreferrer"
            >
              Source
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const routeSegments = pathname.split("/").filter(Boolean);

  // The landing page, watch player and manga reader have their own full-bleed UI.
  if (
    pathname === "/" ||
    pathname.startsWith("/watch/") ||
    pathname.startsWith("/cast") ||
    (routeSegments[0] === "manga" && routeSegments.length === 3)
  ) {
    return <>{children}</>;
  }

  return (
    <div className="app-frame flex min-h-screen flex-col overflow-x-clip bg-black text-white">
      <Sidebar />
      <TopNav />
      <main key={pathname} className="app-main relative z-10 flex-1 animate-fade-in pb-10">
        {children}
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
