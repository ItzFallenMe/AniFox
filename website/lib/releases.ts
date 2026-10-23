const REPO = 'ItzFallenMe/AniFox';
const API = `https://api.github.com/repos/${REPO}/releases`;

export interface ApkAsset {
  name: string;
  size: number;
  downloadUrl: string;
  architecture: string;
}

export interface ReleaseInfo {
  tag: string;
  version: string;
  name: string;
  notes: string;
  publishedAt: string | null;
  htmlUrl: string;
  apks: ApkAsset[];
  /** True when the data came from GitHub rather than the offline fallback. */
  live: boolean;
}

interface RawAsset {
  name?: string;
  size?: number;
  browser_download_url?: string;
}

interface RawRelease {
  tag_name?: string;
  name?: string;
  body?: string;
  html_url?: string;
  published_at?: string;
  draft?: boolean;
  prerelease?: boolean;
  assets?: RawAsset[];
}

const architectureOf = (name: string): string => {
  if (/universal|all-abi/i.test(name)) return 'Universal';
  if (/arm64|aarch64/i.test(name)) return 'ARM64';
  if (/armeabi|armv7/i.test(name)) return 'ARMv7';
  if (/x86_64|x64/i.test(name)) return 'x86_64';
  if (/x86/i.test(name)) return 'x86';
  return 'Android';
};

const toRelease = (raw: RawRelease): ReleaseInfo | null => {
  if (!raw.tag_name || !raw.html_url) return null;

  const apks = (raw.assets ?? [])
    .filter(asset => asset.name?.toLowerCase().endsWith('.apk'))
    // `app-release.apk` is the universal build under a plain name, published
    // for direct links. Listing it again would only duplicate the picker.
    .filter(asset => !/^app-release\.apk$/i.test(asset.name ?? ''))
    .map(asset => ({
      name: asset.name as string,
      size: asset.size ?? 0,
      downloadUrl: asset.browser_download_url ?? raw.html_url!,
      architecture: architectureOf(asset.name as string),
    }));

  return {
    tag: raw.tag_name,
    version: raw.tag_name.replace(/^v/i, ''),
    name: raw.name ?? raw.tag_name,
    notes: (raw.body ?? '').trim(),
    publishedAt: raw.published_at ?? null,
    htmlUrl: raw.html_url,
    apks,
    live: true,
  };
};

/**
 * Newest releases, newest first. Runs on the server (page render and the
 * `/api/releases` route); never called from the browser, so the optional
 * `GITHUB_TOKEN` stays private.
 */
export const getReleases = async (): Promise<ReleaseInfo[]> => {
  try {
    const response = await fetch(`${API}?per_page=6`, {
      headers: {
        Accept: 'application/vnd.github+json',
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
      next: { revalidate: 600 },
    });
    if (!response.ok) throw new Error(`GitHub ${response.status}`);

    const raw = (await response.json()) as RawRelease[];
    return raw
      .filter(release => !release.draft && !release.prerelease)
      .map(toRelease)
      .filter((release): release is ReleaseInfo => Boolean(release));
  } catch {
    return [];
  }
};

export const formatBytes = (bytes: number): string => {
  if (!bytes) return '—';
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
};

export const formatDate = (iso: string | null): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
