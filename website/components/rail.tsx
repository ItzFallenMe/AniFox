"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronRightIcon } from "./icons";
import { MediaCard } from "./media-card";
import type { RailData } from "@/lib/types";

export function Rail({ title, items, wide = false }: RailData) {
  const scroller = useRef<HTMLDivElement>(null);

  if (!items.length) return null;

  return (
    <section className="media-rail px-6 pt-8 lg:px-20">
      <div className="media-rail-heading mb-4 flex items-center justify-between gap-4">
        <h2 className="truncate text-[18px] font-semibold tracking-tight text-white/90 lg:text-[20px]">
          {title}
        </h2>
        <Link
          href="/explore"
          className="media-rail-more group/va flex shrink-0 items-center gap-1.5 py-1 text-[13px] font-medium tracking-[-0.01em] text-white/50 outline-none transition-colors duration-200 hover:text-white focus-visible:text-white"
        >
          <span className="relative after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 group-hover/va:after:scale-x-100 group-focus-visible/va:after:scale-x-100">
            View all
          </span>
          <ChevronRightIcon className="h-[15px] w-[15px] transition-transform duration-300 group-hover/va:translate-x-1 group-focus-visible/va:translate-x-1" />
        </Link>
      </div>

      <div
        ref={scroller}
        className={`stagger no-scrollbar flex gap-3 overflow-x-auto scroll-smooth ${wide ? "py-4" : "pt-4"}`}
      >
        {items.map((media) => (
          <MediaCard key={media.key} media={media} wide={wide} />
        ))}
      </div>
    </section>
  );
}
