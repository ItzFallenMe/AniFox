export const runtime = "nodejs";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,4096}$/;
const MAX_LINKS = 100;
const MAX_HTML_BYTES = 3 * 1024 * 1024;
const API_VERSION = "1";
const REQUEST_TIMEOUT_MS = 15_000;
const API_VERSION = "1";

interface DownloadLink {
  quality: string;
  source: string;
  details: string;
  size: string;
  href: string;
}

function requestId() {
  return crypto.randomUUID();
}

function jsonError(id: string, message: string, status: number, code: string) {
  return Response.json(
    { error: message, code, requestId: id, meta: { apiVersion: API_VERSION } },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Request-Id": id,
        "X-AniFox-API-Version": API_VERSION,
      },
    },
  );
}

function numericId(value: string | null) {
  return value && /^\d{1,16}$/.test(value) && /[1-9]/.test(value) ? value : null;
}

function seasonNumber(value: string | null) {
  if (value === null) return "1";
  if (!/^\d{1,3}$/.test(value)) return null;
  return String(Number(value));
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
  ).replace(/\s+/g, " ").trim();
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
      target = new URL(decodeHtml(href), providerOrigin);
    } catch {
      continue;
    }
    if (
      target.protocol !== "https:" ||
      target.origin !== providerOrigin ||
      target.pathname !== "/get" ||
      [...target.searchParams.keys()].some((key) => key !== "t") ||
      target.searchParams.getAll("t").length !== 1
    ) continue;

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

async function readLimitedText(response: Response) {
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_HTML_BYTES) {
    throw new Error("DOWNLOAD_RESPONSE_TOO_LARGE");
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let output = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_HTML_BYTES) {
      await reader.cancel();
      throw new Error("DOWNLOAD_RESPONSE_TOO_LARGE");
    }
    output += decoder.decode(value, { stream: true });
  }
  return output + decoder.decode();
}

function getProviderOrigin(): URL | null {
  const configured = process.env.DOWNLOAD_PROVIDER_URL?.trim();
  if (!configured) return null;
  try {
    const provider = new URL(configured);
    if (
      provider.protocol !== "https:" ||
      provider.pathname !== "/" ||
      provider.username ||
      provider.password ||
      provider.search ||
      provider.hash ||
      provider.port
    ) return null;
    return provider;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const id = requestId();
  const params = new URL(request.url).searchParams;
  const allowed = new Set(["type", "tmdbId", "anilistId", "episode", "season"]);
  for (const key of params.keys()) {
    if (!allowed.has(key)) return jsonError(id, `Unknown query parameter: ${key}`, 400, "UNKNOWN_PARAMETER");
    if (params.getAll(key).length > 1) return jsonError(id, `Query parameter ${key} must appear once.`, 400, "DUPLICATE_PARAMETER");
  }

  const provider = getProviderOrigin();
  if (!provider) {
    return jsonError(id, "Download links are not configured with a valid HTTPS provider origin.", 503, "DOWNLOAD_PROVIDER_NOT_CONFIGURED");
  }

  const type = params.get("type");
  const tmdb = numericId(params.get("tmdbId"));
  const anilist = numericId(params.get("anilistId"));
  const episode = params.has("episode") ? numericId(params.get("episode")) : "1";
  const season = seasonNumber(params.get("season"));

  if ((params.has("tmdbId") && !tmdb) || (params.has("anilistId") && !anilist) ||
      (params.has("episode") && !episode) || season === null) {
    return jsonError(id, "One or more media IDs or episode values are invalid.", 400, "INVALID_MEDIA_ID");
  }

  let path: string | null = null;
  if (type === "movie" && tmdb && !params.has("anilistId")) path = `/movie/${tmdb}`;
  if (type === "tv" && tmdb && episode && !params.has("anilistId")) path = `/tv/${tmdb}/${season}/${episode}`;
  if (type === "anime" && anilist && episode && !params.has("tmdbId")) path = `/anime/${anilist}/${episode}`;
  if (!path) return jsonError(id, "The title does not have an ID supported by the download provider.", 400, "UNSUPPORTED_MEDIA_REQUEST");

  try {
    const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const response = await fetch(new URL(path.slice(1), provider), {
      headers: { Accept: "text/html" },
      cache: "no-store",
      redirect: "manual",
      signal,
    });
    // Redirects are deliberately not followed: provider responses must come
    // from the configured origin, preventing server-side redirect pivots.
    if (response.status >= 300 && response.status < 400) {
      return jsonError(id, "The download provider redirected unexpectedly.", 502, "DOWNLOAD_PROVIDER_REDIRECT");
    }

    if (!response.ok || !(response.headers.get("content-type") ?? "").toLowerCase().includes("text/html")) {
      return jsonError(id, "The download provider could not load links for this title.", 502, "DOWNLOAD_PROVIDER_BAD_RESPONSE");
    }

    const html = await readLimitedText(response);
    const links = parseLinks(html, provider.origin);
    return Response.json(
      { links },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "X-Request-Id": id,
          "X-AniFox-API-Version": API_VERSION,
        },
      },
    );
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === "DOWNLOAD_RESPONSE_TOO_LARGE";
    return jsonError(
      id,
      tooLarge ? "The download provider response exceeded the size limit." : timedOut ? "The download provider timed out." : "The download provider could not be reached. Please try again.",
      tooLarge ? 413 : 502,
      tooLarge ? "DOWNLOAD_RESPONSE_TOO_LARGE" : timedOut ? "DOWNLOAD_PROVIDER_TIMEOUT" : "DOWNLOAD_PROVIDER_UNAVAILABLE",
    );
  }
}
