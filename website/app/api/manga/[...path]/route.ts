// The shared manga adapters are packaged with this monorepo and execute in
// this route; they are not a separately deployed service.
import mangaApi from "../../../../../server/anifox-manga-api/server/sources.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_VERSION = "1";
const REQUEST_TIMEOUT_MS = 20_000;

// The adapters are CommonJS JavaScript; pin the route contract here rather
// than letting TypeScript infer a partial destructured-parameter shape.
const searchManga = mangaApi.search as unknown as (params: {
  query: string;
  page: number;
  source: string;
}) => Promise<unknown>;

const commonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Accept",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-AniFox-API-Version": API_VERSION,
};

function requestId() {
  return crypto.randomUUID();
}

function json(data: unknown, status = 200, cache = "no-store", id = requestId()) {
  return Response.json(data, {
    status,
    headers: {
      ...commonHeaders,
      "Cache-Control": cache,
      "X-Request-Id": id,
    },
  });
}

function apiError(id: string, status: number, code: string, message: string) {
  return json(
    { error: message, code, requestId: id, meta: { apiVersion: API_VERSION } },
    status,
    "no-store",
    id,
  );
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function isValidId(value: string) {
  return /^[A-Za-z0-9_-]{1,220}$/.test(value);
}

function pageNumber(value: string | null) {
  if (value === null) return 1;
  if (!/^\d{1,4}$/.test(value)) return null;
  const page = Number(value);
  return page >= 1 && page <= 500 ? page : null;
}

function hasOnlyParams(url: URL, allowed: string[]) {
  const keys = new Set(allowed);
  return [...url.searchParams.keys()].every((key) =>
    keys.has(key) && url.searchParams.getAll(key).length === 1
  );
}

async function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("MANGA_UPSTREAM_TIMEOUT")), REQUEST_TIMEOUT_MS)
    ),
  ]);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...commonHeaders,
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const id = requestId();
  const { path } = await context.params;
  const url = new URL(request.url);
  const [endpoint, first, second] = path;

  try {
    if (endpoint === "sources" && path.length === 1) {
      if (!hasOnlyParams(url, [])) {
        return apiError(id, 400, "UNKNOWN_PARAMETER", "This endpoint does not accept query parameters.");
      }
      const result = await withTimeout(mangaApi.listSources());
      return json(result, 200, "public, s-maxage=300, stale-while-revalidate=3600", id);
    }

    if (endpoint === "search" && path.length === 1) {
      if (!hasOnlyParams(url, ["query", "page", "source"])) {
        return apiError(id, 400, "INVALID_QUERY_PARAMETERS", "Search contains an unknown or duplicated parameter.");
      }
      const query = url.searchParams.get("query")?.trim() ?? "";
      if (!query) return apiError(id, 400, "QUERY_REQUIRED", "Enter a manga title to search for.");
      if (query.length > 100) return apiError(id, 400, "QUERY_TOO_LONG", "Search titles must be 100 characters or less.");
      const page = pageNumber(url.searchParams.get("page"));
      if (page === null) return apiError(id, 400, "INVALID_PAGE", "Page must be an integer between 1 and 500.");
      const source = url.searchParams.get("source") || "all";
      if (source !== "all" && source !== "mangadex") {
        return apiError(id, 400, "UNSUPPORTED_SOURCE", "Only safe-rated MangaDex titles are available.");
      }
      const result = await withTimeout(searchManga({ query, page, source }));
      return json(result, 200, "no-store", id);
    }

    if (endpoint === "catalog" && path.length === 1) {
      if (!hasOnlyParams(url, ["page", "type", "state", "category"])) {
        return apiError(id, 400, "INVALID_QUERY_PARAMETERS", "Catalog contains an unknown or duplicated parameter.");
      }
      const page = pageNumber(url.searchParams.get("page"));
      if (page === null) return apiError(id, 400, "INVALID_PAGE", "Page must be an integer between 1 and 500.");
      const type = url.searchParams.get("type") || "latest";
      if (!["latest", "topview", "newest"].includes(type)) {
        return apiError(id, 400, "INVALID_CATALOG_TYPE", "Catalog type must be latest, topview, or newest.");
      }
      const state = url.searchParams.get("state") || undefined;
      if (state && !["ongoing", "completed", "hiatus", "cancelled", "None"].includes(state)) {
        return apiError(id, 400, "INVALID_STATE", "The requested manga status is not supported.");
      }
      const category = url.searchParams.get("category") || undefined;
      if (category && category !== "None" && !/^[0-9a-f-]{36}$/i.test(category)) {
        return apiError(id, 400, "INVALID_CATEGORY", "Category must be a MangaDex tag ID.");
      }
      const result = await withTimeout(mangaApi.list({ page, type, state, category }));
      return json(result, 200, "public, s-maxage=300, stale-while-revalidate=3600", id);
    }

    if (endpoint === "title" && path.length === 2 && first && isValidId(first)) {
      if (!hasOnlyParams(url, [])) {
        return apiError(id, 400, "UNKNOWN_PARAMETER", "This endpoint does not accept query parameters.");
      }
      const result = await withTimeout(mangaApi.details(first));
      return json(result, 200, "public, s-maxage=300, stale-while-revalidate=3600", id);
    }

    if (endpoint === "chapter" && path.length === 3 && first && second && isValidId(first) && isValidId(second)) {
      if (!hasOnlyParams(url, [])) {
        return apiError(id, 400, "UNKNOWN_PARAMETER", "This endpoint does not accept query parameters.");
      }
      const result = await withTimeout(mangaApi.pages(first, second));
      return json(result, 200, "public, s-maxage=300, stale-while-revalidate=3600", id);
    }

    return apiError(id, 404, "MANGA_ENDPOINT_NOT_FOUND", "Manga endpoint not found.");
  } catch (error) {
    const rawStatus = (error as { status?: number })?.status;
    const status = rawStatus === 400 || rawStatus === 404 || rawStatus === 429
      ? rawStatus
      : errorMessage(error, "").includes("MANGA_UPSTREAM_TIMEOUT")
        ? 504
        : 502;
    const code = status === 400
      ? "INVALID_MANGA_REQUEST"
      : status === 404
        ? "MANGA_NOT_FOUND_OR_NOT_SAFE"
        : status === 504
          ? "MANGA_UPSTREAM_TIMEOUT"
          : status === 429
            ? "MANGA_RATE_LIMITED"
            : "MANGA_PROVIDER_UNAVAILABLE";
    const message = status === 400
      ? errorMessage(error, "Invalid manga request.")
      : status === 404
        ? "Manga details or chapter pages are unavailable or not rated Safe."
        : status === 504
          ? "The manga provider took too long to respond."
          : status === 429
            ? "The manga provider is rate limiting requests. Try again shortly."
            : "The manga provider is temporarily unavailable.";
    return apiError(id, status, code, message);
  }
}
