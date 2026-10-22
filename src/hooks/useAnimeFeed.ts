import { useCallback, useEffect, useState } from 'react';

import { isTmdbConfigured } from '../config/env';
import { TMDBService, tagMovies, tagShows } from '../services/tmdb';
import type { MediaItem } from '../types';

export type AnimeCategory = 'trending' | 'airing' | 'series' | 'movies' | 'top';

export const ANIME_CATEGORIES: { key: AnimeCategory; label: string }[] = [
  { key: 'trending', label: 'Trending' },
  { key: 'airing', label: 'Airing now' },
  { key: 'series', label: 'Series' },
  { key: 'movies', label: 'Movies' },
  { key: 'top', label: 'Top rated' },
];

const loadCategory = async (category: AnimeCategory): Promise<MediaItem[]> => {
  switch (category) {
    case 'airing':
      return tagShows((await TMDBService.discoverAiringAnime(1)).results);
    case 'movies':
      return tagMovies((await TMDBService.discoverAnimeMovies(1)).results);
    case 'top':
      return tagShows(
        (
          await TMDBService.discoverAnimeTV(1, 'vote_average.desc', {
            'vote_count.gte': 300,
          })
        ).results,
      );
    case 'series':
      return tagShows(
        (
          await TMDBService.discoverAnimeTV(1, 'popularity.desc', {
            'vote_count.gte': 50,
          })
        ).results,
      );
    case 'trending':
    default:
      return tagShows((await TMDBService.discoverAnimeTV(1)).results);
  }
};

export const useAnimeFeed = (category: AnimeCategory) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState(0);

  const retry = useCallback(() => setToken(current => current + 1), []);

  useEffect(() => {
    if (!isTmdbConfigured) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    loadCategory(category)
      .then(result => {
        if (!cancelled) setItems(result);
      })
      .catch(caught => {
        if (!cancelled) {
          setItems([]);
          setError(caught instanceof Error ? caught.message : 'Could not load anime.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, token]);

  return { items, loading, error, retry };
};
