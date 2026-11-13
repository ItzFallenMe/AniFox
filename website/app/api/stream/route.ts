export const runtime = "edge";

const SOURCES: Record<string, { base: string; supportsMal?: boolean; supportsAnime?: boolean }> = {
  vidly: { base: "https://vidly.pro", supportsMal: true },
  vidbolt: { base: "https://vidbolt.xyz", supportsMal: true },
  vidy: { base: "https://vidy.st" },
  embedwave: { base: "https://embedwave.cc", supportsAnime: false },
};

function error(message: string, status: number) {
  return Response.json({ error: message }, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

function numericId(value: string | null) {
  return value && /^\d{1,16}$/.test(value) && Number(value) > 0 ? value : null;
}

function seasonNumber(value: string | null) {
  return value && /^\d{1,3}$/.test(value) ? String(Number(value)) : "1";
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const source = params.get("source") ?? "";
  const provider = SOURCES[source];
  if (!provider) return error("Choose a supported AniFox streaming source.", 400);

  const type = params.get("type");
  const episode = numericId(params.get("episode"));
  const season = seasonNumber(params.get("season"));
  const tmdb = numericId(params.get("tmdbId"));
  const anilist = numericId(params.get("anilistId"));
  const mal = numericId(params.get("malId"));
  const base = provider.base;
  let path: string | null = null;

  if (type === "movie" && tmdb) {
    path = source === "embedwave" ? `/embed/movie/${tmdb}` : `/movie/${tmdb}`;
  } else if (type === "tv" && tmdb && episode) {
    path = source === "embedwave"
      ? `/embed/tv/${tmdb}/${season}/${episode}`
      : `/tv/${tmdb}/${season}/${episode}`;
  } else if (type === "anime" && source !== "embedwave" && episode) {
    if (anilist) path = `/anime/${anilist}/${episode}`;
    else if (provider.supportsMal && mal) path = `/anime/mal/${mal}/${episode}`;
  }

  if (!path) return error("This source cannot play the title with its available IDs.", 400);

  return new Response(null, {
    status: 307,
    headers: {
      Location: new URL(path, base).href,
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" },
  });
}
