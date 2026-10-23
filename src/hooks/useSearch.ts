import { useCallback, useEffect, useState } from 'react';

import { isTmdbConfigured } from '../config/env';
import { MAX_CATALOG_PAGES } from '../services/catalogs';
import { TMDBService } from '../services/tmdb';
import type { MediaItem } from '../types';

/**
 * Debounced multi-search with sarui-movies' page semantics: TMDB relevance
 * order is preserved, results are filtered by the catalog policy, and each
 * page is requested explicitly.
 */
export const useSearch = (query: string) => {
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<MediaItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setDebounced('');
      setResults([]);
      setError(null);
      setLoading(false);
      setPage(1);
      return;
    }

    const timer = setTimeout(() => {
      setDebounced(trimmed);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debounced || !isTmdbConfigured) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    TMDBService.searchMulti(debounced, page)
      .then(response => {
        if (cancelled) return;
        setResults(response.results);
        setTotalPages(Math.max(1, Math.min(response.total_pages, MAX_CATALOG_PAGES)));
      })
      .catch(caught => {
        if (cancelled) return;
        setResults([]);
        setError(caught instanceof Error ? caught.message : 'Search failed.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debounced, page, token]);

  const goTo = useCallback((next: number) => {
    setPage(Math.min(Math.max(1, next), MAX_CATALOG_PAGES));
  }, []);

  const retry = useCallback(() => setToken(current => current + 1), []);

  return {
    results,
    page,
    totalPages,
    loading,
    error,
    activeQuery: debounced,
    tooShort: query.trim().length > 0 && query.trim().length < 2,
    goTo,
    retry,
  };
};
