export const runtime = "edge";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,4096}$/;

function error(message: string, status: number) {
  return Response.json({ error: message }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  const configuredProvider = process.env.DOWNLOAD_PROVIDER_URL?.trim();
  if (!configuredProvider) return error("Download links are not configured.", 503);

  let provider: URL;
  try {
    provider = new URL(configuredProvider);
  } catch {
    return error("The download provider URL is invalid.", 503);
  }
  if (
    provider.protocol !== "https:" ||
    provider.pathname !== "/" ||
    provider.username ||
    provider.password ||
    provider.search ||
    provider.hash
  ) {
    return error("The download provider URL must be a valid HTTPS origin.", 503);
  }

  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!TOKEN_PATTERN.test(token)) return error("This download link is invalid.", 400);

  const target = new URL("/get", provider);
  target.searchParams.set("t", token);
  return new Response(null, {
    status: 307,
    headers: {
      Location: target.href,
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
}
