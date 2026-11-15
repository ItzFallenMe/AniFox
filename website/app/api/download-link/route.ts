export const runtime = "nodejs";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,4096}$/;
const API_VERSION = "1";

function requestId() {
  return crypto.randomUUID();
}

function error(id: string, message: string, status: number, code: string) {
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
  if ([...params.keys()].some((key) => key !== "token")) {
    return error(id, "Unknown query parameter.", 400, "UNKNOWN_PARAMETER");
  }
  if (params.getAll("token").length !== 1) {
    return error(id, "A single download token is required.", 400, "INVALID_TOKEN");
  }

  const provider = getProviderOrigin();
  if (!provider) return error(id, "Download links are not configured.", 503, "DOWNLOAD_PROVIDER_NOT_CONFIGURED");

  const token = params.get("token") ?? "";
  if (!TOKEN_PATTERN.test(token)) return error(id, "This download link is invalid.", 400, "INVALID_TOKEN");

  const target = new URL("/get", provider);
  target.searchParams.set("t", token);
  return new Response(null, {
    status: 307,
    headers: {
      Location: target.href,
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Content-Type-Options": "nosniff",
      "X-Request-Id": id,
      "X-AniFox-API-Version": API_VERSION,
    },
  });
}
