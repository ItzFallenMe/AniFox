import Link from "next/link";
import { PlayIcon, StarIcon } from "./icons";
import { titleHref, typeLabel } from "@/lib/routes";
import type { Media } from "@/lib/types";

interface MediaCardProps {
  media: Media;
  wide?: boolean;
  fluid?: boolean;
}

export function MediaCard({ media, wide = false, fluid = false }: MediaCardProps) {
  const image = wide ? media.backdrop ?? media.poster : media.poster;

  return (
    <Link
      href={titleHref(media)}
      className={`media-card group/card relative flex min-w-0 shrink-0 flex-col outline-none transition-transform duration-300 ease-smooth hover:z-10 hover:-translate-y-2 focus-visible:z-10 ${
        wide
          ? "w-[160px] md:w-[220px] lg:w-[280px]"
          : fluid
            ? "w-full"
            : "w-[130px] md:w-[160px] lg:w-[185px]"
      }`}
    >
      <div
        className={`media-card-art relative overflow-hidden rounded-lg bg-[#1a1c24] ring-1 ring-white/5 transition-all duration-300 group-hover/card:ring-white/20 group-focus-visible/card:ring-2 group-focus-visible/card:ring-white/60 ${
          wide ? "aspect-video" : "aspect-[2/3]"
        }`}
      >
        {image ? (
          <img
            src={image}
            alt={media.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-smooth group-hover/card:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/10 to-white/[0.02] p-3 text-center text-xs font-medium text-white/40">
            {media.title}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 transition-opacity duration-300 group-hover/card:opacity-60" />
        {!wide ? (
          <span className="pointer-events-none absolute inset-0 m-auto flex h-9 w-9 translate-y-2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover/card:translate-y-0 group-hover/card:opacity-100">
            <PlayIcon className="h-4 w-4 translate-x-px" />
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col px-0.5">
        <p className="mt-2 truncate text-[14px] font-semibold tracking-tight text-white/90 transition-colors group-hover/card:text-white">
          {media.title}
        </p>
        <p className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-[11px] font-medium text-white/50">
          {media.score != null && media.score > 0 ? (
            <span className="flex shrink-0 items-center text-white/70">
              <StarIcon className="mr-1 h-2.5 w-2.5 text-white" />
              {media.score.toFixed(1)}
            </span>
          ) : null}
          {media.score != null && media.score > 0 && (media.year || media.type) ? (
            <span className="text-white/30">·</span>
          ) : null}
          {media.year ? <span className="tabular-nums">{media.year}</span> : null}
          {media.year ? <span className="text-white/30">·</span> : null}
          <span className="truncate">{typeLabel(media.type)}</span>
        </p>
      </div>
    </Link>
  );
}
