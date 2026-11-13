"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { mangaImageSrc } from "@/lib/manga-images";
import { mangaLanguageName } from "@/lib/manga-language";

interface MangaPage {
  title?: string;
  image?: string;
}

interface ChapterLink {
  id: string;
  name: string;
  languageCode?: string;
}

interface MangaDetails {
  name?: string;
  chapterList?: ChapterLink[];
}

interface ChapterResponse {
  title?: string;
  currentChapter?: string;
  images?: MangaPage[];
}

type ReaderFit = "width" | "original";
const EMPTY_CHAPTERS: ChapterLink[] = [];

export default function MangaReaderPage() {
  const params = useParams<{ id: string; chapter: string }>();
  const { id, chapter } = params;
  const router = useRouter();
  const [data, setData] = useState<ChapterResponse | null>(null);
  const [manga, setManga] = useState<MangaDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fit, setFit] = useState<ReaderFit>("width");
  const [activePage, setActivePage] = useState(1);
  const [nearbyPages, setNearbyPages] = useState<Set<number>>(
    () => new Set([0, 1]),
  );
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setManga(null);
    setError(null);
    setLoading(true);
    setActivePage(1);

    const encodedId = encodeURIComponent(id);
    const encodedChapter = encodeURIComponent(chapter);

    void fetch(`/api/manga/title/${encodedId}`, { signal: controller.signal })
      .then(async (response) => {
        if (response.ok) setManga((await response.json()) as MangaDetails);
      })
      .catch(() => {
        // Page loading is independent from the optional chapter list.
      });

    void fetch(`/api/manga/chapter/${encodedId}/${encodedChapter}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json()) as ChapterResponse & { error?: string };
        if (!response.ok) throw new Error(result.error || "Could not load this chapter.");
        setData(result);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Could not load this chapter.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id, chapter, retryCount]);

  const chapters = manga?.chapterList ?? EMPTY_CHAPTERS;
  const chapterIndex = chapters.findIndex((item) => item.id === chapter);
  const selectedChapter = chapters[chapterIndex];
  // The server keeps chapter lists oldest-to-newest for both supported sources.
  const previous = chapterIndex > 0 ? chapters[chapterIndex - 1] : undefined;
  const next = chapterIndex >= 0 ? chapters[chapterIndex + 1] : undefined;
  const pages = data?.images ?? [];
  const progress = pages.length ? Math.round((activePage / pages.length) * 100) : 0;
  const chapterTitle =
    chapters.find((item) => item.id === chapter)?.name ||
    data?.currentChapter ||
    "Loading chapter…";

  useEffect(() => {
    const pageElements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reader-page]"),
    );
    if (!pageElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const page = visible[0]?.target.getAttribute("data-reader-page");
        if (page) setActivePage(Number(page));
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0 },
    );

    pageElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pages.length]);

  useEffect(() => {
    setNearbyPages(new Set([0, 1]));
    const pageElements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reader-page]"),
    );
    if (!pageElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setNearbyPages((current) => {
          const next = new Set(current);
          for (const entry of entries) {
            const index = Number(
              entry.target.getAttribute("data-reader-page"),
            ) - 1;
            if (!Number.isInteger(index) || index < 0) continue;
            if (entry.isIntersecting) next.add(index);
            else next.delete(index);
          }
          return next;
        });
      },
      { rootMargin: "1400px 0px", threshold: 0 },
    );

    pageElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pages.length]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, select, textarea, button")) return;
      if (event.key === "ArrowLeft" && previous) {
        event.preventDefault();
        router.push(`/manga/${encodeURIComponent(id)}/${encodeURIComponent(previous.id)}`);
      } else if (event.key === "ArrowRight" && next) {
        event.preventDefault();
        router.push(`/manga/${encodeURIComponent(id)}/${encodeURIComponent(next.id)}`);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [id, next, previous, router]);

  return (
    <div className="manga-reader-page">
      <header className="manga-reader-toolbar">
        <Link href={`/manga/${encodeURIComponent(id)}`} className="manga-reader-back">
          <ChevronLeftIcon /> <span>Chapters</span>
        </Link>

        <div className="manga-reader-title">
          <strong>{manga?.name || data?.title || "Manga reader"}</strong>
          <span>
            {chapterTitle}
            {selectedChapter?.languageCode
              ? ` · ${mangaLanguageName(selectedChapter.languageCode)}`
              : ""}
            {pages.length ? ` · Page ${activePage} of ${pages.length}` : ""}
          </span>
        </div>

        <nav aria-label="Reader controls">
          {chapters.length ? (
            <select
              aria-label="Choose chapter"
              value={chapter}
              onChange={(event) => router.push(`/manga/${encodeURIComponent(id)}/${encodeURIComponent(event.target.value)}`)}
            >
              {chapters.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          ) : null}
          <button
            type="button"
            className="manga-reader-fit"
            aria-pressed={fit === "original"}
            onClick={() => setFit((value) => value === "width" ? "original" : "width")}
            title={fit === "width" ? "Show original page size" : "Fit pages to width"}
          >
            {fit === "width" ? "Fit" : "100%"}
          </button>
          {previous ? (
            <Link href={`/manga/${encodeURIComponent(id)}/${encodeURIComponent(previous.id)}`} aria-label="Previous chapter" title="Previous chapter">
              <ChevronLeftIcon />
            </Link>
          ) : <span aria-hidden="true" />}
          {next ? (
            <Link href={`/manga/${encodeURIComponent(id)}/${encodeURIComponent(next.id)}`} aria-label="Next chapter" title="Next chapter">
              <ChevronRightIcon />
            </Link>
          ) : <span aria-hidden="true" />}
        </nav>
        <div className="manga-reader-progress" role="progressbar" aria-label="Chapter reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </header>

      {loading ? <div className="manga-reader-message" role="status">Loading pages…</div> : null}
      {error ? (
        <div className="manga-reader-message" role="alert">
          <strong>Unable to load pages</strong>
          <span>{error}</span>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Try again</button>
          <Link href={`/manga/${encodeURIComponent(id)}`}>Back to chapters</Link>
        </div>
      ) : null}
      {!loading && !error ? (
        <main className="manga-reader-pages" data-fit={fit}>
          {pages.map((page, index) => (
            <figure key={`${page.image}-${index}`} data-reader-page={index + 1}>
              {mangaImageSrc(page.image) ? (
                <MangaReaderImage
                  src={mangaImageSrc(page.image)!}
                  alt={page.title || `Page ${index + 1}`}
                  shouldLoad={nearbyPages.has(index)}
                  eager={index < 2}
                  highPriority={index === 0}
                  onVisible={() => {
                    setNearbyPages((current) => new Set(current).add(index));
                  }}
                />
              ) : null}
              <figcaption>Page {index + 1}</figcaption>
            </figure>
          ))}
          {!pages.length ? <div className="manga-reader-message">No pages were returned for this chapter.</div> : null}
          {!loading && pages.length ? (
            <nav className="manga-reader-end" aria-label="End of chapter navigation">
              <Link href={`/manga/${encodeURIComponent(id)}`} className="manga-reader-back-link">Back to chapters</Link>
              {next ? (
                <Link href={`/manga/${encodeURIComponent(id)}/${encodeURIComponent(next.id)}`} className="manga-reader-next-link">
                  Next chapter <ChevronRightIcon />
                </Link>
              ) : <span className="manga-reader-finished">You’re all caught up</span>}
            </nav>
          ) : null}
        </main>
      ) : null}
    </div>
  );
}

function MangaReaderImage({
  src,
  alt,
  shouldLoad,
  eager,
  highPriority,
  onVisible,
}: {
  src: string;
  alt: string;
  shouldLoad: boolean;
  eager: boolean;
  highPriority: boolean;
  onVisible: () => void;
}) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  if (!shouldLoad) {
    return (
      <div
        className="manga-reader-image-placeholder"
        style={{ aspectRatio: aspectRatio ? `${aspectRatio}` : "0.7" }}
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={highPriority ? "high" : "auto"}
      style={aspectRatio ? { aspectRatio: `${aspectRatio}` } : undefined}
      onLoad={(event) => {
        const image = event.currentTarget;
        if (image.naturalWidth && image.naturalHeight) {
          setAspectRatio(image.naturalWidth / image.naturalHeight);
        }
        onVisible();
      }}
    />
  );
}
