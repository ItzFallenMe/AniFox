import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  fetchSubtitleText,
  searchSubtitles,
  type SubtitleTrack,
} from '../services/subtitleService';
import {
  findCueAt,
  parseSubtitleText,
  type SubtitleCue,
} from '../utils/subtitles';

interface UseSubtitlesArgs {
  tmdbId: number;
  season?: number;
  episode?: number;
  /** Set false while the player is still resolving a stream. */
  enabled?: boolean;
  /** ISO 639-1 code auto-selected once, when tracks load. */
  defaultLanguage?: string;
}

/**
 * Track search + cue loading for the custom caption renderer, adapted from
 * Flickv4's `useSubtitles` (no offline downloads, no native sidecars).
 */
export const useSubtitles = ({
  tmdbId,
  season,
  episode,
  enabled = true,
  defaultLanguage = 'en',
}: UseSubtitlesArgs) => {
  const [tracks, setTracks] = useState<SubtitleTrack[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCues, setLoadingCues] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Once the user has interacted (including choosing "Off"), stop auto-selecting.
  const didAutoSelectRef = useRef(false);

  useEffect(() => {
    if (!enabled || !tmdbId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTracks([]);

    searchSubtitles({ tmdbId, season, episode }, defaultLanguage)
      .then(results => {
        if (cancelled) return;
        setTracks(results);
        if (results.length === 0) setError('No subtitles found for this title.');
      })
      .catch(caught => {
        if (cancelled) return;
        setError(
          caught instanceof Error ? caught.message : 'Subtitle search failed.',
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, tmdbId, season, episode, defaultLanguage]);

  // Auto-select a track in the preferred language, once.
  useEffect(() => {
    if (didAutoSelectRef.current || !tracks.length) return;
    const match =
      (defaultLanguage &&
        tracks.find(track => track.language === defaultLanguage)) ||
      null;
    didAutoSelectRef.current = true;
    if (match) setSelectedId(match.id);
  }, [tracks, defaultLanguage]);

  const selectedTrack = useMemo(
    () => tracks.find(track => track.id === selectedId) ?? null,
    [tracks, selectedId],
  );

  // Keyed by URL so a parent re-render that rebuilds the array does not
  // cancel an in-flight download for the same track.
  const selectedUrl = selectedTrack?.url ?? null;

  useEffect(() => {
    if (!selectedUrl) {
      setCues([]);
      return;
    }
    let cancelled = false;
    setLoadingCues(true);
    fetchSubtitleText(selectedUrl)
      .then(text => {
        if (!cancelled) setCues(parseSubtitleText(text));
      })
      .catch(() => {
        if (!cancelled) setCues([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCues(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedUrl]);

  const selectTrack = useCallback((id: string | null) => {
    didAutoSelectRef.current = true;
    setSelectedId(id);
  }, []);

  const cueAt = useCallback((time: number) => findCueAt(cues, time), [cues]);

  return {
    tracks,
    selectedId,
    selectedTrack,
    selectTrack,
    cueAt,
    loading,
    loadingCues,
    error,
  };
};
