import { useEffect, useState } from 'react';

import { isTmdbConfigured } from '../config/env';
import { TMDBService } from '../services/tmdb';
import type { MediaItem } from '../types';

export const useSearch = (query: string) => {
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setDebounced('');
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => setDebounced(trimmed), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debounced || !isTmdbConfigured) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    TMDBService.searchMulti(debounced)
      .then(response => {
        if (!cancelled) setResults(response.results);
      })
      .catch(caught => {
        if (!cancelled) {
          setResults([]);
          setError(caught instanceof Error ? caught.message : 'Search failed.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return {
    results,
    loading,
    error,
    activeQuery: debounced,
    tooShort: query.trim().length > 0 && query.trim().length < 2,
  };
};
