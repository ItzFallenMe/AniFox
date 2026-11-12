const TMDB_BASE = "https://api.themoviedb.org/3";
const CACHE_SECONDS = 1800;

const ALLOWED_QUERY_KEYS = new Set([
  "append_to_response",
  "include_adult",
  "language",
  "page",
  "query",
]);

function isAllowedPath(path: string) {
  return (
    /^\/trending\/all\/(day|week)$/.test(path) ||
    /^\/search\/multi$/.test(path) ||
    /^\/movie\/(popular|top_rated|upcoming|now_playing|\d+)$/.test(path) ||
    /^\/tv\/(popular|top_rated|airing_today|on_the_air|\d+)$/.test(path) ||
    /^\/tv\/\d+\/season\/\d+$/.test(path)
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const apiKey = process.env.TMDB_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      { message: "TMDB metadata is not configured on this deployment." },
      { status: 503 },
    );
  }

  const { path: segments } = await context.params;
  const path = `/${segments.join("/")}`;
  if (!isAllowedPath(path)) {
    return Response.json({ message: "TMDB endpoint not found." }, { status: 404 });
  }

  const sourceUrl = new URL(`${TMDB_BASE}${path}`);
  const requestUrl = new URL(request.url);
  for (const [name, value] of requestUrl.searchParams) {
    if (!ALLOWED_QUERY_KEYS.has(name)) continue;
    if (
      name === "append_to_response" &&
      !/^(credits|external_ids|release_dates|content_ratings)(,(credits|external_ids|release_dates|content_ratings))*$/.test(
        value,
      )
    ) {
      continue;
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
      next: { revalidate: CACHE_SECONDS },
    });
    return new Response(response.body, {
      status: response.status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch {
    return Response.json({ message: "TMDB could not be reached." }, { status: 502 });
  }
}
