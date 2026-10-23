import { NextResponse } from 'next/server';

/**
 * `/api/release` → the newest APK asset on GitHub.
 *
 * Download buttons point here instead of a hard-coded asset URL, so a new tag
 * is picked up automatically. Falls back to the release page when no APK asset
 * exists (or GitHub is unreachable), never to a dead link.
 */
export const revalidate = 600;

const REPO = 'ItzFallenMe/AniFox';
const FALLBACK = `https://github.com/${REPO}/releases/latest`;

interface ReleaseAsset {
  name?: string;
  browser_download_url?: string;
}

interface Release {
  html_url?: string;
  assets?: ReleaseAsset[];
}

export async function GET() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          ...(process.env.GITHUB_TOKEN
            ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
            : {}),
        },
        next: { revalidate },
      },
    );

    if (!response.ok) {
      return NextResponse.redirect(FALLBACK, 307);
    }

    const release = (await response.json()) as Release;
    const apks = (release.assets ?? []).filter(asset =>
      asset.name?.toLowerCase().endsWith('.apk'),
    );
    // Releases can carry per-ABI APKs; universal (or arm64) is the safest pick.
    const apk =
      apks.find(asset => /universal/i.test(asset.name ?? '')) ??
      apks.find(asset => /arm64/i.test(asset.name ?? '')) ??
      apks[0];

    const target = apk?.browser_download_url ?? release.html_url ?? FALLBACK;
    return NextResponse.redirect(target, 307);
  } catch {
    return NextResponse.redirect(FALLBACK, 307);
  }
}
