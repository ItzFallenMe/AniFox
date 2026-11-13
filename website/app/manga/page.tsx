"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { SearchIcon } from "@/components/icons";

interface MangaItem {
  id: string;
  title: string;
  source?: string;
  image?: string | null;
  description?: string | null;
  chapter?: string | null;
}

interface MangaResponse {
  mangaList?: MangaItem[];
  unavailableSources?: string[];
  sourceGuide?: string;
  error?: string;
}

interface MangaSourceOption {
  id: string;
  name: string;
  capabilities?: string[];
}

interface MangaSourcesResponse {
  sources?: MangaSourceOption[];
  guide?: string;
  implementation?: string;
}

function sourceName(id: string, options: MangaSourceOption[]) {
  const known = options.find((item) => item.id === id);
  if (known) return known.name;
  const labels: Record<string, string> = { mangadex: "MangaDex", mangapill: "MangaPill" };
  return labels[id] ?? id.replace(/\.(com|org|net|io|to|cc)$/i, "").replace(/[-.]+/g, " ");
}

export default function MangaCatalogPage() {
  const activeRequest = useRef<AbortController | null>(null);
  const [items, setItems] = useState<MangaItem[]>([]);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const [sources, setSources] = useState<MangaSourceOption[]>([
    { id: "mangadex", name: "MangaDex", capabilities: ["search"] },
    { id: "mangapill", name: "MangaPill", capabilities: ["search"] },
    { id: "asura", name: "Asura Scans", capabilities: ["search"] },
    { id: "comick", name: "ComicK", capabilities: ["search"] },
    { id: "tcb", name: "TCB Scans", capabilities: ["search"] },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unavailableSources, setUnavailableSources] = useState<string[]>([]);
  const [sourceGuide, setSourceGuide] = useState<string | null>(null);

  const loadCatalog = useCallback(async (search: string, selectedSource: string) => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setError(null);
    setUnavailableSources([]);
    try {
      const endpoint = search
        ? `/api/manga/search?query=${encodeURIComponent(search)}&source=${encodeURIComponent(selectedSource)}`
        : "/api/manga/catalog";
      const response = await fetch(endpoint, { signal: controller.signal, cache: "no-store" });
      const data = (await response.json()) as MangaResponse;
      if (!response.ok) throw new Error(data.error || "Could not load manga.");
      if (controller.signal.aborted) return;
      setItems(data.mangaList ?? []);
      setUnavailableSources(data.unavailableSources ?? []);
      if (data.sourceGuide) setSourceGuide(data.sourceGuide);
    } catch (cause) {
      if (controller.signal.aborted) return;
      setItems([]);
      setError(cause instanceof Error ? cause.message : "Could not load manga.");
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadCatalog("", "all");
    return () => activeRequest.current?.abort();
  }, [loadCatalog]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/manga/sources", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const result = (await response.json()) as MangaSourcesResponse;
        const options = (result.sources ?? []).filter((item) => item.capabilities?.includes("search"));
        if (options.length) setSources(options);
        if (result.guide) setSourceGuide(result.guide);
      })
      .catch(() => {
        // The static list stays usable while the API is offline or unconfigured.
      });
    return () => controller.abort();
  }, []);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadCatalog(query.trim(), source);
  }

  return (
    <div className="manga-client-page animate-fade-in px-6 pb-20 pt-[76px] md:pt-8 lg:px-20">
      <header className="max-w-2xl">
        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
          A new chapter awaits
        </span>
        <h1 className="mt-3 text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-[42px]">
          Find your next{" "}
          <span className="manga-heading-accent">
            manga.
          </span>
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-white/45">
          Browse the MangaDex catalog or search AniFox’s connected sources, then read chapters here.
        </p>
      </header>

      <form
        onSubmit={onSearch}
        className="manga-search-panel mt-7 flex min-h-14 flex-wrap items-center gap-3 rounded-2xl border px-4 py-2 transition-all duration-200 md:px-5"
      >
        <SearchIcon className="h-5 w-5 shrink-0 text-white/40" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search manga titles…"
          spellCheck={false}
          aria-label="Search manga titles"
          className="relative z-10 w-full bg-transparent text-[16px] font-medium tracking-[-0.01em] text-white outline-none placeholder:text-white/35"
        />
        <label className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
          Source
          <select
            value={source}
            onChange={(event) => setSource(event.target.value)}
            aria-label="Search manga sources"
            className="max-w-[145px] bg-transparent text-[11px] font-semibold normal-case tracking-normal text-white/80 outline-none"
          >
            <option value="all" className="bg-[#111113]">All AniFox sources</option>
            {sources.map((item) => (
              <option key={item.id} value={item.id} className="bg-[#111113]">{item.name}</option>
            ))}
          </select>
        </label>
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
        <button
          type="submit"
          disabled={loading}
          className="relative z-10 h-9 shrink-0 rounded-full px-4 text-[13px] font-bold transition disabled:opacity-40"
        >
          Search
        </button>
      </form>

      <div className="mt-9">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="min-w-0 truncate text-[18px] font-semibold tracking-tight text-white/90 lg:text-[20px]">
            {query.trim() ? `Results for “${query.trim()}”` : "Popular right now"}
          </h2>
          <span className="shrink-0 text-[11.5px] font-medium text-white/40">
            {loading ? "Loading…" : `${items.length} titles`}
          </span>
        </div>

        {unavailableSources.length ? (
          <p className="mb-4 rounded-xl border border-amber-200/10 bg-amber-100/[0.035] px-4 py-3 text-[11px] text-amber-100/60">
            Some sources are temporarily unavailable ({unavailableSources.map((item) => sourceName(item, sources)).join(", ")}). Showing results from sources that responded.{" "}
            {sourceGuide ? <a href={sourceGuide} target="_blank" rel="noreferrer" className="underline underline-offset-2">Source reference</a> : null}
          </p>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-6 py-12 text-center">
            <p className="text-[15px] font-semibold text-white/85">
              Manga catalog unavailable
            </p>
            <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-white/40">
              {error} AniFox’s manga endpoints run on this deployment; check back if a source is temporarily offline.
            </p>
            <button
              type="button"
              onClick={() => void loadCatalog(query.trim(), source)}
              className="mt-5 h-9 rounded-full border border-white/15 px-4 text-[12.5px] font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div
            className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
            aria-hidden="true"
          >
            {Array.from({ length: 14 }, (_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-[2/3] rounded-xl bg-white/[0.055]" />
                <div className="mt-3 h-3 w-4/5 rounded bg-white/[0.055]" />
              </div>
            ))}
          </div>
        ) : items.length ? (
          <div className="stagger grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/manga/${encodeURIComponent(item.id)}`}
                className="manga-client-card group block min-w-0"
              >
                <div className="manga-cover relative aspect-[2/3] overflow-hidden rounded-xl bg-[#111014] ring-1 ring-white/[0.06]">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 42vw, (max-width: 1000px) 22vw, 170px"
                      unoptimized
                      className="object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[13px] font-extrabold tracking-[0.18em] text-white/20">
                      ANIFOX
                    </span>
                  )}
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/85 via-black/10 to-transparent p-3 opacity-0 transition duration-300 group-hover:opacity-100">
                    <span className="flex h-9 w-full items-center justify-center rounded-lg bg-white text-[12.5px] font-semibold text-black">
                      Read now
                    </span>
                  </div>
                  {item.source ? (
                    <span className="absolute left-2 top-2 rounded-full border border-white/15 bg-black/65 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.13em] text-white/80 backdrop-blur">
                       {sourceName(item.source, sources)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 truncate text-[13px] font-semibold tracking-[-0.01em] text-white/90 transition group-hover:text-white">
                  {item.title}
                </p>
                {item.chapter ? (
                  <p className="mt-1 truncate text-[11px] font-medium text-white/40">
                    {item.chapter}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-6 py-12 text-center">
            <p className="text-[15px] font-semibold text-white/85">
              No manga found
            </p>
            <p className="mx-auto mt-2 max-w-sm text-[13px] text-white/40">
              Try another title or browse the full catalog.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
