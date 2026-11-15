export const runtime = "nodejs";

const ALLOWED_IMAGE_DOMAINS = ["mangadex.org", "mangadex.network"];
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 15_000;
const API_VERSION = "1";

function requestId() {
  return crypto.randomUUID();
}

function jsonError(id: string, message: string, status: number, code: string) {
  return Response.json(
    { error: message, code, requestId: id, meta: { apiVersion: API_VERSION } },
    {
      status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Request-Id": id,
        "X-AniFox-API-Version": API_VERSION,
      },
    },
  );
}

function allowed(url: URL) {
  return url.protocol === "https:" &&
    !url.username && !url.password && (!url.port || url.port === "443") &&
    ALLOWED_IMAGE_DOMAINS.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`));
}

async function readLimitedBytes(response: Response): Promise<Uint8Array> {
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_IMAGE_BYTES) {
    throw new Error("IMAGE_TOO_LARGE");
  }
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_IMAGE_BYTES) {
      await reader.cancel();
      throw new Error("IMAGE_TOO_LARGE");
    }
    chunks.push(value);
  }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Accept",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function GET(request: Request) {
  const id = requestId();
  const params = new URL(request.url).searchParams;
  if ([...params.keys()].some((key) => key !== "url")) {
    return jsonError(id, "Unknown query parameter.", 400, "UNKNOWN_PARAMETER");
  }
  if (params.getAll("url").length !== 1) {
    return jsonError(id, "A single manga image URL is required.", 400, "INVALID_IMAGE_URL");
  }

  const raw = params.get("url");
  if (!raw || raw.length > 4096) return jsonError(id, "A valid manga image URL is required.", 400, "INVALID_IMAGE_URL");

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return jsonError(id, "The manga image URL is invalid.", 400, "INVALID_IMAGE_URL");
  }
  if (!allowed(target)) return jsonError(id, "This image host is not allowed.", 403, "IMAGE_HOST_NOT_ALLOWED");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    let response: Response | undefined;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      response = await fetch(target, {
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/*",
          Referer: "https://mangadex.org/",
          "User-Agent": "AniFox/1.0 (+https://github.com/ItzFallenMe/AniFox)",
        },
        redirect: "manual",
        signal: controller.signal,
      });

      if (response.status < 300 || response.status >= 400) break;
      const location = response.headers.get("location");
      if (!location) return jsonError(id, "The manga image provider returned an invalid redirect.", 502, "IMAGE_REDIRECT_INVALID");
      target = new URL(location, target);
      if (!allowed(target)) return jsonError(id, "The manga image provider redirected to a disallowed host.", 403, "IMAGE_REDIRECT_BLOCKED");
    }

    if (!response || response.status >= 300) {
      return jsonError(id, "The manga image provider is unavailable.", 502, "IMAGE_PROVIDER_UNAVAILABLE");
    }
    if (!response.ok) {
      return jsonError(id, "The manga image provider could not return this image.", 502, "IMAGE_PROVIDER_ERROR");
    }

    const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      return jsonError(id, "The provider did not return a supported raster image.", 502, "INVALID_IMAGE_CONTENT_TYPE");
    }

    const bytes = await readLimitedBytes(response);
    return new Response(bytes, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": contentType,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
        "X-Request-Id": id,
        "X-AniFox-API-Version": API_VERSION,
      },
    });
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === "IMAGE_TOO_LARGE";
    const timedOut = controller.signal.aborted;
    return jsonError(
      id,
      tooLarge ? "The manga image is too large." : timedOut ? "The image provider timed out." : "The manga image provider could not be reached.",
      tooLarge ? 413 : 502,
      tooLarge ? "IMAGE_TOO_LARGE" : timedOut ? "IMAGE_PROVIDER_TIMEOUT" : "IMAGE_PROVIDER_UNAVAILABLE",
    );
  } finally {
    clearTimeout(timeout);
  }
}
