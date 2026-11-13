"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, StarIcon } from "./icons";
import { getTitleLogo } from "@/lib/tmdb";
import { titleHref, typeLabel, watchHref } from "@/lib/routes";
import type { Media } from "@/lib/types";

const ROTATE_MS = 9000;

export function Hero({ items }: { items: Media[] }) {
  const slides = useMemo(
    () => items.filter((item) => item.backdrop).slice(0, 8),
    [items],
  );
  const [index, setIndex] = useState(0);
  const [logos, setLogos] = useState<Record<string, string | null>>({});
  const requested = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;
    for (const slide of slides) {
      if (requested.current.has(slide.key)) continue;
      requested.current.add(slide.key);
      getTitleLogo(slide)
        .then((logo) => {
          if (!cancelled) {
            setLogos((current) => ({ ...current, [slide.key]: logo }));
          }
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [slides]);

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
  const genres = media.genres?.slice(0, 2) ?? [];
  const logo = logos[media.key];

  return (
    <section
      className="relative h-[75vh] w-full max-h-[85vh] overflow-hidden md:h-auto md:aspect-video"
      aria-label="Featured titles"
    >
      <div className="absolute inset-0 bg-black">
        <img
          key={media.key}
          src={media.backdrop ?? ""}
          alt=""
          fetchPriority="high"
          className="h-full w-full animate-[fade-in_700ms_ease_both] object-cover object-top"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%]">
          <div className="absolute inset-0 backdrop-blur-[3px] [mask-image:linear-gradient(to_bottom,transparent,black_45%)]" />
          <div className="absolute inset-0 backdrop-blur-[10px] [mask-image:linear-gradient(to_bottom,transparent_30%,black_70%)]" />
          <div className="absolute inset-0 backdrop-blur-[24px] [mask-image:linear-gradient(to_bottom,transparent_55%,black_90%)]" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent md:via-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />
      </div>

      <div className="absolute inset-0 flex flex-col justify-end px-6 pb-[90px] md:pl-[100px] md:pr-6 lg:pl-[120px] lg:pr-8 lg:pb-24">
        <div className="flex w-full flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <div key={`copy-${media.key}`} className="flex w-[88%] max-w-2xl animate-[fade-in_500ms_ease_both] flex-col items-start text-left md:w-full">
            {logo ? (
              <img
                src={logo}
                alt={media.title}
                className="max-h-[64px] w-auto max-w-full object-contain object-left drop-shadow-2xl sm:max-h-[100px] md:max-h-[130px]"
              />
            ) : (
              <h1 className="text-[34px] font-extrabold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl md:text-6xl">
                {media.title}
              </h1>
            )}
            <div className="mt-3 flex flex-wrap items-center text-[13px] font-semibold text-white/90 md:text-[14px]">
              {media.score != null && media.score > 0 ? (
                <span className="flex items-center gap-1 text-white">
                  <StarIcon className="h-3.5 w-3.5" /> {media.score.toFixed(1)}
                </span>
              ) : null}
              {media.year ? (
                <>
                  <span className="mx-1.5 text-white/30">·</span>
                  <span className="tabular-nums">{media.year}</span>
                </>
              ) : null}
              {(genres.length ? genres : [typeLabel(media.type)]).map((genre) => (
                <span key={genre} className="flex items-center">
                  <span className="mx-1.5 text-white/30">·</span>
                  {genre}
                </span>
              ))}
            </div>
            {media.overview ? (
              <p className="mt-3 line-clamp-3 max-w-xl text-[13px] leading-relaxed text-white/70 md:text-[14px] lg:text-[15px]">
                {media.overview}
              </p>
            ) : null}
            <div className="mt-5 flex w-full items-center gap-3">
              <Link
                href={watchHref(media.type, media.id, 1, 1)}
                aria-label={`Play ${media.title}`}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f9f9f9] text-black shadow-lg transition hover:scale-105 hover:bg-white active:scale-95 md:h-14 md:w-14"
              >
                <PlayIcon className="h-5 w-5 translate-x-px fill-current" />
              </Link>
              <Link
                href={titleHref(media)}
                className="inline-flex items-center justify-center gap-2.5 rounded-full border border-white/20 bg-[#0f1014]/60 px-6 py-3 text-[13px] font-semibold text-[#f9f9f9] backdrop-blur-md transition hover:border-white/30 hover:bg-white/10 active:scale-95 md:py-3.5 md:text-[15px]"
              >
                See More
              </Link>
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <div className="flex items-center gap-1.5">
              {slides.map((slide, slideIndex) => (
                <button
                  key={slide.key}
                  type="button"
                  aria-label={`Show ${slide.title}`}
                  aria-current={slideIndex === index ? "true" : undefined}
                  onClick={() => setIndex(slideIndex)}
                  className={`relative h-[42px] w-[72px] overflow-hidden rounded transition-all duration-300 ${
                    slideIndex === index ? "opacity-100" : "opacity-50 hover:opacity-80"
                  }`}
                >
                  <img
                    src={slide.backdrop ?? slide.poster ?? ""}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  {slideIndex === index ? (
                    <span className="absolute inset-0 rounded ring-2 ring-white/80" />
                  ) : null}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIndex((current) => (current + 1) % slides.length)}
              aria-label="Next slide"
              className="flex h-12 w-6 shrink-0 items-center justify-center text-white/40 transition hover:text-white"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => setIndex((current) => (current - 1 + slides.length) % slides.length)}
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white/70 backdrop-blur-md transition hover:bg-black/50 hover:text-white md:flex md:left-4"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1.5 lg:hidden">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.key}
                type="button"
                aria-label={`Show ${slide.title}`}
                onClick={() => setIndex(slideIndex)}
                className={`h-1.5 rounded-full transition-all ${
                  slideIndex === index ? "w-5 bg-white" : "w-1.5 bg-white/35"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
