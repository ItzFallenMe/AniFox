const CACHE_SECONDS = 120;

const ALLOWED_PARAMS = new Set([
  "type",
  "tmdbId",
  "anilistId",
  "malId",
  "season",
  "episode",
]);

const ALLOWED_TYPES = new Set(["movie", "tv", "anime"]);

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/**
 * Server-side proxy for the optional download provider.
 *
 * The provider base URL and key are operator configuration; nothing here is
 * tied to a specific host. See website/README.md for the expected contract.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const baseUrl = process.env.DOWNLOAD_API_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    return jsonError("Downloads are not configured on this deployment.", 503);
  }

  const { path } = await context.params;
  if (path.length !== 1 || path[0] !== "downloads") {
    return jsonError("Download endpoint not found.", 404);
  }

  let target: URL;
  try {
    target = new URL(`${baseUrl}/downloads`);
  } catch {
    return jsonError("The download provider URL is invalid.", 503);
  }

  const incoming = new URL(request.url);
  for (const [key, value] of incoming.searchParams) {
    if (!ALLOWED_PARAMS.has(key)) continue;
    if (key === "type" && !ALLOWED_TYPES.has(value)) continue;
    if (key !== "type" && !/^\d{1,12}$/.test(value)) continue;
    target.searchParams.set(key, value);
  }

  if (!target.searchParams.get("type")) {
    return jsonError("A media type is required.", 400);
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  const apiKey = process.env.DOWNLOAD_API_KEY?.trim();
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const response = await fetch(target, { headers, next: { revalidate: CACHE_SECONDS } });
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json; charset=utf-8",
        "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=600`,
      },
    });
  } catch {
    return jsonError("The download provider could not be reached.", 502);
  }
}
