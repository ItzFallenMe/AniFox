import Link from "next/link";
import type { CSSProperties } from "react";
import { StarIcon } from "./icons";
import { titleHref, typeLabel } from "@/lib/routes";
import type { Media } from "@/lib/types";

interface MediaCardProps {
  media: Media;
  /** Fill the grid cell instead of using the rail width. */
  fluid?: boolean;
  /** 1-based position used by the "Trending Right Now" rail. */
  rank?: number;
}

export function MediaCard({ media, fluid = false, rank }: MediaCardProps) {
  const poster = media.poster ?? media.backdrop;
  const image = poster ? (
    <img
      src={poster}
      alt={media.title}
      loading="lazy"
      className="h-full w-full object-cover"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/10 to-white/[0.02] p-3 text-center text-xs font-medium text-white/40">
      {media.title}
    </div>
  );

  const art = (
    <div className={`relative z-20 aspect-[2/3] shrink-0 overflow-hidden rounded-lg bg-[#1a1c24] ring-1 ring-white/5 transition-all duration-300 group-hover/card:-translate-y-2 group-hover/card:ring-white/20 group-focus-visible/card:ring-white/60 ${fluid ? "w-full" : "w-[130px] sm:w-[160px] lg:w-[185px]"}`}>
      {image}
    </div>
  );

  if (rank) {
    return (
      <Link
        href={titleHref(media)}
        aria-label={`#${rank} ${media.title}`}
        style={{ "--i": Math.min(rank - 1, 12) } as CSSProperties}
        className="group/card relative flex shrink-0 snap-start items-center pr-2 outline-none lg:pr-6"
      >
        <span aria-hidden="true" className="rank-num">
          {rank}
        </span>
        <div className="relative z-20 aspect-[2/3] w-[110px] shrink-0 overflow-hidden rounded-lg bg-[#1a1c24] ring-1 ring-white/5 transition-all duration-300 group-hover/card:-translate-y-2 group-hover/card:ring-white/20 sm:w-[130px] lg:w-[160px]">
          {image}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={titleHref(media)}
      className={`group/card relative flex shrink-0 snap-start flex-col outline-none ${fluid ? "w-full" : "w-[130px] sm:w-[160px] lg:w-[185px]"}`}
    >
      {art}
      <div className="mt-2 min-w-0">
        <p className="truncate text-[13px] font-semibold tracking-tight text-white/90 transition-colors group-hover/card:text-white">
          {media.title}
        </p>
        <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-[10.5px] font-medium text-white/45">
          {media.score != null && media.score > 0 ? (
            <span className="flex shrink-0 items-center text-white/65">
              <StarIcon className="mr-1 h-2.5 w-2.5" />
              {media.score.toFixed(1)}
            </span>
          ) : null}
          {media.score != null && media.score > 0 && (media.year || media.type) ? (
            <span className="text-white/25">·</span>
          ) : null}
          {media.year ? <span className="tabular-nums">{media.year}</span> : null}
          {media.year ? <span className="text-white/25">·</span> : null}
          <span className="truncate">{typeLabel(media.type)}</span>
        </p>
      </div>
    </Link>
  );
}
