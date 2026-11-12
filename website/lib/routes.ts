import type { Media } from "./types";

export function titleHref(media: Pick<Media, "type" | "id">): string {
  return `/title/${media.type}/${media.id}`;
}

export function watchHref(
  type: Media["type"],
  id: number,
  episode = 1,
  season = 1,
): string {
  const query = type === "tv" && season > 1 ? `?season=${season}` : "";
  return `/watch/${type}/${id}/${episode}${query}`;
}

export function typeLabel(type: Media["type"]): string {
  if (type === "tv") return "TV";
  if (type === "anime") return "Anime";
  return "Movie";
}
