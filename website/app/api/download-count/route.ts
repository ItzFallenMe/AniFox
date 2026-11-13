const RELEASES_URL = "https://api.github.com/repos/ItzFallenMe/AniFox/releases?per_page=100";
const MAX_RELEASE_PAGES = 10;

export const revalidate = 3600;

interface GitHubRelease {
  assets?: Array<{ name?: string; download_count?: number }>;
}

const APP_PACKAGE_PATTERN =
  /^(?:anifox-.*\.(?:apk|aab|ipa|zip|dmg|msi|tar\.gz)|(?:windows|linux|macos)\.zip)$/i;

export async function GET() {
  let nextUrl: string | null = RELEASES_URL;
  let totalDownloads = 0;
  let pages = 0;

  try {
    while (nextUrl && pages < MAX_RELEASE_PAGES) {
      const response: Response = await fetch(nextUrl, {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        return Response.json(
          { error: "Release download counts are temporarily unavailable." },
          { status: 502 },
        );
      }

      const releases = (await response.json()) as GitHubRelease[];
      totalDownloads += releases.reduce(
        (releaseTotal, release) =>
          releaseTotal +
          (release.assets ?? [])
            .filter((asset) => APP_PACKAGE_PATTERN.test(asset.name ?? ""))
            .reduce((assetTotal, asset) => assetTotal + (asset.download_count ?? 0), 0),
        0,
      );

      pages += 1;
      const linkHeader = response.headers.get("link") ?? "";
      const nextLink = linkHeader
        .split(",")
        .find((part) => part.includes('rel="next"'));
      nextUrl = nextLink?.match(/<([^>]+)>/)?.[1] ?? null;
    }

    return Response.json(
      { totalDownloads, source: "GitHub app release packages" },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return Response.json(
      { error: "Release download counts are temporarily unavailable." },
      { status: 502 },
    );
  }
}
