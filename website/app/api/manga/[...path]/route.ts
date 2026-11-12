const CACHE_SECONDS = 300;

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function appendPath(base: string, suffix: string) {
  const url = new URL(base);
  const prefix = url.pathname.replace(/\/+$/, "");
  url.pathname = `${prefix}${suffix}`;
  url.search = "";
  return url;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const apiUrl = process.env.MANGA_API_URL?.trim().replace(/\/+$/, "");
  if (!apiUrl) {
    return jsonError("Manga is not configured on this deployment yet.", 503);
  }

  let base: string;
  try {
    base = apiUrl.endsWith("/api") ? apiUrl : `${apiUrl}/api`;
    new URL(base);
  } catch {
    return jsonError("The manga API URL is invalid.", 503);
  }

  const { path } = await context.params;
  const url = new URL(request.url);
  let target: URL;

  if (path.length === 1 && path[0] === "search") {
    const query = url.searchParams.get("query")?.trim();
    if (!query) return jsonError("Enter a title to search for.", 400);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    target = appendPath(base, `/search/${encodeURIComponent(query)}`);
    target.searchParams.set("page", String(page));
  } else if (path.length === 1 && path[0] === "catalog") {
    target = appendPath(base, "/mangaList");
    for (const key of ["category", "type", "state", "page"]) {
      const value = url.searchParams.get(key);
      if (value) target.searchParams.set(key, value.slice(0, 80));
    }
  } else if (path.length === 2 && path[0] === "title") {
    if (!/^[\w-]{1,180}$/.test(path[1])) return jsonError("Invalid manga id.", 400);
    target = appendPath(base, `/manga/${encodeURIComponent(path[1])}`);
  } else if (path.length === 3 && path[0] === "chapter") {
    if (!/^[\w-]{1,180}$/.test(path[1]) || !/^[\w-]{1,180}$/.test(path[2])) {
      return jsonError("Invalid chapter id.", 400);
    }
    target = appendPath(base, `/manga/${encodeURIComponent(path[1])}/${encodeURIComponent(path[2])}`);
  } else {
    return jsonError("Manga endpoint not found.", 404);
  }

  try {
    const response = await fetch(target, {
      headers: { Accept: "application/json" },
      next: { revalidate: CACHE_SECONDS },
    });
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json; charset=utf-8",
        "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=3600`,
      },
    });
  } catch {
    return jsonError("The manga service could not be reached. Please try again later.", 502);
  }
}
