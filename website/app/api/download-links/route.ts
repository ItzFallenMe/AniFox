export const runtime = "nodejs";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,4096}$/;
const MAX_LINKS = 100;

interface DownloadLink {
  quality: string;
  source: string;
  details: string;
  size: string;
  href: string;
}

function jsonError(message: string, status: number) {
  return Response.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function numericId(value: string | null) {
  return value && /^\d{1,16}$/.test(value) && Number(value) > 0 ? value : null;
}

function seasonNumber(value: string | null) {
  return value && /^\d{1,3}$/.test(value) ? String(Number(value)) : "1";
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => {
      const point = Number(code);
      return point <= 0x10ffff ? String.fromCodePoint(point) : "";
    })
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => {
      const point = Number.parseInt(code, 16);
      return point <= 0x10ffff ? String.fromCodePoint(point) : "";
    });
}

function textContent(html: string) {
  return decodeHtml(
    html
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--([\s\S]*?)-->/g, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function spanText(html: string, className: RegExp) {
  for (const match of html.matchAll(/<span\b([^>]*)>([^<]*)<\/span>/gi)) {
    if (!className.test(match[1])) continue;
    const text = textContent(match[2]);
    if (text) return text;
  }
  return "";
}

function parseLinks(html: string, providerOrigin: string): DownloadLink[] {
  const links: DownloadLink[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)) {
    const anchor = match[0];
    const openingTag = anchor.slice(0, anchor.indexOf(">") + 1);
    const href = openingTag.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2];
    if (!href) continue;

    let target: URL;
    try {
      target = new URL(href, providerOrigin);
    } catch {
      continue;
    }
    if (target.origin !== providerOrigin || target.pathname !== "/get") continue;

    const token = target.searchParams.get("t");
    if (!token || !TOKEN_PATTERN.test(token) || seen.has(token)) continue;
    seen.add(token);

    const body = anchor.slice(openingTag.length, anchor.lastIndexOf("</a>"));
    links.push({
      quality: (spanText(body, /font-extrabold/) || "Download").slice(0, 24),
      source: (spanText(body, /font-semibold/) || "Download source").slice(0, 96),
      details: spanText(body, /leading-snug/).slice(0, 160),
      size: spanText(body, /text-white\/40/).slice(0, 48),
      href: `/api/download-link?token=${encodeURIComponent(token)}`,
    });
    if (links.length >= MAX_LINKS) break;
  }

  return links;
}

export async function GET(request: Request) {
  const configuredProvider = process.env.DOWNLOAD_PROVIDER_URL?.trim();
  if (!configuredProvider) {
    return jsonError("Download links are not configured on this AniFox deployment.", 503);
  }

  let provider: URL;
  try {
    provider = new URL(configuredProvider);
  } catch {
    return jsonError("The download provider URL is invalid.", 503);
  }
  if (
    provider.protocol !== "https:" ||
    provider.pathname !== "/" ||
    provider.username ||
    provider.password ||
    provider.search ||
    provider.hash
  ) {
    return jsonError("The download provider URL must be a valid HTTPS origin.", 503);
  }

  const params = new URL(request.url).searchParams;
  const type = params.get("type");
  const tmdb = numericId(params.get("tmdbId"));
  const anilist = numericId(params.get("anilistId"));
  const episode = numericId(params.get("episode")) ?? "1";
  const season = seasonNumber(params.get("season"));

  let path: string | null = null;
  if (type === "movie" && tmdb) path = `/movie/${tmdb}`;
  if (type === "tv" && tmdb) path = `/tv/${tmdb}/${season}/${episode}`;
  if (type === "anime" && anilist) path = `/anime/${anilist}/${episode}`;
  if (!path) return jsonError("The title does not have an ID supported by the download provider.", 400);

  try {
    const response = await fetch(new URL(path.slice(1), provider), {
      headers: { Accept: "text/html" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) {
      return jsonError("The download provider could not load links for this title.", 502);
    }

    const html = await response.text();
    const links = parseLinks(html, provider.origin);
    return Response.json(
      { links },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return jsonError("The download provider could not be reached. Please try again.", 502);
  }
}
