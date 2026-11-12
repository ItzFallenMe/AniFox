"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { SearchIcon } from "@/components/icons";

interface MangaItem {
  id: string;
  title: string;
  image?: string | null;
  description?: string | null;
  chapter?: string | null;
}

interface MangaResponse {
  mangaList?: MangaItem[];
  error?: string;
}

export default function MangaCatalogPage() {
  const [items, setItems] = useState<MangaItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadCatalog(search = "") {
    setLoading(true);
    setError(null);
    try {
      const endpoint = search
        ? `/api/manga/search?query=${encodeURIComponent(search)}`
        : "/api/manga/catalog";
      const response = await fetch(endpoint);
      const data = (await response.json()) as MangaResponse;
      if (!response.ok) throw new Error(data.error || "Could not load manga.");
      setItems(data.mangaList ?? []);
    } catch (cause) {
      setItems([]);
      setError(cause instanceof Error ? cause.message : "Could not load manga.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCatalog();
  }, []);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadCatalog(query.trim());
  }

  return (
    <div className="manga-catalog-page">
      <header className="manga-catalog-hero">
        <span className="manga-eyebrow">A NEW CHAPTER AWAITS</span>
        <h1>Find your next <em>manga.</em></h1>
        <p>Browse the catalog or search for a series to start reading.</p>
        <form className="manga-search" onSubmit={onSearch}>
          <SearchIcon />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search manga titles…"
            aria-label="Search manga titles"
          />
          <button type="submit" disabled={loading}>Search</button>
        </form>
      </header>

      <section className="manga-catalog-results" aria-live="polite">
        <div className="manga-results-heading">
          <div><span>THE LIBRARY</span><h2>{query.trim() ? `Results for “${query.trim()}”` : "Popular right now"}</h2></div>
          <span>{loading ? "Loading…" : `${items.length} titles`}</span>
        </div>

        {error ? (
          <div className="manga-empty-state">
            <strong>Manga catalog unavailable</strong>
            <p>{error} Configure <code>MANGA_API_URL</code> for the website deployment to enable manga.</p>
            <button type="button" onClick={() => void loadCatalog(query.trim())}>Try again</button>
          </div>
        ) : loading ? (
          <div className="manga-card-grid" aria-hidden="true">
            {Array.from({ length: 10 }, (_, index) => <div key={index} className="manga-card-skeleton" />)}
          </div>
        ) : items.length ? (
          <div className="manga-card-grid">
            {items.map((item) => (
              <Link key={item.id} href={`/manga/${encodeURIComponent(item.id)}`} className="manga-result-card">
                <div className="manga-result-cover">
                  {item.image ? <Image src={item.image} alt="" fill sizes="(max-width: 640px) 42vw, (max-width: 1000px) 22vw, 170px" unoptimized /> : <span>ANI<br />FOX</span>}
                  <i>Read now <b>↗</b></i>
                </div>
                <strong>{item.title}</strong>
                {item.chapter ? <span>{item.chapter}</span> : null}
              </Link>
            ))}
          </div>
        ) : (
          <div className="manga-empty-state"><strong>No manga found</strong><p>Try another title or browse the catalog.</p></div>
        )}
      </section>
    </div>
  );
}
