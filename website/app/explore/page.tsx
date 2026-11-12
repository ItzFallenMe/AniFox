"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MediaCard } from "@/components/media-card";
import { EmptyState, ErrorNotice, PageSkeleton } from "@/components/notice";
import { SearchIcon } from "@/components/icons";
import { useAsync, useDebounced } from "@/lib/hooks";
import { getTrending, searchTmdb } from "@/lib/tmdb";
import { getTrendingAnime, searchAnime } from "@/lib/anilist";
import type { Media, MediaType } from "@/lib/types";

type Filter = "all" | MediaType;

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "anime", label: "Anime" },
  { id: "movie", label: "Movies" },
  { id: "tv", label: "TV Shows" },
];

function applyFilter(items: Media[], filter: Filter): Media[] {
  return filter === "all" ? items : items.filter((item) => item.type === filter);
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [filter, setFilter] = useState<Filter>((searchParams.get("type") as Filter) || "all");
  const debouncedQuery = useDebounced(query, 400);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (filter !== "all") params.set("type", filter);
    const suffix = params.toString();
    window.history.replaceState(null, "", `/explore${suffix ? `?${suffix}` : ""}`);
  }, [debouncedQuery, filter]);

  const { data, loading, error } = useAsync<{ items: Media[] }>(async () => {
    const term = debouncedQuery.trim();

    if (term) {
      const [tmdb, anime] = await Promise.all([
        searchTmdb(term).catch(() => []),
        searchAnime(term).catch(() => []),
      ]);
      return { items: [...anime, ...tmdb] };
    }

    const [tmdb, anime] = await Promise.all([
      getTrending().catch(() => []),
      getTrendingAnime().catch(() => []),
    ]);
    return { items: [...anime, ...tmdb] };
  }, [debouncedQuery]);

  const items = useMemo(() => applyFilter(data?.items ?? [], filter), [data, filter]);
  return (
    <div className="explore-page animate-fade-in px-6 pb-16 pt-10 md:pt-12 lg:px-20">
      <div className="explore-header">
        <div className="explore-kicker"><span /> YOUR NEXT FAVORITE STARTS HERE</div>
        <h1>Find your <em>story.</em></h1>
        <p>Search across anime, movies and series — all in one place.</p>

        <div className="explore-searchbox">
          <SearchIcon className="explore-search-icon" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles, people, genres…"
            spellCheck={false}
            aria-label="Search movies, TV shows and anime"
          />
          {query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button> : null}
        </div>

        <div className="explore-filters" role="group" aria-label="Filter results">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              aria-pressed={filter === item.id}
              className={`explore-filter ${filter === item.id ? "is-active" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <ErrorNotice message={error.message} /> : null}

      <div className="explore-results">
        {loading && !items.length ? (
          <PageSkeleton />
        ) : items.length ? (
          <>
            <div className="explore-results-heading">
              <div><span>{debouncedQuery ? "SEARCH RESULTS" : "FRESH DISCOVERIES"}</span><h2>{debouncedQuery ? `Results for “${debouncedQuery}”` : "Trending now"}</h2></div>
              <span>{items.length} titles</span>
            </div>
            <div className="explore-grid stagger grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {items.map((media) => (
                <MediaCard key={media.key} media={media} fluid />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title={debouncedQuery ? "No matches found" : "Start typing to search"}
            subtitle={
              debouncedQuery
                ? "Try a different spelling, or switch the filter."
                : "Search across anime, movies and TV shows."
            }
          />
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ExploreContent />
    </Suspense>
  );
}
