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

      <div key={`copy-${media.key}`} className="stream-hero-copy">
        <div className="stream-hero-label">
          {media.type === "tv" ? "SERIES" : typeLabel(media.type).toUpperCase()}
        </div>
        <h1>{media.title}</h1>
        <div className="stream-hero-meta">
          {media.score != null && media.score > 0 ? (
            <span className="stream-hero-score"><StarIcon /> {media.score.toFixed(1)}</span>
          ) : null}
          {media.year ? <span>{media.year}</span> : null}
          {genres.map((genre) => <span key={genre}>{genre}</span>)}
        </div>
        {media.overview ? <p>{media.overview}</p> : null}
        <div className="stream-hero-actions">
          <Link href={watchHref(media.type, media.id, 1, 1)} className="stream-hero-play">
            <PlayIcon /> Watch now
          </Link>
          <Link href={titleHref(media)} className="stream-hero-details">See More</Link>
        </div>
      </div>

      {slides.length > 1 ? (
        <div className="stream-hero-controls">
          <div className="stream-hero-dots" role="tablist" aria-label="Featured titles">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.key}
                type="button"
                role="tab"
                aria-label={slide.title}
                aria-selected={slideIndex === index}
                className={slideIndex === index ? "is-active" : ""}
                onClick={() => setIndex(slideIndex)}
              />
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
