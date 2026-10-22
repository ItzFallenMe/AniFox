import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CATALOG_REGION, isTmdbConfigured } from '../config/env';
import { buildHomeFeed, type HomeRowSpec } from '../config/homeFeed';
import { fetchCategoryPage } from '../services/categories';
import { TMDBService, tagShows } from '../services/tmdb';
import type { HomeRowVariant } from '../config/homeFeed';
import type { MediaItem } from '../types';

export interface HomeRow {
  key: string;
  kicker?: string;
  title: string;
  variant: HomeRowVariant;
  items: MediaItem[];
}

/**
 * Loads Flickv4's spec-driven home feed in two waves: wave 1 (anime + the
 * regional Top 10s) blocks first paint, wave 2 streams in row by row in spec
 * order once wave 1 has rendered.
 */
export const useHomeFeed = () => {
  const [feed] = useState(() => buildHomeFeed(CATALOG_REGION));
  const [hero, setHero] = useState<MediaItem[]>([]);
  const [wave1Rows, setWave1Rows] = useState<HomeRow[]>([]);
  const [wave2Slots, setWave2Slots] = useState<(HomeRow | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runIdRef = useRef(0);

  const loadSpec = (spec: HomeRowSpec): Promise<HomeRow | null> =>
    fetchCategoryPage(spec.query)
      .then(items =>
        items.length
          ? {
              key: spec.id,
              kicker: spec.kicker,
              title: spec.title,
              variant: spec.variant,
              items,
            }
          : null,
      )
      .catch(() => null);

  const run = useCallback(
    async (isRefresh: boolean) => {
      if (!isTmdbConfigured) {
        setLoading(false);
        return;
      }
      const runId = ++runIdRef.current;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      setWave1Rows([]);
      setWave2Slots([]);

      const wave1 = feed.filter(spec => spec.wave === 1);
      const wave2 = feed.filter(spec => spec.wave === 2);

      try {
        const [heroResponse, ...rows] = await Promise.all([
          TMDBService.discoverAnimeTV(1),
          ...wave1.map(loadSpec),
        ]);
        if (runId !== runIdRef.current) return;

        setHero(tagShows(heroResponse.results).slice(0, 5));
        setWave1Rows(rows.filter((row): row is HomeRow => row != null));
        setLoading(false);

        // Wave 2: fixed slots so rows land in spec order as they resolve.
        setWave2Slots(wave2.map(() => null));
        wave2.forEach((spec, index) => {
          loadSpec(spec).then(row => {
            if (runId !== runIdRef.current) return;
            setWave2Slots(current => {
              const next = [...current];
              next[index] = row;
              return next;
            });
            setRefreshing(current => (current ? false : current));
          });
        });
      } catch (caught) {
        if (runId !== runIdRef.current) return;
        setError(
          caught instanceof Error ? caught.message : 'Could not load the catalog.',
        );
        setLoading(false);
      } finally {
        if (runId === runIdRef.current) setRefreshing(false);
      }
    },
    [feed],
  );

  useEffect(() => {
    run(false);
  }, [run]);

  const rows = useMemo(
    () => [
      ...wave1Rows,
      ...wave2Slots.filter((row): row is HomeRow => row != null),
    ],
    [wave1Rows, wave2Slots],
  );

  const refresh = useCallback(() => run(true), [run]);

  return {
    hero,
    rows,
    loading,
    refreshing,
    error,
    refresh,
    retry: () => run(false),
  };
};
