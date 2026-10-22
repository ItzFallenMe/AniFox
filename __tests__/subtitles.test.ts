import {
  findCueAt,
  parseSubtitleText,
  shiftSubtitleCues,
  toWebVtt,
} from '../src/utils/subtitles';

const SRT = `1
00:00:01,000 --> 00:00:03,500
Hello <i>there</i>

2
00:00:04,000 --> 00:00:06,000
{\\an8}Second line
wraps here
`;

describe('parseSubtitleText', () => {
  it('parses SRT cues and strips markup', () => {
    expect(parseSubtitleText(SRT)).toEqual([
      { start: 1, end: 3.5, text: 'Hello there' },
      { start: 4, end: 6, text: 'Second line\nwraps here' },
    ]);
  });

  it('parses WebVTT timestamps and skips the header', () => {
    const vtt = `WEBVTT

00:00:02.000 --> 00:00:05.000
Caption text
`;
    expect(parseSubtitleText(vtt)).toEqual([
      { start: 2, end: 5, text: 'Caption text' },
    ]);
  });

  it('normalises CRLF and returns cues sorted by start', () => {
    const raw =
      '1\r\n00:00:10,000 --> 00:00:11,000\r\nLater\r\n\r\n2\r\n00:00:01,000 --> 00:00:02,000\r\nEarlier\r\n';
    expect(parseSubtitleText(raw).map(cue => cue.text)).toEqual([
      'Earlier',
      'Later',
    ]);
  });

  it('drops blocks without a timing line', () => {
    expect(parseSubtitleText('just text\n\n')).toEqual([]);
  });
});

describe('findCueAt', () => {
  const cues = parseSubtitleText(SRT);

  it('finds the cue covering a playhead inside a cue', () => {
    expect(findCueAt(cues, 5)?.text).toBe('Second line\nwraps here');
  });

  it('returns null in the gap between cues', () => {
    expect(findCueAt(cues, 3.8)).toBeNull();
  });

  it('returns null outside the track range', () => {
    expect(findCueAt(cues, 0.5)).toBeNull();
    expect(findCueAt(cues, 99)).toBeNull();
  });
});

describe('shiftSubtitleCues', () => {
  it('delays cues by the offset', () => {
    const shifted = shiftSubtitleCues(parseSubtitleText(SRT), 1.5);
    expect(shifted[0]).toEqual({ start: 2.5, end: 5, text: 'Hello there' });
  });

  it('clamps negative starts and drops cues that end before zero', () => {
    const shifted = shiftSubtitleCues(parseSubtitleText(SRT), -5);
    expect(shifted.map(cue => cue.start)).toEqual([0]);
    expect(shifted[0].end).toBe(1);
  });
});

describe('toWebVtt', () => {
  it('rewrites SRT commas to WebVTT dots', () => {
    expect(toWebVtt(SRT)).toContain('00:00:01.000 --> 00:00:03.500');
  });

  it('leaves an existing WebVTT document alone', () => {
    const vtt = 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nHi';
    expect(toWebVtt(vtt)).toBe(vtt);
  });
});
