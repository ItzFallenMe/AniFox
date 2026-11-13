"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { MediaCard } from "./media-card";
import type { RailData } from "@/lib/types";

interface RailProps extends RailData {
  /** Number the first ten items, trending style. */
  ranked?: boolean;
  href?: string;
}

export function Rail({ title, items, ranked = false, href = "/explore" }: RailProps) {
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
    node.scrollBy({ left: direction * node.clientWidth * 0.85, behavior: "smooth" });
  }

  if (!items.length) return null;

  return (
    <section className="px-6 pt-8 lg:px-20">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="truncate text-[18px] font-semibold tracking-tight text-white/90 lg:text-[20px]">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 md:flex">
            <button
              type="button"
              aria-label={`Scroll ${title} left`}
              onClick={() => scrollBy(-1)}
              disabled={atStart}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white disabled:opacity-20"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={`Scroll ${title} right`}
              onClick={() => scrollBy(1)}
              disabled={atEnd}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white disabled:opacity-20"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
          <Link
            href={href}
            className="group/va flex shrink-0 items-center gap-1.5 py-1 text-[13px] font-medium tracking-[-0.01em] text-white/50 outline-none transition-colors duration-200 hover:text-white focus-visible:text-white"
          >
            <span className="relative after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 group-hover/va:after:scale-x-100 group-focus-visible/va:after:scale-x-100">
              View all
            </span>
            <ChevronRightIcon className="h-[13px] w-[13px]" />
          </Link>
        </div>
      </div>

      <div className="group/row relative -mx-2">
        <div
          ref={scroller}
          role="group"
          aria-label={title}
          className="no-scrollbar flex snap-x gap-3 overflow-x-auto scroll-smooth overscroll-x-contain px-2 pt-4"
        >
          {items.map((media, cardIndex) => (
            <MediaCard
              key={media.key}
              media={media}
              rank={ranked && cardIndex < 10 ? cardIndex + 1 : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
