"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AnimeIcon,
  CloseIcon,
  HomeIcon,
  MangaIcon,
  MovieIcon,
  SearchIcon,
  TvIcon,
} from "./icons";

const items = [
  { href: "/home", label: "Home", Icon: HomeIcon },
  { href: "/explore", label: "Explore", Icon: SearchIcon },
  { href: "/tv", label: "TV", Icon: TvIcon },
  { href: "/anime", label: "Anime", Icon: AnimeIcon },
  { href: "/movies", label: "Movies", Icon: MovieIcon },
  { href: "/manga", label: "Manga", Icon: MangaIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let previous = window.scrollY;
    let frame = 0;

    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const current = window.scrollY;
        setScrolled(current > 8);
        setHidden(current > previous && current > 220);
        previous = current;
        frame = 0;
      });
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setQuery("");
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSearchOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/explore?q=${encodeURIComponent(term)}` : "/explore");
    setSearchOpen(false);
  }

  return (
    <header
      className={`top-nav ${scrolled ? "is-scrolled" : ""} ${hidden ? "is-hidden" : ""}`}
    >
      <div className="top-nav-inner">
        <Link href="/home" className="top-nav-brand" aria-label="AniFox home">
          <Image src="/logo.png" alt="" width={34} height={34} priority />
          <span>AniFox</span>
        </Link>

        <nav aria-label="Main" className="top-nav-links no-scrollbar">
          {items.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`top-nav-link ${active ? "is-active" : ""}`}
              >
                <Icon />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="top-nav-actions">
          <form
            onSubmit={submitSearch}
            className={`top-nav-search ${searchOpen ? "is-open" : ""}`}
            role="search"
          >
            <button
              type={searchOpen ? "submit" : "button"}
              onClick={() => {
                if (!searchOpen) setSearchOpen(true);
              }}
              aria-label="Search titles"
              aria-expanded={searchOpen}
            >
              <SearchIcon />
            </button>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search anime, movies, TV…"
              aria-label="Search anime, movies and TV"
              spellCheck={false}
            />
            {searchOpen ? (
              <button
                type="button"
                className="top-nav-search-close"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <CloseIcon />
              </button>
            ) : null}
          </form>
        </div>
      </div>
    </header>
  );
}
