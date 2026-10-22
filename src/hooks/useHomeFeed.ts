import { useCallback, useEffect, useState } from 'react';

import { CATALOG_REGION, isTmdbConfigured } from '../config/env';
import { TMDBService, tagMovies, tagShows } from '../services/tmdb';
import type { MediaItem } from '../types';

export interface HomeRow {
  key: string;
  kicker: string;
  title: string;
  items: MediaItem[];
}

interface HomeFeed {
  hero: MediaItem[];
  rows: HomeRow[];
}

const loadHomeFeed = async (): Promise<HomeFeed> => {
  const hero = await TMDBService.discoverAnimeTV(1);

  const requests = await Promise.allSettled([
    TMDBService.discoverAiringAnime(1),
    TMDBService.discoverAnimeMovies(1),
    TMDBService.getPopularMovies(1, CATALOG_REGION),
    TMDBService.getTopRatedTVShows(1),
    TMDBService.discoverMoviesByGenre(28, 1, CATALOG_REGION),
    TMDBService.discoverAnimeTV(1, 'vote_average.desc', { 'vote_count.gte': 300 }),
  ]);

  const [airing, animeMovies, popularMovies, topSeries, action, allTime] = requests;

  const rows: HomeRow[] = [
    {
      key: 'airing',
      kicker: 'This season',
      title: 'Airing now',
      items: airing.status === 'fulfilled' ? tagShows(airing.value.results) : [],
    },
    {
      key: 'anime-movies',
      kicker: 'Feature films',
      title: 'Anime movies',
      items:
        animeMovies.status === 'fulfilled' ? tagMovies(animeMovies.value.results) : [],
    },
    {
      key: 'popular-movies',
      kicker: 'Box office',
      title: 'Popular movies',
      items:
        popularMovies.status === 'fulfilled'
          ? tagMovies(popularMovies.value.results)
          : [],
    },
    {
      key: 'top-series',
      kicker: 'Highest rated',
      title: 'Top rated series',
      items: topSeries.status === 'fulfilled' ? tagShows(topSeries.value.results) : [],
    },
    {
      key: 'action',
      kicker: 'Adrenaline',
      title: 'Action & adventure',
      items: action.status === 'fulfilled' ? tagMovies(action.value.results) : [],
    },
    {
      key: 'all-time',
      kicker: 'Hall of fame',
      title: 'All-time greats',
      items: allTime.status === 'fulfilled' ? tagShows(allTime.value.results) : [],
    },
  ].filter(row => row.items.length > 0);

  return { hero: tagShows(hero.results).slice(0, 5), rows };
};

export const useHomeFeed = () => {
  const [data, setData] = useState<HomeFeed>({ hero: [], rows: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (isRefresh: boolean) => {
    if (!isTmdbConfigured) {
      setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setData(await loadHomeFeed());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load the catalog.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    run(false);
  }, [run]);

  const refresh = useCallback(() => run(true), [run]);

  return { ...data, loading, refreshing, error, refresh, retry: () => run(false) };
};
