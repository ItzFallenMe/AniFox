"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

interface MangaPage {
  title?: string;
  image?: string;
}

interface ChapterResponse {
  title?: string;
  currentChapter?: string;
  chapterListIds?: Array<{ id: string; name: string }>;
  images?: MangaPage[];
}

export default function MangaReaderPage() {
  const params = useParams<{ id: string; chapter: string }>();
  const { id, chapter } = params;
  const [data, setData] = useState<ChapterResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/manga/chapter/${encodeURIComponent(id)}/${encodeURIComponent(chapter)}`, { signal: controller.signal })
      .then(async (response) => {
        const result = (await response.json()) as ChapterResponse & { error?: string };
        if (!response.ok) throw new Error(result.error || "Could not load this chapter.");
        setData(result);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load this chapter.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, chapter]);

  const chapters = data?.chapterListIds ?? [];
  const chapterIndex = chapters.findIndex((item) => item.id === chapter);
  const previous = chapterIndex >= 0 ? chapters[chapterIndex + 1] : undefined;
  const next = chapterIndex > 0 ? chapters[chapterIndex - 1] : undefined;

  return (
    <div className="manga-reader-page">
      <header className="manga-reader-toolbar">
        <Link href={`/manga/${encodeURIComponent(id)}`} className="manga-reader-back"><ChevronLeftIcon /> <span>Chapters</span></Link>
        <div><strong>{data?.title || "Manga reader"}</strong><span>{data?.currentChapter || "Loading chapter…"}</span></div>
        <nav aria-label="Chapter navigation">
          {previous ? <Link href={`/manga/${encodeURIComponent(id)}/${encodeURIComponent(previous.id)}`} aria-label="Previous chapter"><ChevronLeftIcon /></Link> : <span />}
          {next ? <Link href={`/manga/${encodeURIComponent(id)}/${encodeURIComponent(next.id)}`} aria-label="Next chapter"><ChevronRightIcon /></Link> : <span />}
        </nav>
      </header>
      {loading ? <div className="manga-reader-message">Loading pages…</div> : null}
      {error ? <div className="manga-reader-message"><strong>Unable to load pages</strong><span>{error}</span><Link href={`/manga/${encodeURIComponent(id)}`}>Back to chapters</Link></div> : null}
      {!loading && !error ? (
        <main className="manga-reader-pages">
          {(data?.images ?? []).map((page, index) => (
            <figure key={`${page.image}-${index}`}>
              {page.image ? <img src={page.image} alt={page.title || `Page ${index + 1}`} loading={index < 2 ? "eager" : "lazy"} /> : null}
            </figure>
          ))}
          {!data?.images?.length ? <div className="manga-reader-message">No pages were returned for this chapter.</div> : null}
        </main>
      ) : null}
    </div>
  );
}
