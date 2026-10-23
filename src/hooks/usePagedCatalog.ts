import { useCallback, useEffect, useRef, useState } from 'react';

import type { CatalogKey } from '../config/catalogs';
import { CATALOG_REGION, isTmdbConfigured } from '../config/env';
import { fetchCatalogPage, MAX_CATALOG_PAGES } from '../services/catalogs';
import type { MediaItem } from '../types';

/**
 * Server-side pagination, mirroring sarui-movies' catalog pages: one page of
 * results at a time, with the total page count kept for the pagination bar.
 */
export const usePagedCatalog = (key: CatalogKey) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState(0);
  const runIdRef = useRef(0);

  useEffect(() => {
    if (!isTmdbConfigured) {
      setItems([]);
      setLoading(false);
      return;
    }

    const runId = ++runIdRef.current;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCatalogPage(key, page, CATALOG_REGION)
      .then(result => {
        if (cancelled || runId !== runIdRef.current) return;
        setItems(result.items);
        setTotalPages(result.totalPages);
      })
      .catch(caught => {
        if (cancelled || runId !== runIdRef.current) return;
        setItems([]);
        setError(
          caught instanceof Error ? caught.message : 'Could not load this catalog.',
        );
      })
      .finally(() => {
        if (!cancelled && runId === runIdRef.current) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key, page, token]);

  const goTo = useCallback((next: number) => {
    setPage(Math.min(Math.max(1, next), MAX_CATALOG_PAGES));
  }, []);

  const retry = useCallback(() => setToken(current => current + 1), []);

  return {
    items,
    page,
    totalPages,
    loading,
    error,
    goTo,
    retry,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
  };
};
