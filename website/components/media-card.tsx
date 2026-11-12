import Link from "next/link";
import type { CSSProperties } from "react";
import { PlayIcon, StarIcon } from "./icons";
import { titleHref, typeLabel } from "@/lib/routes";
import type { Media } from "@/lib/types";

interface MediaCardProps {
  media: Media;
  wide?: boolean;
  fluid?: boolean;
  /** 1-based position used by the "Top 10" rail. */
  rank?: number;
}

export function MediaCard({ media, wide = false, fluid = false, rank }: MediaCardProps) {
  const image = wide ? media.backdrop ?? media.poster : media.poster;

  return (
    <Link
      href={titleHref(media)}
      style={{ "--i": rank ? Math.min(rank - 1, 12) : undefined } as CSSProperties}
      className={`media-card group/card relative flex min-w-0 shrink-0 flex-col outline-none transition-transform duration-500 ease-smooth hover:z-10 hover:-translate-y-2 focus-visible:z-10 ${
        wide
          ? "w-[210px] md:w-[270px] lg:w-[330px]"
          : fluid
            ? "w-full"
            : "w-[132px] md:w-[162px] lg:w-[188px]"
      } ${rank ? "media-card-ranked" : ""}`}
    >
      {rank ? <span className="media-card-rank" aria-hidden="true">{String(rank).padStart(2, "0")}</span> : null}

      <div
        className={`media-card-art relative overflow-hidden rounded-xl bg-[#1a1c24] ring-1 ring-white/5 transition-all duration-500 group-hover/card:ring-white/25 group-focus-visible/card:ring-2 group-focus-visible/card:ring-white/70 ${
          wide ? "aspect-video" : "aspect-[2/3]"
        }`}
      >
        {image ? (
          <img
            src={image}
            alt={media.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-smooth group-hover/card:scale-[1.07]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/10 to-white/[0.02] p-3 text-center text-xs font-medium text-white/40">
            {media.title}
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-70 transition-opacity duration-500 group-hover/card:opacity-95" />

        <span className="media-card-play pointer-events-none absolute inset-0 m-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white opacity-0 backdrop-blur-md transition-all duration-500 group-hover/card:opacity-100 group-focus-visible/card:opacity-100">
          <PlayIcon className="h-4 w-4 translate-x-px" />
        </span>

        {!wide ? (
          <div className="media-card-caption pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1 p-3 opacity-0 transition-all duration-500 group-hover/card:opacity-100 group-focus-visible/card:opacity-100">
            <span className="line-clamp-2 text-[12px] font-semibold leading-tight text-white">
              {media.title}
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-white/60">
              {media.score != null && media.score > 0 ? (
                <span className="flex items-center text-white/80">
                  <StarIcon className="mr-0.5 h-2.5 w-2.5" /> {media.score.toFixed(1)}
                </span>
              ) : null}
              {media.year ? <span>{media.year}</span> : null}
              <span>{typeLabel(media.type)}</span>
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col px-0.5">
        <p className="mt-2 truncate text-[13px] font-semibold tracking-tight text-white/85 transition-colors group-hover/card:text-white">
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
