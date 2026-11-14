export const runtime = "nodejs";

const ALLOWED_IMAGE_DOMAINS = [
  "mangadex.org",
  "mangadex.network",
];
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, {
    status,
    headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
  });
}

function allowed(url: URL) {
  return url.protocol === "https:" &&
    !url.username && !url.password && (!url.port || url.port === "443") &&
    ALLOWED_IMAGE_DOMAINS.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`));
}

function refererFor(url: URL) {
  if (
    url.hostname === "mangadex.org" ||
    url.hostname.endsWith(".mangadex.org") ||
    url.hostname === "mangadex.network" ||
    url.hostname.endsWith(".mangadex.network")
  ) {
    return "https://mangadex.org/";
  }
  return "https://mangadex.org/";
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" },
  });
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url");
  if (!raw || raw.length > 4096) return jsonError("A valid manga image URL is required.", 400);

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return jsonError("The manga image URL is invalid.", 400);
  }
  if (!allowed(target)) return jsonError("This image host is not allowed.", 403);

  try {
    let response: Response | undefined;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      response = await fetch(target, {
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          Referer: refererFor(target),
          "User-Agent": "AniFox/1.0 (+https://github.com/ItzFallenMe/AniFox)",
        },
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
      });
      if (response.status < 300 || response.status >= 400) break;
      const location = response.headers.get("location");
      if (!location) return jsonError("The manga image provider returned an invalid redirect.", 502);
      target = new URL(location, target);
      if (!allowed(target)) return jsonError("The manga image provider redirected to a disallowed host.", 403);
    }

    if (!response || response.status >= 300) return jsonError("The manga image provider is unavailable.", 502);
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("image/")) return jsonError("The provider did not return an image.", 502);
    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) return jsonError("The manga image is too large.", 413);

    let bytes = 0;
    const limitedBody = response.body?.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        bytes += chunk.byteLength;
        if (bytes > MAX_IMAGE_BYTES) throw new Error("Image exceeds size limit");
        controller.enqueue(chunk);
      },
    }));
    return new Response(limitedBody, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return jsonError("The manga image provider could not be reached.", 502);
  }
}
