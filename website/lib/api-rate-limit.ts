import { getCloudflareContext } from "@opennextjs/cloudflare";

type RateLimitBinding = {
  limit(input: { key: string; delta?: number }): Promise<{ success: boolean }>;
};

const API_VERSION = "1";

/**
 * Applies a shared Cloudflare Worker rate limit when the binding is present.
 * Client addresses are hashed before being used as keys and are not persisted
 * by AniFox. Local Next.js development gracefully skips the Cloudflare binding.
 */
export async function enforceApiRateLimit(
  request: Request,
  requestId: string,
  route: string,
  weight = 1,
): Promise<Response | null> {
  let limiter: RateLimitBinding | undefined;

  try {
    const context = await getCloudflareContext({ async: true });
    const env = context.env as unknown as Record<string, unknown>;
    limiter = env.ANIFOX_API_LIMITER as RateLimitBinding | undefined;
  } catch {
    // Next.js local development does not have Worker bindings.
    return null;
  }

  if (!limiter || typeof limiter.limit !== "function") return null;

  // Cloudflare supplies this header at its edge. Do not trust generic
  // X-Forwarded-For values that clients can forge.
  const clientAddress = request.headers.get("cf-connecting-ip")?.trim();
  if (!clientAddress) return null;

  try {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(clientAddress),
    );
    const hash = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    const result = await limiter.limit({
      key: `anifox-api:${route}:${hash}`,
      delta: Math.max(1, Math.min(10, Math.floor(weight))),
    });

    if (result.success) return null;

    return Response.json(
      {
        error: "Too many requests. Please wait before trying again.",
        code: "RATE_LIMITED",
        requestId,
        meta: { apiVersion: API_VERSION },
      },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "application/json; charset=utf-8",
          "Retry-After": "60",
          "X-Content-Type-Options": "nosniff",
          "X-Request-Id": requestId,
          "X-AniFox-API-Version": API_VERSION,
        },
      },
    );
  } catch {
    // A transient rate-limit service error should not take the whole API down.
    return null;
  }
}
