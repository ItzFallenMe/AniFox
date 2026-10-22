/**
 * Subtitle cue parsing and lookup, ported from Flickv4's `utils/subtitles`.
 *
 * Handles both SRT (`00:00:01,000`) and WebVTT (`00:00:01.000`) timestamp
 * styles, strips inline markup, and finds the cue covering a playhead so the
 * player can draw captions itself instead of relying on native sidecars.
 */

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

const parseTimestamp = (raw: string): number => {
  const cleaned = raw.trim().replace(',', '.');
  const parts = cleaned.split(':');
  if (parts.length < 3) return 0;
  const hours = Number(parts[0]) || 0;
  const minutes = Number(parts[1]) || 0;
  const seconds = Number(parts[2]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
};

const stripTags = (text: string): string =>
  text
    .replace(/<[^>]+>/g, '')
    .replace(/\{[^}]+\}/g, '')
    .trim();

/** Parse SRT or basic WebVTT into cue objects (times in seconds). */
export const parseSubtitleText = (raw: string): SubtitleCue[] => {
  const normalized = raw
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\n+/);
  const cues: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    if (!lines.length) continue;
    if (lines[0].toUpperCase().startsWith('WEBVTT')) continue;

    const timeLineIndex = lines.findIndex(line => line.includes('-->'));
    if (timeLineIndex < 0) continue;

    const timeLine = lines[timeLineIndex];
    const [startRaw, endRaw] = timeLine.split('-->').map(part => part.trim());
    if (!startRaw || !endRaw) continue;

    const start = parseTimestamp(startRaw.split(' ')[0]);
    const end = parseTimestamp(endRaw.split(' ')[0]);
    const text = lines
      .slice(timeLineIndex + 1)
      .map(stripTags)
      .filter(Boolean)
      .join('\n');

    if (text && end > start) {
      cues.push({ start, end, text });
    }
  }

  return cues.sort((a, b) => a.start - b.start);
};

/** Convert SRT (or already-VTT) text into a WebVTT document. */
export const toWebVtt = (raw: string): string => {
  const normalized = raw
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
  if (normalized.toUpperCase().startsWith('WEBVTT')) return normalized;
  // SRT uses comma decimals; WebVTT uses dots.
  const body = normalized.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  return `WEBVTT\n\n${body}\n`;
};

/** Shift cue times by `offsetSeconds` (positive = captions appear later). */
export const shiftSubtitleCues = (
  cues: SubtitleCue[],
  offsetSeconds: number,
): SubtitleCue[] => {
  if (offsetSeconds === 0) return cues;
  return cues
    .map(cue => ({
      ...cue,
      start: cue.start + offsetSeconds,
      end: cue.end + offsetSeconds,
    }))
    .filter(cue => cue.end > 0)
    .map(cue => ({ ...cue, start: Math.max(0, cue.start) }));
};

/** Binary search for the cue covering `time` (seconds). */
export const findCueAt = (
  cues: SubtitleCue[],
  time: number,
): SubtitleCue | null => {
  let low = 0;
  let high = cues.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const cue = cues[mid];
    if (time < cue.start) high = mid - 1;
    else if (time > cue.end) low = mid + 1;
    else return cue;
  }
  return null;
};
