export const runtime = "edge";

function error(message: string, status: number, asHtml = false) {
  if (asHtml) {
    return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>AniFox downloads</title><body style="margin:0;background:#101014;color:#f7f5f5;font:16px system-ui;display:grid;min-height:100vh;place-items:center"><main style="max-width:32rem;padding:2rem;text-align:center"><h1>AniFox downloads</h1><p>${message}</p></main></body></html>`, {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

function numericId(value: string | null) {
  return value && /^\d{1,16}$/.test(value) && Number(value) > 0 ? value : null;
}

function seasonNumber(value: string | null) {
  return value && /^\d{1,3}$/.test(value) ? String(Number(value)) : "1";
}

export async function GET(request: Request) {
  const providerBase = process.env.DOWNLOAD_PROVIDER_URL?.trim();
  const params = new URL(request.url).searchParams;
  const type = params.get("type");
  const tmdb = numericId(params.get("tmdbId"));
  const anilist = numericId(params.get("anilistId"));
  const episode = numericId(params.get("episode")) ?? "1";
  const season = seasonNumber(params.get("season"));

  if (!providerBase) {
    return error("A licensed download provider has not been configured for this AniFox deployment.", 503, true);
  }

  let base: URL;
  try {
    base = new URL(providerBase);
  } catch {
    return error("The download provider URL is invalid.", 503);
  }
  if (
    base.protocol !== "https:" ||
    base.pathname !== "/" ||
    base.username ||
    base.password ||
    base.search ||
    base.hash
  ) {
    return error("The download provider URL must be a valid HTTPS origin.", 503);
  }

  let path: string | null = null;
  if (type === "movie" && tmdb) path = `/movie/${tmdb}`;
  if (type === "tv" && tmdb) path = `/tv/${tmdb}/${season}/${episode}`;
  if (type === "anime" && anilist) path = `/anime/${anilist}/${episode}`;
  if (!path) return error("The title does not have an ID supported by the download provider.", 400, true);

  const root = base.href.endsWith("/") ? base : new URL(`${base.href}/`);
  return new Response(null, {
    status: 307,
    headers: {
      Location: new URL(path.slice(1), root).href,
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
