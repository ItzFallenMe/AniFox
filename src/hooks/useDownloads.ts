import { useEffect, useState, useSyncExternalStore } from 'react';

import {
  downloadStore,
  downloadsSupported,
  listNativeDownloads,
  playDownloaded,
  removeDownload,
  type DownloadEntry,
  type NativeDownload,
} from '../services/downloads';

/**
 * Merges stored metadata with the native DownloadManager state.
 *
 * Progress is polled while a screen is mounted; 1.5 s is enough for a progress
 * bar and avoids an event emitter that would need JS lifecycle handling.
 */
export const useDownloads = () => {
  const records = useSyncExternalStore(
    downloadStore.subscribe,
    downloadStore.getSnapshot,
    downloadStore.getSnapshot,
  );
  const [native, setNative] = useState<NativeDownload[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const list = await listNativeDownloads();
      if (active) setNative(list);
    };

    load();
    const timer = setInterval(load, 1500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [records.length]);

  const entries: DownloadEntry[] = records.map(record => {
    const state = native.find(item => item.id === record.id);
    return {
      ...record,
      state: state?.state ?? 'queued',
      percent: state?.percent ?? 0,
      bytesDownloaded: state?.bytesDownloaded ?? 0,
      contentLength: state?.contentLength ?? 0,
      failureReason: state?.failureReason,
    };
  });

  return {
    entries,
    supported: downloadsSupported,
    remove: removeDownload,
    play: playDownloaded,
  };
};
