"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { MediaCard } from "./media-card";
import type { RailData } from "@/lib/types";

interface RailProps extends RailData {
  /** Number the first nine items, Top-10 style. */
  ranked?: boolean;
  href?: string;
  /** Position used for the oversized section numeral. */
  index?: number;
}

export function Rail({ title, items, wide = false, ranked = false, href = "/explore", index }: RailProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncEdges = useCallback(() => {
    const node = scroller.current;
    if (!node) return;
    setAtStart(node.scrollLeft <= 4);
    setAtEnd(node.scrollLeft + node.clientWidth >= node.scrollWidth - 4);
  }, []);

  useEffect(() => {
    syncEdges();
    const node = scroller.current;
    if (!node) return;
    node.addEventListener("scroll", syncEdges, { passive: true });
    window.addEventListener("resize", syncEdges);
    return () => {
      node.removeEventListener("scroll", syncEdges);
      window.removeEventListener("resize", syncEdges);
    };
  }, [syncEdges, items.length]);

  function scrollBy(direction: 1 | -1) {
    const node = scroller.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth * 0.82, behavior: "smooth" });
  }

  if (!items.length) return null;
  const numeral = index != null ? String(index).padStart(2, "0") : null;

  return (
    <section className={`media-rail px-6 pt-8 lg:px-20 ${ranked ? "media-rail-ranked" : ""}`}>
      <div className="media-rail-heading mb-4 flex items-center justify-between gap-4">
        <div className="media-rail-title">
          {numeral ? <span className="media-rail-index" aria-hidden="true">{numeral}</span> : null}
          <div className="media-rail-title-copy">
            <span className="media-rail-kicker">
              {ranked ? "THIS WEEK'S CHART" : "ANI FOX COLLECTION"}
            </span>
            <h2 className="truncate text-[18px] font-semibold tracking-tight text-white/90 lg:text-[20px]">
              {title}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={href}
            className="media-rail-more group/va flex shrink-0 items-center gap-1.5 py-1 text-[13px] font-medium tracking-[-0.01em] text-white/50 outline-none transition-colors duration-200 hover:text-white focus-visible:text-white"
          >
            <span className="relative after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 group-hover/va:after:scale-x-100 group-focus-visible/va:after:scale-x-100">
              View all
            </span>
            <ChevronRightIcon className="h-[15px] w-[15px] transition-transform duration-300 group-hover/va:translate-x-1 group-focus-visible/va:translate-x-1" />
          </Link>
          <div className="media-rail-arrows hidden md:flex">
            <button
              type="button"
              aria-label={`Scroll ${title} left`}
              onClick={() => scrollBy(-1)}
              disabled={atStart}
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              aria-label={`Scroll ${title} right`}
              onClick={() => scrollBy(1)}
              disabled={atEnd}
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scroller}
        className={`stagger no-scrollbar flex gap-3 overflow-x-auto scroll-smooth ${wide ? "py-4" : "pt-4"}`}
      >
        {items.map((media, index) => (
          <MediaCard
            key={media.key}
            media={media}
            wide={wide}
            rank={ranked && index < 10 ? index + 1 : undefined}
          />
        ))}
      </div>
    </section>
  );
}
