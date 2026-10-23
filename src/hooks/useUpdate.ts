import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import {
  checkForUpdate,
  dismissalStore,
  dismissUpdate,
  type UpdateInfo,
} from '../services/updates';

/** Checks once per mount (six-hour cache) and honours a dismissed version. */
export const useUpdate = () => {
  const dismissedVersion = useSyncExternalStore(
    dismissalStore.subscribe,
    dismissalStore.getSnapshot,
    dismissalStore.getSnapshot,
  ).version;
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    checkForUpdate()
      .then(next => {
        if (active) setInfo(next);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const dismiss = useCallback(() => {
    if (info) dismissUpdate(info.version);
  }, [info]);

  return {
    info,
    checking,
    dismissed: Boolean(info && dismissedVersion === info.version),
    dismiss,
  };
};
