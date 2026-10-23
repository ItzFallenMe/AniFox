import { useCallback, useEffect, useState } from 'react';

import { TMDBService } from '../services/tmdb';
import {
  isMovie,
  type CastMember,
  type Episode,
  type MediaDetails,
  type MediaItem,
} from '../types';

const messageOf = (caught: unknown): string =>
  caught instanceof Error ? caught.message : 'Could not load this title.';

export const useDetails = (item: MediaItem) => {
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [similar, setSimilar] = useState<MediaItem[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState(0);

  const retry = useCallback(() => setToken(current => current + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const movie = isMovie(item);
    const loadDetails = movie
      ? TMDBService.getMovieDetails(item.id)
      : TMDBService.getTVShowDetails(item.id);
    const loadCredits = movie
      ? TMDBService.getMovieCredits(item.id)
      : TMDBService.getTVShowCredits(item.id);
    const loadSimilar = movie
      ? TMDBService.getSimilarMovies(item.id)
      : TMDBService.getSimilarTVShows(item.id);
    // Trailers are optional: a missing one must never block the detail page.
    const loadTrailer = TMDBService.getTrailerKey(movie ? 'movie' : 'tv', item.id);

    Promise.allSettled([loadDetails, loadCredits, loadSimilar, loadTrailer])
      .then(([detailsResult, creditsResult, similarResult, trailerResult]) => {
        if (cancelled) return;

        if (detailsResult.status === 'rejected') {
          setError(messageOf(detailsResult.reason));
          return;
        }

        setDetails(detailsResult.value);
        setCast(creditsResult.status === 'fulfilled' ? creditsResult.value.slice(0, 12) : []);
        setSimilar(similarResult.status === 'fulfilled' ? similarResult.value : []);
        setTrailerKey(trailerResult.status === 'fulfilled' ? trailerResult.value : null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [item, token]);

  return { details, cast, similar, trailerKey, loading, error, retry };
};

export const useSeasonEpisodes = (tvId: number, seasonNumber?: number) => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (seasonNumber == null) {
      setEpisodes([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    TMDBService.getSeasonDetails(tvId, seasonNumber)
      .then(season => {
        if (!cancelled) setEpisodes(season.episodes ?? []);
      })
      .catch(caught => {
        if (!cancelled) {
          setEpisodes([]);
          setError(messageOf(caught));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tvId, seasonNumber]);

  return { episodes, loading, error };
};
