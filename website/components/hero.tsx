"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, StarIcon } from "./icons";
import { titleHref, typeLabel, watchHref } from "@/lib/routes";
import type { Media } from "@/lib/types";

const ROTATE_MS = 9000;

export function Hero({ items }: { items: Media[] }) {
  const slides = useMemo(
    () => items.filter((item) => item.backdrop).slice(0, 6),
    [items],
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    if (index > slides.length - 1) setIndex(0);
  }, [index, slides.length]);

  if (!slides.length) return null;
  const media = slides[index];
  const genres = media.genres?.length ? media.genres.slice(0, 2) : [typeLabel(media.type)];

  return (
    <section className="stream-hero" aria-label="Featured titles">
      <div key={`art-${media.key}`} className="stream-hero-art">
        <img src={media.backdrop ?? ""} alt="" fetchPriority="high" />
      </div>
      <div className="stream-hero-shade" />
      <div className="stream-hero-grain" />

      <div className="stream-hero-topline">
        <span><i /> CURATED FOR YOUR NEXT WATCH</span>
        <span className="stream-hero-count">{String(index + 1).padStart(2, "0")} <b>/ {String(slides.length).padStart(2, "0")}</b></span>
      </div>

      <div key={`copy-${media.key}`} className="stream-hero-copy">
        <div className="stream-hero-label"><span>{media.type === "tv" ? "SERIES SPOTLIGHT" : `${typeLabel(media.type)} SPOTLIGHT`}</span></div>
        <h1>{media.title}</h1>
        <div className="stream-hero-meta">
          {media.score != null && media.score > 0 ? <span className="stream-hero-score"><StarIcon /> {media.score.toFixed(1)}</span> : null}
          {media.year ? <span>{media.year}</span> : null}
          {genres.map((genre) => <span key={genre}>{genre}</span>)}
        </div>
        {media.overview ? <p>{media.overview}</p> : null}
        <div className="stream-hero-actions">
          <Link href={watchHref(media.type, media.id, 1, 1)} className="stream-hero-play"><PlayIcon /> Watch now</Link>
          <Link href={titleHref(media)} className="stream-hero-details">Explore title <span>↗</span></Link>
        </div>
      </div>

      {slides.length > 1 ? (
        <div className="stream-hero-controls">
          <div className="stream-hero-progress" key={media.key}><i /></div>
          <div className="stream-hero-thumbnails">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.key}
                type="button"
                aria-label={`Feature ${slide.title}`}
                aria-current={slideIndex === index ? "true" : undefined}
                onClick={() => setIndex(slideIndex)}
                className={slideIndex === index ? "is-active" : ""}
              >
                <img src={slide.backdrop ?? slide.poster ?? ""} alt="" loading="lazy" />
              </button>
            ))}
          </div>
          <div className="stream-hero-arrows">
            <button type="button" onClick={() => setIndex((current) => (current - 1 + slides.length) % slides.length)} aria-label="Previous featured title"><ChevronLeftIcon /></button>
            <button type="button" onClick={() => setIndex((current) => (current + 1) % slides.length)} aria-label="Next featured title"><ChevronRightIcon /></button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
