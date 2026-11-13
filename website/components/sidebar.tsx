"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import {
  CrunchyrollIcon,
  GithubIcon,
  HomeIcon,
  MangaIcon,
  MovieIcon,
  SearchIcon,
  TvIcon,
} from "./icons";

const items = [
  { href: "/home", label: "Home", Icon: HomeIcon },
  { href: "/explore", label: "Search", Icon: SearchIcon },
  { href: "/tv", label: "TV Shows", Icon: TvIcon },
  { href: "/anime", label: "Anime", Icon: CrunchyrollIcon },
  { href: "/movies", label: "Movies", Icon: MovieIcon },
  { href: "/manga", label: "Manga", Icon: MangaIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-rail group/rail" aria-label="Sidebar">
      <div className="app-rail-fade" aria-hidden="true" />

      <Link href="/home" className="app-rail-brand" aria-label="AniFox home">
        <span className="app-rail-logo">
          <Image src="/anifox-logo-mark.png" alt="" width={46} height={46} className="object-contain" priority />
        </span>
        <span className="app-rail-wordmark">AniFox</span>
      </Link>

      <nav className="app-rail-nav" aria-label="Main">
        {items.map(({ href, label, Icon }, index) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              style={{ "--i": index } as CSSProperties}
              className={`app-rail-link ${active ? "is-active" : ""}`}
            >
              <span className="app-rail-marker" aria-hidden="true" />
              <span className="app-rail-icon">
                <Icon />
              </span>
              <span className="app-rail-label">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="app-rail-foot">
        <Link href="/credits" className="app-rail-utility">
          <span className="app-rail-icon">
            <span className="app-rail-dot" aria-hidden="true" />
          </span>
          <span className="app-rail-label">Credits</span>
        </Link>
        <a
          href="https://github.com/ItzFallenMe/AniFox"
          target="_blank"
          rel="noreferrer"
          className="app-rail-utility"
        >
          <span className="app-rail-icon">
            <GithubIcon />
          </span>
          <span className="app-rail-label">Source</span>
        </a>
        <Link href="/" className="app-rail-app-link">
          <span className="app-rail-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15" strokeLinecap="round" />
            </svg>
          </span>
          <span className="app-rail-label">Get the app</span>
        </Link>
      </div>
    </aside>
  );
}
