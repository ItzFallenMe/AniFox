import { useCallback, useEffect, useState } from 'react';

import { isTmdbConfigured } from '../config/env';
import { TMDBService, tagMovies, tagShows } from '../services/tmdb';
import type { MediaItem } from '../types';

export interface AnimeSections {
  ongoing: MediaItem[];
  popular: MediaItem[];
  topRated: MediaItem[];
  movies: MediaItem[];
}

const EMPTY: AnimeSections = {
  ongoing: [],
  popular: [],
  topRated: [],
  movies: [],
};

/**
 * The anime page's four rails, loaded in parallel exactly like sarui-movies'
 * `/anime` catalog: ongoing this season, most popular, top rated and films.
 */
export const useAnimeSections = () => {
  const [sections, setSections] = useState<AnimeSections>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState(0);

  const retry = useCallback(() => setToken(current => current + 1), []);

  useEffect(() => {
    if (!isTmdbConfigured) {
      setSections(EMPTY);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.allSettled([
      TMDBService.discoverAiringAnime(1),
      TMDBService.discoverAnimeTV(1, 'popularity.desc', { 'vote_count.gte': 50 }),
      TMDBService.discoverAnimeTV(1, 'vote_average.desc', { 'vote_count.gte': 300 }),
      TMDBService.discoverAnimeMovies(1),
    ])
      .then(([ongoing, popular, topRated, movies]) => {
        if (cancelled) return;

        if (ongoing.status === 'rejected' && popular.status === 'rejected') {
          setError(
            ongoing.reason instanceof Error
              ? ongoing.reason.message
              : 'Could not load the anime catalog.',
          );
          setSections(EMPTY);
          return;
        }

        setSections({
          ongoing: ongoing.status === 'fulfilled' ? tagShows(ongoing.value.results) : [],
          popular: popular.status === 'fulfilled' ? tagShows(popular.value.results) : [],
          topRated: topRated.status === 'fulfilled' ? tagShows(topRated.value.results) : [],
          movies: movies.status === 'fulfilled' ? tagMovies(movies.value.results) : [],
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return { sections, loading, error, retry };
};
