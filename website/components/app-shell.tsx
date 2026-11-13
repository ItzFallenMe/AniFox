"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { MobileTabBar } from "./mobile-tab-bar";
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
      className={`fixed bottom-[calc(88px+env(safe-area-inset-bottom))] right-4 z-[45] flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#141419]/90 text-white/80 shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition duration-300 ease-smooth hover:bg-[#1f1f26] hover:text-fox-soft active:scale-95 md:bottom-6 md:right-8 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <ArrowUpIcon className="h-4 w-4" />
    </button>
  );
}

function Footer() {
  return (
    <footer className="app-footer relative z-10 mt-auto w-full px-6 py-7 pb-20 text-white/50 md:pb-8 md:pl-[100px] md:pr-14 lg:pl-[120px]">
      <div className="mb-5 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-12">
        <p className="max-w-xl text-[11px] leading-[1.7] text-white/40">
          AniFox connects public metadata and manga sources to third-party
          playback and download providers. Providers serve their own pages and
          media; AniFox does not host media files.
        </p>
        <div className="shrink-0 md:text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">© {new Date().getFullYear()} AniFox · ItzFallenMe</p>
          <nav aria-label="Footer" className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/45 md:justify-end">
            <Link className="transition-colors hover:text-[#ffad78]" href="/">About</Link>
            <Link className="transition-colors hover:text-[#ffad78]" href="/download">Download</Link>
            <Link className="transition-colors hover:text-[#ffad78]" href="/privacy">Privacy</Link>
            <Link className="transition-colors hover:text-[#ffad78]" href="/terms">Terms</Link>
            <Link className="transition-colors hover:text-[#ffad78]" href="/credits">Credits</Link>
            <a
              className="inline-flex items-center gap-1 transition-colors hover:text-[#ffad78]"
              href="https://github.com/ItzFallenMe"
              target="_blank"
              rel="noreferrer"
            >
              <GithubIcon className="h-3 w-3" /> ItzFallenMe
            </a>
            <a
              className="transition-colors hover:text-[#ffad78]"
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
  const hasOwnMobileNavigation = pathname.startsWith("/title/");

  // Marketing/legal pages, the watch player and manga reader have their own shell.
  if (
    pathname === "/" ||
    pathname === "/download" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/credits" ||
    pathname.startsWith("/watch/") ||
    pathname.startsWith("/cast") ||
    (routeSegments[0] === "manga" && routeSegments.length === 3)
  ) {
    return <>{children}</>;
  }

  return (
    <div className="app-frame flex min-h-screen flex-col overflow-x-clip bg-black text-white">
      <Sidebar />
      {!hasOwnMobileNavigation ? (
        <Link href="/home" aria-label="AniFox home" className="mobile-brand app-mobile-brand">
          <Image src="/anifox-logo-mark.png" alt="" width={48} height={48} className="object-contain" priority />
        </Link>
      ) : null}
      <main key={pathname} className="app-main relative z-10 flex-1 animate-fade-in pb-10">
        {children}
      </main>
      <Footer />
      <MobileTabBar />
      <BackToTop />
    </div>
  );
}
