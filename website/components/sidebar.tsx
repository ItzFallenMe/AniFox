"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  AnimeIcon,
  ChevronRightIcon,
  GithubIcon,
  HomeIcon,
  MangaIcon,
  MovieIcon,
  SearchIcon,
  TvIcon,
} from "./icons";

const items = [
  { href: "/home", label: "Home", Icon: HomeIcon },
  { href: "/explore", label: "Explore", Icon: SearchIcon },
  { href: "/tv", label: "TV Shows", Icon: TvIcon },
  { href: "/anime", label: "Anime", Icon: AnimeIcon },
  { href: "/movies", label: "Movies", Icon: MovieIcon },
  { href: "/manga", label: "Manga", Icon: MangaIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/explore?q=${encodeURIComponent(term)}` : "/explore");
  }

  return (
    <aside className="app-sidebar" aria-label="Sidebar">
      <Link href="/home" className="app-sidebar-brand" aria-label="AniFox home">
        <Image src="/logo.png" alt="" width={38} height={38} priority />
        <span>AniFox</span>
      </Link>

      <form className="app-sidebar-search" onSubmit={submit} role="search">
        <SearchIcon />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search titles"
          aria-label="Search anime, movies and TV"
          spellCheck={false}
        />
      </form>

      <nav className="app-sidebar-nav" aria-label="Main">
        {items.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`app-sidebar-link ${active ? "is-active" : ""}`}
            >
              <span className="app-sidebar-icon">
                <Icon />
              </span>
              <span>{label}</span>
              {active ? <i aria-hidden="true" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="app-sidebar-foot">
        <Link href="/credits" className="app-sidebar-utility">
          <span>Credits</span>
          <ChevronRightIcon />
        </Link>
        <a
          href="https://github.com/ItzFallenMe/AniFox"
          target="_blank"
          rel="noreferrer"
          className="app-sidebar-utility"
        >
          <GithubIcon />
          <span>Source</span>
        </a>
        <Link href="/" className="app-sidebar-download">
          Get the app
        </Link>
      </div>
    </aside>
  );
}
