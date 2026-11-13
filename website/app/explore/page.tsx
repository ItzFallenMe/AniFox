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
    <div className="animate-fade-in px-6 pb-20 pt-[76px] md:pt-8 lg:px-20">
      <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#0f1014] px-4 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)] transition-all duration-200 focus-within:border-white/20 focus-within:bg-[#15171d] md:px-5">
        <SearchIcon className="h-5 w-5 shrink-0 text-white/40" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Movies, shows, anime and more…"
          spellCheck={false}
          aria-label="Search movies, TV shows and anime"
          className="relative z-10 w-full bg-transparent text-[16px] font-medium tracking-[-0.01em] text-white outline-none placeholder:text-white/35 [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="shrink-0 text-lg leading-none text-white/40 transition hover:text-white"
          >
            ×
          </button>
        ) : null}
      </div>

      <div className="no-scrollbar mt-4 inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/[0.06] bg-white/[0.02] p-1" role="group" aria-label="Filter results">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            aria-pressed={filter === item.id}
            className={`relative z-10 flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium tracking-[-0.01em] outline-none transition-colors duration-200 ${
              filter === item.id ? "bg-white text-black" : "text-white/50 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <ErrorNotice message={error.message} /> : null}

      <div className="mt-8">
        {loading && !items.length ? (
          <PageSkeleton />
        ) : items.length ? (
          <>
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 className="min-w-0 truncate text-[18px] font-semibold tracking-tight text-white/90 lg:text-[20px]">
                {debouncedQuery ? `Results for “${debouncedQuery}”` : "Trending Right Now"}
              </h2>
              <span className="shrink-0 text-[11.5px] font-medium text-white/40">
                {items.length} titles
              </span>
            </div>
            <div className="stagger grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
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
