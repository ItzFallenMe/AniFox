import type { Media, MediaDetails } from "./types";

const ENDPOINT = "https://graphql.anilist.co";

interface AniListMedia {
  id: number;
  idMal?: number | null;
  title: { romaji?: string | null; english?: string | null; native?: string | null };
  description?: string | null;
  coverImage?: { extraLarge?: string | null; large?: string | null } | null;
  bannerImage?: string | null;
  seasonYear?: number | null;
  episodes?: number | null;
  duration?: number | null;
  format?: string | null;
  status?: string | null;
  averageScore?: number | null;
  genres?: string[];
  studios?: { nodes?: { name: string; isAnimationStudio?: boolean }[] } | null;
  nextAiringEpisode?: { episode: number } | null;
}

const MEDIA_FIELDS = `
  id
  idMal
  title { romaji english native }
  description
  coverImage { extraLarge large }
  bannerImage
  seasonYear
  episodes
  duration
  format
  status
  averageScore
  genres
  studios(isMain: true) { nodes { name isAnimationStudio } }
  nextAiringEpisode { episode }
`;

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`AniList request failed (${res.status})`);
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  if (!json.data) throw new Error("AniList returned no data");
  return json.data;
}

function stripHtml(value: string | null | undefined): string | null {
  if (!value) return null;
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function mapMedia(media: AniListMedia): Media {
  const title =
    media.title.english || media.title.romaji || media.title.native || "Untitled";
  return {
    key: `anime-${media.id}`,
    type: "anime",
    id: media.id,
    anilistId: media.id,
    malId: media.idMal ?? null,
    title,
    overview: stripHtml(media.description),
    poster: media.coverImage?.extraLarge ?? media.coverImage?.large ?? null,
    backdrop: media.bannerImage ?? media.coverImage?.extraLarge ?? null,
    year: media.seasonYear ? String(media.seasonYear) : null,
    score: media.averageScore != null ? media.averageScore / 10 : null,
    episodes: media.episodes ?? media.nextAiringEpisode?.episode ?? null,
    genres: media.genres ?? [],
    status: media.status ?? null,
    format: media.format ?? null,
  };
}

interface PageData {
  Page: { media: AniListMedia[] };
}

async function page(sort: string, perPage = 24, pageNumber = 1): Promise<Media[]> {
  const data = await gql<PageData>(
    `query ($page: Int, $perPage: Int, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: $sort, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }`,
    { page: pageNumber, perPage, sort: [sort] },
  );
  return data.Page.media.map(mapMedia);
}

export const getTrendingAnime = (pageNumber = 1) =>
  page("TRENDING_DESC", 24, pageNumber);

export const getPopularAnime = (pageNumber = 1) =>
  page("POPULARITY_DESC", 24, pageNumber);

export const getTopRatedAnime = (pageNumber = 1) =>
  page("SCORE_DESC", 24, pageNumber);

export async function searchAnime(query: string, pageNumber = 1): Promise<Media[]> {
  if (!query.trim()) return [];
  const data = await gql<PageData>(
    `query ($page: Int, $search: String) {
      Page(page: $page, perPage: 24) {
        media(type: ANIME, search: $search, isAdult: false, sort: SEARCH_MATCH) { ${MEDIA_FIELDS} }
      }
    }`,
    { page: pageNumber, search: query },
  );
  return data.Page.media.map(mapMedia);
}

export async function getAnimeDetails(id: number): Promise<MediaDetails> {
  const data = await gql<{ Media: AniListMedia }>(
    `query ($id: Int) { Media(id: $id, type: ANIME) { ${MEDIA_FIELDS} } }`,
    { id },
  );
  const media = mapMedia(data.Media);
  const nextEpisode = data.Media.nextAiringEpisode?.episode;
  // Total episode count when known; otherwise the episodes aired so far.
  const knownEpisodes = data.Media.episodes ?? (nextEpisode ? nextEpisode - 1 : null);
  // For airing shows `nextAiringEpisode` points at the upcoming episode, so only
  // everything before it is actually available to watch.
  const airedEpisodes = nextEpisode ? Math.max(0, nextEpisode - 1) : knownEpisodes ?? 0;

  return {
    ...media,
    title: media.title,
    overview: media.overview,
    runtime: data.Media.duration ?? null,
    genres: data.Media.genres ?? [],
    studios: data.Media.studios?.nodes?.map((studio) => studio.name) ?? [],
    episodes: knownEpisodes ?? null,
    episodeList:
      airedEpisodes > 0
        ? Array.from({ length: airedEpisodes }, (_, index) => ({
            number: index + 1,
            title: null,
            overview: null,
            still: null,
            airDate: null,
            runtime: data.Media.duration ?? null,
          }))
        : [],
    status: data.Media.status ?? null,
  };
}

/** Resolves the AniList entry for a TMDB movie/TV id when possible. */
export async function findAnimeByTitle(
  title: string,
  year: string | null | undefined,
): Promise<Media | null> {
  try {
    const results = await searchAnime(title);
    if (!results.length) return null;
    if (year) {
      const sameYear = results.find((item) => item.year === year);
      if (sameYear) return sameYear;
    }
    return results[0];
  } catch {
    return null;
  }
}
