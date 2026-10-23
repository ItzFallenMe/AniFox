import { NativeModules, Platform } from 'react-native';

import { getMediaKey, getTitle, type MediaItem } from '../types';
import { createPersistedStore } from './persistedStore';

/**
 * Offline downloads.
 *
 * A provider builds its signed manifest at runtime, so there is no URL to
 * resolve ahead of time. The player probes the page it is already playing
 * (`utils/streamProbe.ts`), and the detected HLS/MP4 URL is handed to Android's
 * Media3 downloader through the native `AnifoxDownloads` module. Media3 saves
 * the manifest and every segment in a local cache; playback of a completed
 * download is served from that cache with no network.
 *
 * Cookies and the referer are attached natively from Android's CookieManager,
 * because several providers reject direct manifest requests without them.
 */

export const DOWNLOAD_MIME = {
  hls: 'application/x-mpegURL',
  mp4: 'video/mp4',
} as const;

export type DownloadState =
  | 'queued'
  | 'stopped'
  | 'downloading'
  | 'completed'
  | 'failed'
  | 'removing'
  | 'restarting';

export interface NativeDownload {
  id: string;
  state: DownloadState;
  percent: number;
  bytesDownloaded: number;
  contentLength: number;
  failureReason?: number;
}

export interface DownloadSource {
  /** Direct media URL captured from the player. */
  url: string;
  mimeType: string;
  /** Player page URL, sent as the Referer header. */
  referer?: string;
}

export interface DownloadRecord {
  id: string;
  item: MediaItem;
  title: string;
  /** Manifest URL; also the Media3 cache key. */
  url: string;
  mimeType: string;
  season?: number;
  episode?: number;
  episodeName?: string;
  createdAt: number;
}

export interface DownloadEntry extends DownloadRecord {
  state: DownloadState;
  percent: number;
  bytesDownloaded: number;
  contentLength: number;
  failureReason?: number;
}

interface NativeDownloads {
  enqueue(request: {
    id: string;
    url: string;
    title: string;
    mimeType: string;
    referer?: string;
  }): Promise<boolean>;
  remove(id: string): Promise<boolean>;
  list(): Promise<NativeDownload[]>;
  play(
    id: string,
    url: string,
    title: string,
    mimeType: string,
  ): Promise<boolean>;
}

const Native = NativeModules.AnifoxDownloads as NativeDownloads | undefined;

export const downloadsSupported = Platform.OS === 'android' && Boolean(Native);

const STATE_BY_INDEX: DownloadState[] = [
  'queued',
  'stopped',
  'downloading',
  'completed',
  'failed',
  'removing',
  'restarting',
];

const store = createPersistedStore<DownloadRecord[]>({
  key: 'anifox.downloads.v1',
  initial: [],
  sanitize: value =>
    Array.isArray(value)
      ? value.filter(
          (entry): entry is DownloadRecord =>
            Boolean(entry) &&
            typeof entry === 'object' &&
            typeof (entry as DownloadRecord).id === 'string' &&
            Boolean((entry as DownloadRecord).item),
        )
      : null,
});

export const downloadStore = store;

export const hydrateDownloads = store.hydrate;

export const downloadIdFor = (
  item: MediaItem,
  season?: number,
  episode?: number,
): string => {
  const base = getMediaKey(item);
  if (season != null && episode != null) return `${base}-s${season}e${episode}`;
  return base;
};

export const mimeForStream = (url: string): string =>
  /\.mp4([?#]|$)/i.test(url) ? DOWNLOAD_MIME.mp4 : DOWNLOAD_MIME.hls;

/** Queue a captured stream for offline use. */
export const startDownload = async (
  item: MediaItem,
  source: DownloadSource,
  episode?: { season?: number; episode?: number; episodeName?: string },
): Promise<DownloadRecord> => {
  if (!Native) throw new Error('Downloads are not available in this build.');

  const id = downloadIdFor(item, episode?.season, episode?.episode);
  const existing = store.getSnapshot().find(entry => entry.id === id);
  if (existing) return existing;

  const title = episode?.episode
    ? `${getTitle(item)} · S${episode.season ?? 1} E${episode.episode}`
    : getTitle(item);

  const record: DownloadRecord = {
    id,
    item,
    title,
    url: source.url,
    mimeType: source.mimeType,
    season: episode?.season,
    episode: episode?.episode,
    episodeName: episode?.episodeName,
    createdAt: Date.now(),
  };

  const queued = await Native.enqueue({
    id,
    url: source.url,
    title,
    mimeType: source.mimeType,
    referer: source.referer,
  });
  if (!queued) throw new Error('The download could not be queued.');

  store.update(current => [record, ...current]);
  return record;
};

export const listNativeDownloads = async (): Promise<NativeDownload[]> => {
  if (!Native) return [];
  try {
    const list = await Native.list();
    return list.map(entry => ({
      ...entry,
      state: STATE_BY_INDEX[entry.state as unknown as number] ?? 'queued',
    }));
  } catch {
    return [];
  }
};

export const removeDownload = async (id: string): Promise<void> => {
  try {
    await Native?.remove(id);
  } finally {
    store.update(current => current.filter(entry => entry.id !== id));
  }
};

/** Open the native Media3 player, which reads the local cache. */
export const playDownloaded = async (entry: DownloadEntry): Promise<boolean> => {
  if (!Native) return false;
  try {
    return await Native.play(entry.id, entry.url, entry.title, entry.mimeType);
  } catch {
    return false;
  }
};
