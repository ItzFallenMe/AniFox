"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeftIcon } from "@/components/icons";
import { mangaImageSrc } from "@/lib/manga-images";
import { mangaLanguageFlag, mangaLanguageName } from "@/lib/manga-language";

interface MangaChapter {
  id: string;
  name: string;
  createdAt?: string;
  languageCode?: string;
}

interface MangaDetails {
  name?: string;
  source?: string;
  imageUrl?: string;
  author?: string;
  status?: string;
  updated?: string;
  genres?: string[];
  chapterList?: MangaChapter[];
}

export default function MangaDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<MangaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/manga/title/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(async (response) => {
        const result = (await response.json()) as MangaDetails & { error?: string };
        if (!response.ok) throw new Error(result.error || "Could not load this title.");
        setData(result);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load this title.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);

  if (loading) return <div className="manga-detail-loading"><div className="manga-card-skeleton" /><div className="manga-card-skeleton" /></div>;
  if (error || !data) {
    return <div className="manga-empty-state manga-detail-error"><strong>Could not open this manga</strong><p>{error ?? "Manga details were not found."}</p><Link href="/manga">Back to manga</Link></div>;
  }
  const imageUrl = mangaImageSrc(data.imageUrl);

  return (
    <div className="manga-detail-page">
      <Link href="/manga" className="manga-back-link"><ChevronLeftIcon /> Manga catalog</Link>
      <section className="manga-detail-hero">
        {imageUrl ? <Image src={imageUrl} alt="" fill priority sizes="230px" unoptimized /> : null}
        <div className="manga-detail-cover-shade" />
        <div className="manga-detail-info">
          {imageUrl ? <Image className="manga-detail-poster" src={imageUrl} alt={data.name ?? "Manga cover"} width={196} height={280} priority unoptimized /> : null}
          <div>
            <span className="manga-eyebrow">
              MANGA · {(data.source || "mangadex").replaceAll("-", " ").toUpperCase()}
            </span>
            <h1>{data.name || "Untitled manga"}</h1>
            <p>{[data.author, data.status].filter(Boolean).join(" · ") || "Series details"}</p>
            <div className="manga-detail-tags">
              {(data.genres ?? []).slice(0, 6).map((genre) => <span key={genre}>{genre}</span>)}
            </div>
          </div>
        </div>
      </section>

      <section className="manga-chapters-section">
        <div className="manga-results-heading"><div><span>START READING</span><h2>Chapters</h2></div><span>{data.chapterList?.length ?? 0} chapters</span></div>
        {data.chapterList?.length ? (
          <div className="manga-chapter-list">
            {data.chapterList.map((chapter) => {
              return (
                <Link
                  key={chapter.id}
                  href={`/manga/${encodeURIComponent(id)}/${encodeURIComponent(chapter.id)}`}
                  className="manga-chapter-row"
                >
                  <span className="manga-chapter-number">{chapter.name.match(/[\d.]+/)?.[0] ?? "—"}</span>
                  <strong>{chapter.name}</strong>
                  <span className="manga-chapter-meta">
                    <span
                      className="manga-language-badge"
                      aria-label={`Language: ${mangaLanguageName(chapter.languageCode)}`}
                      title={mangaLanguageName(chapter.languageCode)}
                    >
                      <span className="manga-language-flag" aria-hidden="true">
                        {mangaLanguageFlag(chapter.languageCode)}
                      </span>
                      <span className="manga-language-name">
                        {mangaLanguageName(chapter.languageCode)}
                      </span>
                    </span>
                    {chapter.createdAt ? (
                      <span className="manga-chapter-date">{chapter.createdAt}</span>
                    ) : null}
                  </span>
                  <span className="manga-chapter-link-icon" aria-hidden="true">
                    <ChevronRight />
                  </span>
                </Link>
              );
            })}
          </div>
        ) : <div className="manga-empty-state"><strong>No hosted chapters available</strong><p>MangaDex has no hosted chapters for this Safe-rated title.</p></div>}
      </section>
    </div>
  );
}
