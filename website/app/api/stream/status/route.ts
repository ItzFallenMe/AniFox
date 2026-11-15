export const runtime = "nodejs";

const API_VERSION = "1";

const PROVIDERS = [
  { id: "vidly", name: "Vidly", host: "vidly.pro", mediaTypes: ["movie", "tv", "anime"], supportsMalId: true },
  { id: "vidbolt", name: "VidBolt", host: "vidbolt.xyz", mediaTypes: ["movie", "tv", "anime"], supportsMalId: true },
  { id: "vidy", name: "Vidy", host: "vidy.st", mediaTypes: ["movie", "tv", "anime"], supportsMalId: false },
  { id: "embedwave", name: "EmbedWave", host: "embedwave.cc", mediaTypes: ["movie", "tv"], supportsMalId: false },
] as const;

/**
 * Reports AniFox's local provider configuration.
 * This endpoint deliberately does not probe third-party hosts or claim uptime.
 */
export async function GET() {
  const id = crypto.randomUUID();

  return Response.json(
    {
      data: {
        service: "AniFox Stream API",
        status: "operational",
        apiVersion: API_VERSION,
        providers: PROVIDERS.map((provider) => ({
          ...provider,
          status: "configured",
        })),
      },
      meta: {
        requestId: id,
        apiVersion: API_VERSION,
        generatedAt: new Date().toISOString(),
        statusMeaning: "configured means AniFox has a provider entry; it does not indicate third-party availability.",
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "X-Content-Type-Options": "nosniff",
        "X-Request-Id": id,
        "X-AniFox-API-Version": API_VERSION,
      },
    },
  );
}
