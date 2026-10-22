import {
  VDRK_SUBS_CONFIG,
  WYZIE_SUBS_CONFIG,
} from '../config/env';
import { languageFromLabel } from '../constants/subtitleLanguages';

/**
 * Subtitle catalogue client, ported from Flickv4's `WyzieService` and
 * `VdrkSubtitleService`.
 *
 * Two sources are searched in parallel:
 *  - Vidrock (`sub.vdrk.site`) — keyless, returns WebVTT files.
 *  - Wyzie Subs — skipped unless `WYZIE_SUBS_CONFIG.API_KEY` is filled in.
 */

export interface SubtitleTrack {
  id: string;
  url: string;
  display: string;
  /** ISO 639-1 when it could be derived, otherwise the label's first two letters. */
  language: string;
  format: string;
  isHearingImpaired?: boolean;
  source: 'vdrk' | 'wyzie';
}

export interface SubtitleSearchParams {
  tmdbId: number;
  season?: number;
  episode?: number;
}

/** Browser-like UA so Cloudflare does not 403 RN/okhttp subtitle fetches. */
export const SUBTITLE_FETCH_HEADERS: Record<string, string> = {
  Accept: 'text/vtt, text/plain, application/x-subrip, application/json, */*',
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
};

const MAX_TRACKS = 80;

export class SubtitleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubtitleError';
  }
}

const withTimeout = async <T>(
  timeoutMs: number,
  run: (signal: AbortSignal) => Promise<T>,
): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await run(controller.signal);
  } finally {
    clearTimeout(timer);
  }
};

interface VdrkEntry {
  label?: string;
  file?: string;
}

const isHearingImpaired = (label: string): boolean =>
  /(?:^|[\s(])hi(?:\d+)?(?:\s|$)/i.test(label) && !/hindi/i.test(label);

/** The catalogue returns paths like `English Hi.vtt` — encode each segment. */
const encodeSubtitleUrl = (raw: string): string => {
  try {
    const parsed = new URL(raw);
    const encodedPath = parsed.pathname
      .split('/')
      .map(segment => encodeURIComponent(decodeURIComponent(segment)))
      .join('/');
    return `${parsed.origin}${encodedPath}${parsed.search}`;
  } catch {
    return raw;
  }
};

const searchVdrk = async ({
  tmdbId,
  season,
  episode,
}: SubtitleSearchParams): Promise<SubtitleTrack[]> => {
  if (!Number.isFinite(tmdbId) || tmdbId <= 0) return [];
  const isTv = season != null && episode != null;
  const path = isTv
    ? `tv/${tmdbId}/${season}/${episode}`
    : `movie/${tmdbId}`;

  return withTimeout(VDRK_SUBS_CONFIG.TIMEOUT_MS, async signal => {
    const response = await fetch(`${VDRK_SUBS_CONFIG.BASE_URL}/${path}`, {
      headers: { ...SUBTITLE_FETCH_HEADERS, Accept: 'application/json' },
      signal,
    });
    if (!response.ok) return [];
    const data = (await response.json()) as VdrkEntry[] | VdrkEntry;
    const entries = Array.isArray(data) ? data : data?.file ? [data] : [];
    return entries.flatMap((entry, index) => {
      const url =
        typeof entry.file === 'string' ? encodeSubtitleUrl(entry.file) : '';
      if (!/^https?:\/\//i.test(url)) return [];
      const label = String(entry.label || 'Unknown');
      const language = languageFromLabel(label);
      return [
        {
          id: `vdrk:${language}:${label}:${index}`,
          url,
          display: label,
          language,
          format: 'vtt',
          isHearingImpaired: isHearingImpaired(label),
          source: 'vdrk' as const,
        },
      ];
    });
  }).catch(() => []);
};

interface WyzieEntry {
  id?: string | number;
  url?: string;
  format?: string;
  display?: string;
  language?: string;
  media?: string;
  isHearingImpaired?: boolean;
  hi?: boolean;
}

const searchWyzie = async ({
  tmdbId,
  season,
  episode,
}: SubtitleSearchParams): Promise<SubtitleTrack[]> => {
  if (!WYZIE_SUBS_CONFIG.API_KEY) return [];

  const url = new URL(`${WYZIE_SUBS_CONFIG.BASE_URL}/search`);
  url.searchParams.set('id', String(tmdbId));
  url.searchParams.set('key', WYZIE_SUBS_CONFIG.API_KEY);
  url.searchParams.set('format', 'srt');
  if (season != null && episode != null) {
    url.searchParams.set('season', String(season));
    url.searchParams.set('episode', String(episode));
  }

  return withTimeout(WYZIE_SUBS_CONFIG.TIMEOUT_MS, async signal => {
    const response = await fetch(url.toString(), {
      headers: { ...SUBTITLE_FETCH_HEADERS, Accept: 'application/json' },
      signal,
    });
    if (!response.ok) {
      throw new SubtitleError(`Wyzie request failed (${response.status})`);
    }
    const data = (await response.json()) as WyzieEntry[] | WyzieEntry;
    const entries = Array.isArray(data) ? data : data ? [data] : [];
    return entries.flatMap((entry, index) => {
      if (!entry.url) return [];
      const label = entry.display || entry.language || `Subtitle ${index + 1}`;
      return [
        {
          id: String(entry.id ?? `wyzie_${index}`),
          url: entry.url,
          display: label,
          language: languageFromLabel(entry.language || label),
          format: entry.format || 'srt',
          isHearingImpaired: Boolean(
            entry.isHearingImpaired ?? entry.hi ?? false,
          ),
          source: 'wyzie' as const,
        },
      ];
    });
  }).catch(() => []);
};

/**
 * Search every catalogue, merge the results, and sort so the preferred
 * language sits at the top. Track identity is `language + label + CC` so the
 * same subtitle from both sources only appears once.
 */
export const searchSubtitles = async (
  params: SubtitleSearchParams,
  defaultLanguage = 'en',
): Promise<SubtitleTrack[]> => {
  const [vdrkTracks, wyzieTracks] = await Promise.all([
    searchVdrk(params),
    searchWyzie(params),
  ]);

  const seen = new Set<string>();
  const unique: SubtitleTrack[] = [];
  for (const track of [...vdrkTracks, ...wyzieTracks]) {
    const key = `${track.language}-${track.display}-${
      track.isHearingImpaired ? 'cc' : 'n'
    }`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(track);
    if (unique.length >= MAX_TRACKS) break;
  }

  return unique.sort((a, b) => {
    if (defaultLanguage) {
      const aDefault = a.language === defaultLanguage ? 0 : 1;
      const bDefault = b.language === defaultLanguage ? 0 : 1;
      if (aDefault !== bDefault) return aDefault - bDefault;
    }
    return a.display.localeCompare(b.display);
  });
};

/** Download a track's cue text, rejecting HTML error/anti-bot pages. */
export const fetchSubtitleText = async (url: string): Promise<string> => {
  const response = await fetch(url, { headers: SUBTITLE_FETCH_HEADERS });
  if (!response.ok) {
    throw new SubtitleError(`Failed to download subtitle (${response.status})`);
  }
  const text = await response.text();
  const trimmed = text.replace(/^\uFEFF/, '').trim();
  if (/^<!DOCTYPE html/i.test(trimmed) || /^<html[\s>]/i.test(trimmed)) {
    throw new SubtitleError('Subtitle download returned HTML instead of cues.');
  }
  return text;
};
