import { APP_INFO } from '../config/env';
import { createPersistedStore } from './persistedStore';
import { readStoredJson, writeStoredJson } from './settingsStorage';

/**
 * In-app update check against GitHub Releases.
 *
 * The app is side-loaded, so there is no Play Store update channel. Instead it
 * asks the public GitHub API for the newest release, compares it with
 * `APP_INFO.version` and shows a banner with a direct APK link. Results are
 * cached for six hours so launches do not hit the API every time (unauthenticated
 * GitHub allows 60 requests/hour per IP).
 */

const CACHE_KEY = 'anifox.updateCache.v1';
const CACHE_TTL = 6 * 60 * 60 * 1000;
const LATEST_URL = 'https://api.github.com/repos/ItzFallenMe/AniFox/releases/latest';

export interface UpdateInfo {
  version: string;
  tag: string;
  notes: string;
  releaseUrl: string;
  apkUrl?: string;
  publishedAt?: string;
}

interface UpdateCache {
  checkedAt: number;
  info: UpdateInfo | null;
}

interface ReleaseAsset {
  name?: string;
  browser_download_url?: string;
}

interface Release {
  tag_name?: string;
  name?: string;
  body?: string;
  html_url?: string;
  published_at?: string;
  assets?: ReleaseAsset[];
}

/** `v2.1.0` → `2.1.0`; pre-release suffixes are dropped for comparison. */
export const normalizeVersion = (tag: string): string =>
  tag.trim().replace(/^v/i, '').split(/[-+]/)[0];

/** Numeric semver comparison; returns 1, 0 or -1. */
export const compareVersions = (a: string, b: string): number => {
  const left = normalizeVersion(a).split('.').map(Number);
  const right = normalizeVersion(b).split('.').map(Number);
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const x = Number.isFinite(left[index]) ? left[index] : 0;
    const y = Number.isFinite(right[index]) ? right[index] : 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
};

const pickApk = (release: Release): string | undefined => {
  const apks = (release.assets ?? []).filter(asset =>
    asset.name?.toLowerCase().endsWith('.apk'),
  );
  const preferred =
    apks.find(asset => /universal/i.test(asset.name ?? '')) ??
    apks.find(asset => /arm64/i.test(asset.name ?? '')) ??
    apks[0];
  return preferred?.browser_download_url;
};

const fetchLatest = async (): Promise<UpdateInfo | null> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(LATEST_URL, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const release = (await response.json()) as Release;
    if (!release.tag_name) return null;

    const version = normalizeVersion(release.tag_name);
    if (compareVersions(version, APP_INFO.version) <= 0) return null;

    return {
      version,
      tag: release.tag_name,
      notes: (release.body ?? '').trim(),
      releaseUrl:
        release.html_url ??
        `${APP_INFO.repository}/releases/tag/${release.tag_name}`,
      apkUrl: pickApk(release),
      publishedAt: release.published_at,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

/** Cached update lookup; pass `true` to ignore the cache. */
export const checkForUpdate = async (
  force = false,
): Promise<UpdateInfo | null> => {
  if (!force) {
    const cached = await readStoredJson<UpdateCache>(CACHE_KEY);
    if (cached && Date.now() - cached.checkedAt < CACHE_TTL) {
      return cached.info;
    }
  }

  const info = await fetchLatest();
  await writeStoredJson(CACHE_KEY, {
    checkedAt: Date.now(),
    info,
  } satisfies UpdateCache);
  return info;
};

/** Version the user chose to ignore, so the banner stays gone. */
export const dismissalStore = createPersistedStore<{ version: string | null }>({
  key: 'anifox.updateDismissed.v1',
  initial: { version: null },
  sanitize: stored => {
    if (!stored || typeof stored !== 'object') return null;
    const value = stored as { version?: unknown };
    return typeof value.version === 'string' ? { version: value.version } : null;
  },
});

export const hydrateUpdateDismissal = dismissalStore.hydrate;

export const dismissUpdate = (version: string): void => {
  dismissalStore.update(() => ({ version }));
};

export const APP_VERSION = APP_INFO.version;
