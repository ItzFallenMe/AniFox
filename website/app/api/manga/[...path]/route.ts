// The shared manga adapters are packaged with this monorepo and execute in
// this route; they are not a separately deployed service.
import mangaApi from "../../../../../server/anifox-manga-api/server/sources.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
};

function json(data: unknown, status = 200, cache = "no-store") {
  return Response.json(data, {
    status,
    headers: { ...commonHeaders, "Cache-Control": cache },
  });
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function isValidId(value: string) {
  return /^[A-Za-z0-9_-]{1,220}$/.test(value);
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: commonHeaders });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const url = new URL(request.url);
  const [endpoint, first, second] = path;

  try {
    if (endpoint === "sources" && path.length === 1) {
      return json(await mangaApi.listSources(), 200, "public, s-maxage=300, stale-while-revalidate=3600");
    }

    if (endpoint === "search" && path.length === 1) {
      const query = url.searchParams.get("query")?.trim() ?? "";
      if (!query) return json({ error: "Enter a manga title to search for." }, 400);
      if (query.length > 100) return json({ error: "Search titles must be 100 characters or less." }, 400);
      const source = url.searchParams.get("source") || "all";
      const result = await searchManga({
        query,
        page: Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1,
        source,
      });
      return json(result);
    }

    if (endpoint === "catalog" && path.length === 1) {
      const result = await mangaApi.list({
        page: url.searchParams.get("page") || 1,
        type: url.searchParams.get("type") || "latest",
        state: url.searchParams.get("state") || undefined,
        category: url.searchParams.get("category") || undefined,
      });
      return json(result, 200, "public, s-maxage=300, stale-while-revalidate=3600");
    }

    if (endpoint === "title" && path.length === 2 && first && isValidId(first)) {
      return json(await mangaApi.details(first), 200, "public, s-maxage=300, stale-while-revalidate=3600");
    }

    if (endpoint === "chapter" && path.length === 3 && first && second && isValidId(first) && isValidId(second)) {
      const result = await mangaApi.pages(first, second);
      return json(result, 200, "public, s-maxage=300, stale-while-revalidate=3600");
    }

    return json({ error: "Manga endpoint not found." }, 404);
  } catch (error) {
    const status = Number.isInteger((error as { status?: number })?.status)
      ? (error as { status: number }).status
      : /not found/i.test(errorMessage(error, ""))
        ? 404
        : 502;
    const message = status === 400
      ? errorMessage(error, "Invalid manga request.")
      : status === 404
        ? "Manga details or chapter pages are unavailable."
        : "The manga provider is temporarily unavailable.";
    return json({ error: message }, status);
  }
}
