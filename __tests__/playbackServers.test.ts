import { PLAYBACK_SERVERS } from '../src/services/servers';
import { buildEmbedUrl } from '../src/utils/streamUrl';

const server = (id: string) => {
  const found = PLAYBACK_SERVERS.find(candidate => candidate.id === id);
  if (!found) throw new Error(`Missing server: ${id}`);
  return found;
};

const movie = (id: string) =>
  buildEmbedUrl(server(id), { type: 'movie', tmdbId: 550 });
const tv = (id: string) =>
  buildEmbedUrl(server(id), { type: 'tv', tmdbId: 1399, season: 1, episode: 2 });

describe('requested playback servers', () => {
  it('are listed in the requested order', () => {
    expect(PLAYBACK_SERVERS.slice(0, 14).map(entry => entry.name)).toEqual([
      'EmbedWave',
      'VidLink',
      'VidSrc.pm',
      '2Embed.skin',
      'VidFast',
      '2Embed',
      'Videasy',
      'VidSrc.to',
      'VidSrc.cc',
      'VidCore',
      'VixSrc',
      '111Movies',
      'VidSrc.su',
      'MultiEmbed',
    ]);
  });

  it('builds EmbedWave embed URLs', () => {
    expect(movie('embedwave')).toBe('https://embedwave.cc/embed/movie/550');
    expect(tv('embedwave')).toBe('https://embedwave.cc/embed/tv/1399/1/2');
  });

  it('builds VidSrc.pm embed URLs', () => {
    expect(movie('vidsrc-pm')).toBe('https://vidsrc.pm/embed/movie/550');
    expect(tv('vidsrc-pm')).toBe('https://vidsrc.pm/embed/tv/1399/1/2');
  });

  it('builds 2Embed URLs with query season/episode', () => {
    expect(movie('2embed-skin')).toBe('https://www.2embed.skin/embed/550');
    expect(tv('2embed-skin')).toBe(
      'https://www.2embed.skin/embedtv/1399&s=1&e=2',
    );
    expect(movie('2embed')).toBe('https://www.2embed.cc/embed/550');
    expect(tv('2embed')).toBe('https://www.2embed.cc/embedtv/1399&s=1&e=2');
  });

  it('builds VidSrc.cc v2 embed URLs', () => {
    expect(movie('vidsrc-cc')).toBe('https://vidsrc.cc/v2/embed/movie/550');
    expect(tv('vidsrc-cc')).toBe('https://vidsrc.cc/v2/embed/tv/1399/1/2');
  });

  it('builds VidCore embed URLs', () => {
    expect(movie('vidcore')).toBe('https://vidcore.org/embed/movie/550');
    expect(tv('vidcore')).toBe('https://vidcore.org/embed/tv/1399/1/2');
  });

  it('builds VixSrc and 111Movies embed URLs', () => {
    expect(movie('vixsrc')).toBe('https://vixsrc.to/movie/550');
    expect(tv('vixsrc')).toBe('https://vixsrc.to/tv/1399/1/2');
    expect(movie('111movies')).toBe('https://111movies.com/movie/550');
    expect(tv('111movies')).toBe('https://111movies.com/tv/1399/1/2');
  });

  it('builds VidSrc.su embed URLs', () => {
    expect(movie('vidsrc-su')).toBe(
      'https://vidsrc.su/embed/movie?tmdb=550',
    );
    expect(tv('vidsrc-su')).toBe(
      'https://vidsrc.su/embed/tv?tmdb=1399&season=1&episode=2',
    );
  });

  it('builds MultiEmbed URLs', () => {
    expect(movie('multiembed')).toBe(
      'https://multiembed.mov/?video_id=550&tmdb=1',
    );
    expect(tv('multiembed')).toBe(
      'https://multiembed.mov/?video_id=1399&tmdb=1&s=1&e=2',
    );
  });

  it('builds VidSrc.to, VidLink and Videasy embed URLs', () => {
    expect(movie('vidsrc-to')).toBe('https://vidsrc.to/embed/movie/550');
    expect(tv('vidsrc-to')).toBe('https://vidsrc.to/embed/tv/1399/1/2');
    expect(movie('vidlink')).toBe(
      'https://vidlink.pro/movie/550?autoplay=true',
    );
    expect(tv('videasy')).toBe('https://player.videasy.to/tv/1399/1/2');
  });

  it('builds the sarui-movies servers with the /embed base', () => {
    expect(movie('vidsrc-sh')).toBe('https://vidsrc.sh/embed/movie/550');
    expect(tv('vidsrc-sh')).toBe('https://vidsrc.sh/embed/tv/1399/1/2');
    expect(movie('embedapi')).toBe(
      'https://watch.embed-api.stream/embed/movie/550',
    );
    expect(tv('embedapi')).toBe(
      'https://watch.embed-api.stream/embed/tv/1399/1/2',
    );
  });

  it('keeps the previous extras available', () => {
    expect(PLAYBACK_SERVERS.map(entry => entry.id)).toEqual(
      expect.arrayContaining([
        'rive',
        'vidsrc',
        'cinejoy',
        'cinesrc',
        'cineplay',
        'screenscape',
      ]),
    );
  });
});
