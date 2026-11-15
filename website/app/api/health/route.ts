export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_VERSION = "1";

/**
 * Reports local API process/configuration state only.
 * This endpoint does not probe upstream vendors or expose secret values.
 */
export async function GET() {
  const id = crypto.randomUUID();
  const checks = {
    tmdbConfigured: Boolean(process.env.TMDB_API_KEY?.trim()),
    mangaConfigured: true,
    streamProvidersConfigured: true,
    downloadProviderConfigured: Boolean(process.env.DOWNLOAD_PROVIDER_URL?.trim()),
  };

  return Response.json(
    {
      data: {
        service: "AniFox API",
        status: "operational",
        version: API_VERSION,
        checks,
      },
      meta: {
        requestId: id,
        generatedAt: new Date().toISOString(),
        statusMeaning: "Configuration checks only; upstream service availability is not tested.",
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "X-Request-Id": id,
        "X-AniFox-API-Version": API_VERSION,
      },
    },
  );
}
