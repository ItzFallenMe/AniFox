"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import {
  CrunchyrollIcon,
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

    </aside>
  );
}
