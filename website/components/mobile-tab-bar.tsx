"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimeIcon, HomeIcon, MangaIcon, MovieIcon, SearchIcon, TvIcon } from "./icons";

const tabs = [
  { href: "/home", label: "Home", Icon: HomeIcon },
  { href: "/explore", label: "Search", Icon: SearchIcon },
  { href: "/tv", label: "TV", Icon: TvIcon },
  { href: "/anime", label: "Anime", Icon: AnimeIcon },
  { href: "/movies", label: "Movies", Icon: MovieIcon },
  { href: "/manga", label: "Manga", Icon: MangaIcon },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="mobile-tabs" aria-label="Primary">
      <div className="mobile-tabs-inner">
        {tabs.map(({ href, label, Icon }) => {
          const active =
            href === "/home"
              ? pathname === "/home"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`mobile-tab ${active ? "is-active" : ""}`}
            >
              <Icon />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
