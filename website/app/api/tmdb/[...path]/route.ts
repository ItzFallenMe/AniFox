import { enforceApiRateLimit } from "../../../../lib/api-rate-limit";

export const runtime = "nodejs";

const TMDB_BASE = "https://api.themoviedb.org/3";
const CACHE_SECONDS = 1800;
const UPSTREAM_TIMEOUT_MS = 12_000;
const API_VERSION = "1";

const ALLOWED_QUERY_KEYS = new Set([
  "append_to_response",
  "include_adult",
  "language",
  "page",
  "query",
]);

const APPENDABLE = new Set(["credits", "external_ids", "release_dates", "content_ratings"]);

function requestId() {
  return crypto.randomUUID();
}

function jsonError(id: string, status: number, code: string, message: string) {
  return Response.json(
    { error: message, code, requestId: id, meta: { apiVersion: API_VERSION } },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "X-Request-Id": id,
        "X-AniFox-API-Version": API_VERSION,
      },
    },
  );
}

function isAllowedPath(path: string) {
  return (
    /^\/trending\/(?:all|movie|tv)\/(?:day|week)$/.test(path) ||
    /^\/search\/multi$/.test(path) ||
    /^\/movie\/(?:popular|top_rated|upcoming|now_playing)$/.test(path) ||
    /^\/tv\/(?:popular|top_rated|airing_today|on_the_air)$/.test(path) ||
    /^\/(?:movie|tv)\/\d{1,16}$/.test(path) ||
    /^\/tv\/\d{1,16}\/season\/\d{1,3}$/.test(path)
  );
}

function validLanguage(value: string) {
  return /^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(value);
}

function appendToResponse(value: string) {
  const items = value.split(",");
  return items.length > 0 && items.length <= APPENDABLE.size &&
    items.every((item) => APPENDABLE.has(item)) &&
    new Set(items).size === items.length;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const id = requestId();
  const limited = await enforceApiRateLimit(request, id, "tmdb", 2);
  if (limited) return limited;
  const apiKey = process.env.TMDB_API_KEY?.trim();
  if (!apiKey) {
    return jsonError(id, 503, "TMDB_NOT_CONFIGURED", "TMDB metadata is not configured on this deployment.");
  }

  const { path: segments } = await context.params;
  if (!segments.length || segments.some((part) => !/^[A-Za-z0-9_-]{1,40}$/.test(part))) {
    return jsonError(id, 404, "TMDB_ENDPOINT_NOT_FOUND", "TMDB endpoint not found.");
  }

  const path = `/${segments.join("/")}`;
  if (!isAllowedPath(path)) {
    return jsonError(id, 404, "TMDB_ENDPOINT_NOT_FOUND", "TMDB endpoint not found.");
  }

  const requestUrl = new URL(request.url);
  const sourceUrl = new URL(`${TMDB_BASE}${path}`);

  for (const key of requestUrl.searchParams.keys()) {
    if (!ALLOWED_QUERY_KEYS.has(key)) {
      return jsonError(id, 400, "UNKNOWN_PARAMETER", `Unknown query parameter: ${key}`);
    }
    if (requestUrl.searchParams.getAll(key).length > 1) {
      return jsonError(id, 400, "DUPLICATE_PARAMETER", `Query parameter ${key} must appear once.`);
    }
  }

  for (const [name, value] of requestUrl.searchParams) {
    if (name === "page" && (!/^\d{1,4}$/.test(value) || Number(value) < 1 || Number(value) > 500)) {
      return jsonError(id, 400, "INVALID_PAGE", "Page must be an integer between 1 and 500.");
    }
    if (name === "include_adult" && value !== "true" && value !== "false") {
      return jsonError(id, 400, "INVALID_INCLUDE_ADULT", "include_adult must be true or false.");
    }
    if (name === "language" && !validLanguage(value)) {
      return jsonError(id, 400, "INVALID_LANGUAGE", "Language must use a valid language or language-region code.");
    }
    if (name === "query" && (!value.trim() || value.length > 200)) {
      return jsonError(id, 400, "INVALID_QUERY", "Search query must contain 1 to 200 characters.");
    }
    if (name === "append_to_response" && !appendToResponse(value)) {
      return jsonError(id, 400, "INVALID_APPEND_TO_RESPONSE", "One or more append_to_response values are not supported.");
    }
    sourceUrl.searchParams.set(name, value);
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${apiKey}`;
  } else {
    sourceUrl.searchParams.set("api_key", apiKey);
  }

  try {
    const response = await fetch(sourceUrl, {
      headers,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      next: { revalidate: CACHE_SECONDS },
    });

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return jsonError(id, 502, "TMDB_INVALID_RESPONSE", "TMDB returned an unexpected response.");
    }

    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": response.ok
          ? `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=300`
          : "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Request-Id": id,
        "X-AniFox-API-Version": API_VERSION,
      },
    });
  } catch {
    return jsonError(id, 502, "TMDB_UNAVAILABLE", "TMDB could not be reached before the request timed out.");
  }
}
