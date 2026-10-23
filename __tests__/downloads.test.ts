import {
  downloadIdFor,
  mimeForStream,
  DOWNLOAD_MIME,
} from '../src/services/downloads';
import { parseProbeMessage } from '../src/utils/streamProbe';
import type { MediaItem } from '../src/types';

const movie: MediaItem = {
  id: 550,
  media_type: 'movie',
  title: 'Fight Club',
  overview: '',
  poster_path: null,
  backdrop_path: null,
};

const show: MediaItem = {
  id: 1399,
  media_type: 'tv',
  name: 'Game of Thrones',
  overview: '',
  poster_path: null,
  backdrop_path: null,
};

describe('stream probe messages', () => {
  it('accepts HLS and progressive video URLs', () => {
    expect(
      parseProbeMessage(
        JSON.stringify({
          type: 'anifox-stream',
          url: 'https://cdn.example.com/master.m3u8?token=abc',
        }),
      ),
    ).toBe('https://cdn.example.com/master.m3u8?token=abc');

    expect(
      parseProbeMessage(
        JSON.stringify({
          type: 'anifox-stream',
          url: 'https://cdn.example.com/file.mp4',
        }),
      ),
    ).toBe('https://cdn.example.com/file.mp4');
  });

  it('ignores other messages, malformed JSON and non-media URLs', () => {
    expect(parseProbeMessage('not json')).toBeNull();
    expect(
      parseProbeMessage(
        JSON.stringify({ type: 'anifox-stream', url: 'https://example.com/a.jpg' }),
      ),
    ).toBeNull();
    expect(
      parseProbeMessage(JSON.stringify({ type: 'ping', url: 'https://a/b.m3u8' })),
    ).toBeNull();
  });
});

describe('download identity', () => {
  it('scopes series downloads by season and episode', () => {
    expect(downloadIdFor(show, 2, 4)).toBe('tv-1399-s2e4');
    expect(downloadIdFor(show)).toBe('tv-1399');
    expect(downloadIdFor(movie)).toBe('movie-550');
  });

  it('detects progressive files by extension', () => {
    expect(mimeForStream('https://cdn/x.mp4?t=1')).toBe(DOWNLOAD_MIME.mp4);
    expect(mimeForStream('https://cdn/x.m3u8')).toBe(DOWNLOAD_MIME.hls);
  });
});
