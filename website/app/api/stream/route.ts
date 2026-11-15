export const runtime = "nodejs";

const API_VERSION = "1";
const SOURCES = {
  vidly: {
    base: "https://vidly.pro",
    name: "Vidly",
    supports: ["movie", "tv", "anime"],
    supportsMal: true,
  },
  vidbolt: {
    base: "https://vidbolt.xyz",
    name: "VidBolt",
    supports: ["movie", "tv", "anime"],
    supportsMal: true,
  },
  vidy: {
    base: "https://vidy.st",
    name: "Vidy",
    supports: ["movie", "tv", "anime"],
    supportsMal: false,
  },
  embedwave: {
    base: "https://embedwave.cc",
    name: "EmbedWave",
    supports: ["movie", "tv"],
    supportsMal: false,
  },
} as const;

type SourceId = keyof typeof SOURCES;
type MediaType = "movie" | "tv" | "anime";

function requestId() {
  return crypto.randomUUID();
}

function responseHeaders(id: string): Headers {
  return new Headers({
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Request-Id": id,
    "X-AniFox-API-Version": API_VERSION,
  });
}

function apiError(
  id: string,
  status: number,
  code: string,
  message: string,
): Response {
  return Response.json(
    {
      error: message,
      code,
      requestId: id,
      meta: { apiVersion: API_VERSION },
    },
    { status, headers: responseHeaders(id) },
  );
}

/** Reject duplicate query keys instead of silently accepting the first value. */
function singleParam(params: URLSearchParams, key: string): string | null | false {
  const values = params.getAll(key);
  if (values.length > 1) return false;
  return values[0] ?? null;
}

function positiveId(value: string | null | false): string | null | false {
  if (value === false) return false;
  if (value === null) return null;
  return /^\d{1,16}$/.test(value) && /[1-9]/.test(value) ? value : false;
}

function seasonNumber(value: string | null | false): string | null | false {
  if (value === false) return false;
  if (value === null) return "1";
  if (!/^\d{1,3}$/.test(value)) return false;
  return String(Number(value));
}

function validMediaType(value: string | null | false): value is MediaType {
  return value === "movie" || value === "tv" || value === "anime";
}

function safeProviderUrl(source: SourceId, path: string): string | null {
  const base = new URL(SOURCES[source].base);
  const target = new URL(path, base);
  if (target.protocol !== "https:" || target.origin !== base.origin) return null;
  return target.href;
}

export async function GET(request: Request) {
  const id = requestId();
  const params = new URL(request.url).searchParams;
  const allowedKeys = new Set(["source", "type", "episode", "season", "tmdbId", "anilistId", "malId"]);
  for (const key of params.keys()) {
    if (!allowedKeys.has(key)) {
      return apiError(id, 400, "UNKNOWN_PARAMETER", `Unknown query parameter: ${key}`);
    }
  }

  const sourceValue = singleParam(params, "source");
  const typeValue = singleParam(params, "type");
  const episodeValue = positiveId(singleParam(params, "episode"));
  const seasonValue = seasonNumber(singleParam(params, "season"));
  const tmdbValue = positiveId(singleParam(params, "tmdbId"));
  const anilistValue = positiveId(singleParam(params, "anilistId"));
  const malValue = positiveId(singleParam(params, "malId"));

  if ([sourceValue, typeValue, episodeValue, seasonValue, tmdbValue, anilistValue, malValue].includes(false)) {
    return apiError(id, 400, "INVALID_QUERY", "A query parameter is duplicated or has an invalid format.");
  }

  if (typeof sourceValue !== "string" || !Object.hasOwn(SOURCES, sourceValue)) {
    return apiError(id, 400, "UNSUPPORTED_SOURCE", "Choose a supported AniFox streaming source.");
  }

  const source = sourceValue as SourceId;
  if (!validMediaType(typeValue)) {
    return apiError(id, 400, "INVALID_MEDIA_TYPE", "Media type must be movie, tv, or anime.");
  }

  const provider = SOURCES[source];
  if (!(provider.supports as readonly string[]).includes(typeValue)) {
    return apiError(id, 422, "UNSUPPORTED_MEDIA_TYPE", `${provider.name} does not support this media type.`);
  }

  const episode = episodeValue;
  const season = seasonValue;
  const tmdb = tmdbValue;
  const anilist = anilistValue;
  const mal = malValue;

  let path: string | null = null;

  if (typeValue === "movie" && tmdb) {
    path = source === "embedwave" ? `/embed/movie/${tmdb}` : `/movie/${tmdb}`;
  } else if (typeValue === "tv" && tmdb && episode) {
    path = source === "embedwave"
      ? `/embed/tv/${tmdb}/${season}/${episode}`
      : `/tv/${tmdb}/${season}/${episode}`;
  } else if (typeValue === "anime" && episode) {
    if (anilist) {
      path = `/anime/${anilist}/${episode}`;
    } else if (provider.supportsMal && mal) {
      path = `/anime/mal/${mal}/${episode}`;
    }
  }

  if (!path) {
    return apiError(
      id,
      422,
      "MISSING_MEDIA_ID",
      "This source cannot play the title with the supplied media IDs.",
    );
  }

  const destination = safeProviderUrl(source, path);
  if (!destination) {
    return apiError(id, 500, "INVALID_PROVIDER_TARGET", "AniFox could not construct a safe provider destination.");
  }

  return new Response(null, {
    status: 307,
    headers: {
      ...Object.fromEntries(responseHeaders(id)),
      Location: destination,
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
}
