"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AnimeIcon,
  HomeIcon,
  MangaIcon,
  MovieIcon,
  SearchIcon,
  TvIcon,
} from "./icons";

const items = [
  { href: "/home", label: "Home", Icon: HomeIcon },
  { href: "/explore", label: "Search", Icon: SearchIcon },
  { href: "/tv", label: "TV", Icon: TvIcon },
  { href: "/anime", label: "Anime", Icon: AnimeIcon },
  { href: "/movies", label: "Movies", Icon: MovieIcon },
  { href: "/manga", label: "Manga", Icon: MangaIcon },
];

function isActive(pathname: string, href: string) {
  return href === "/home" ? pathname === "/home" : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="group/sidebar fixed bottom-0 left-0 top-0 z-50 hidden w-[80px] flex-col justify-center transition-[width] duration-300 ease-smooth hover:w-[240px] has-[:focus-visible]:w-[240px] md:flex">
      <div className="sidebar-fade pointer-events-none absolute bottom-0 left-0 top-0 z-[-2] w-[200px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-[-1] w-[350px] bg-gradient-to-r from-black/95 via-black/70 to-transparent opacity-0 transition-opacity duration-500 group-hover/sidebar:opacity-100 group-has-[:focus-visible]/sidebar:opacity-100 lg:w-[450px]" />

      <div className="absolute left-0 top-8 z-[60] flex w-[80px] justify-center">
        <Link
          href="/home"
          aria-label="AniFox web app home"
          className="logo-ring flex items-center justify-center transition-transform duration-300 hover:scale-110"
        >
          <Image
            src="/logo.png"
            alt="AniFox"
            width={58}
            height={58}
            priority
            className="h-[58px] w-[58px] rounded-full object-contain drop-shadow-[0_0_18px_rgba(255,122,26,0.35)]"
          />
        </Link>
      </div>

      <nav aria-label="Main" className="stagger z-10 flex w-full flex-col gap-0.5 py-10">
        {items.map(({ href, label, Icon }, index) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              style={{ ["--i" as string]: index }}
              className="group relative mx-3 flex items-center rounded-xl px-5 py-3.5 outline-none transition-colors duration-200 focus-visible:ring-1 focus-visible:ring-white/25"
            >
              <span
                aria-hidden
                className={`absolute -left-3 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-white transition-all duration-300 ${
                  active ? "scale-y-100 bg-fox opacity-100" : "scale-y-50 bg-white opacity-0"
                }`}
              />
              <span
                className={`flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                  active
                    ? "scale-125 text-fox"
                    : "text-[#8f98a2] group-hover:scale-110 group-hover:text-white group-focus-visible:scale-110 group-focus-visible:text-white"
                }`}
              >
                <Icon className="h-6 w-6 md:h-7 md:w-7" />
              </span>
              <span
                className={`ml-6 whitespace-nowrap text-[15px] tracking-[-0.01em] opacity-0 transition-[opacity,translate,color] duration-200 -translate-x-3 group-hover/sidebar:pointer-events-auto group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 ${
                  active ? "font-semibold text-fox-soft" : "font-medium text-[#8f98a2] group-hover:text-white"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const tabs = items;
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let previous = window.scrollY;
    let frame = 0;

    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const current = window.scrollY;
        setHidden(current > previous && current > 50);
        previous = current;
        frame = 0;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <nav
      aria-label="Mobile"
      className={`fixed bottom-4 left-1/2 z-50 max-w-[calc(100vw-24px)] -translate-x-1/2 transition-[opacity,transform] duration-300 md:hidden ${
        hidden ? "pointer-events-none translate-y-24 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="flex max-w-full items-stretch overflow-x-auto rounded-2xl border border-white/10 bg-[#0b0b0d]/90 px-2 py-1.5 shadow-[0_16px_45px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        {tabs.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          const content = (
            <>
              <Icon
                className={`h-[22px] w-[22px] ${active ? "text-fox" : "text-[#8f98a2]"}`}
              />
              <span
                className={`mt-1 text-[10px] tracking-wide ${
                  active ? "font-semibold text-white" : "text-[#8f98a2]"
                }`}
              >
                {label}
              </span>
            </>
          );
           const className = "flex min-w-[54px] flex-1 flex-col items-center rounded-xl px-1.5 py-1.5";
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={className}>
              {content}
           </Link>
          );
        })}
      </div>
    </nav>
  );
}
