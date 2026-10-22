import { PLAYBACK_SERVERS, playbackHeadersFor } from '../src/services/servers';

const server = PLAYBACK_SERVERS.find(s => s.id === 'vidfast')!;

describe('playbackHeadersFor', () => {
  it('falls back to the server homepage', () => {
    expect(playbackHeadersFor(server)).toEqual({
      Referer: 'https://vidfast.vc/',
      Origin: 'https://vidfast.vc',
    });
  });

  it('prefers the document that produced the stream', () => {
    expect(
      playbackHeadersFor(server, 'https://vidfast.vc/tv/456/2/7?autoplay=true'),
    ).toEqual({
      Referer: 'https://vidfast.vc/tv/456/2/7?autoplay=true',
      Origin: 'https://vidfast.vc',
    });
  });

  it('uses the promoted player frame and forwards its cookies', () => {
    expect(
      playbackHeadersFor(
        server,
        'https://player.nxsha.workers.dev/embed/tv/456/2/7',
        'cf_clearance=abc; theme=dark',
      ),
    ).toEqual({
      Referer: 'https://player.nxsha.workers.dev/embed/tv/456/2/7',
      Origin: 'https://player.nxsha.workers.dev',
      Cookie: 'cf_clearance=abc; theme=dark',
    });
  });

  it('ignores a non-http page url and empty cookies', () => {
    expect(playbackHeadersFor(server, 'about:blank', '')).toEqual({
      Referer: 'https://vidfast.vc/',
      Origin: 'https://vidfast.vc',
    });
  });
});
