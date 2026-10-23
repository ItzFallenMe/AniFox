import {
  EMBED_SERVERS,
  PLAYABLE_SERVERS,
  embedServerById,
  formatEmbedTitle,
  trailerUrl,
  type StreamContext,
} from '../src/config/embedServers';

const movie: StreamContext = {
  isSeries: false,
  tmdbId: '969681',
  title: 'Spider-Man: Brand New Day',
};

const episode: StreamContext = {
  isSeries: true,
  tmdbId: '95479',
  season: '1',
  episode: 3,
  title: 'JUJUTSU KAISEN',
};

const urlFor = (id: string, context: StreamContext) =>
  EMBED_SERVERS.find(server => server.id === id)!.getUrl(context);

describe('embed servers', () => {
  it('starts with the live EmbedWave provider', () => {
    expect(EMBED_SERVERS[0].id).toBe('embedwave');
    expect(urlFor('embedwave', movie)).toBe(
      'https://embedwave.cc/embed/movie/969681',
    );
    expect(urlFor('embedwave', episode)).toBe(
      'https://embedwave.cc/embed/tv/95479/1/3',
    );
  });

  it('builds movie and episode paths for every provider', () => {
    expect(urlFor('vidlink', movie)).toBe('https://vidlink.pro/movie/969681');
    expect(urlFor('vidsrc-pm', movie)).toBe(
      'https://vidsrc.pm/embed/movie/969681',
    );
    expect(urlFor('vidsrc-pm', episode)).toBe(
      'https://vidsrc.pm/embed/tv/95479/1/3',
    );
    expect(urlFor('2embed-skin', movie)).toBe(
      'https://www.2embed.skin/embed/movie/969681',
    );
    expect(urlFor('2embed-skin', episode)).toBe(
      'https://www.2embed.skin/embedtv/95479&s=1&e=3',
    );
    expect(urlFor('2embed', movie)).toBe(
      'https://www.2embed.cc/embed/969681',
    );
    expect(urlFor('2embed', episode)).toBe(
      'https://www.2embed.cc/embedtv/95479&s=1&e=3',
    );
    expect(urlFor('videasy', movie)).toBe(
      'https://player.videasy.net/movie/969681',
    );
    expect(urlFor('videasy', episode)).toBe(
      'https://player.videasy.net/tv/95479/1/3',
    );
    expect(urlFor('111movies', movie)).toBe(
      'https://111movies.com/movie/969681',
    );
    expect(urlFor('vidsrc-su', movie)).toBe(
      'https://vidsrc.su/embed/movie/969681',
    );
    expect(urlFor('vidsrc-su', episode)).toBe(
      'https://vidsrc.su/embed/tv/95479/1/3',
    );
  });

  it("adds vidlink's next-episode button only for series", () => {
    expect(urlFor('vidlink', episode)).toBe(
      'https://vidlink.pro/tv/95479/1/3?nextbutton=true',
    );
  });

  it('exposes every provider as playable', () => {
    expect(PLAYABLE_SERVERS).toHaveLength(8);
    expect(PLAYABLE_SERVERS.every(server => !server.disabled)).toBe(true);
    expect(EMBED_SERVERS.map(server => server.label)).toEqual([
      'EmbedWave',
      'VidLink',
      'VidSrc.pm',
      '2Embed.skin',
      '2Embed',
      'Videasy',
      '111Movies',
      'Vidsrc.su',
    ]);
  });

  it('falls back to the first server for unknown preferences', () => {
    expect(embedServerById(null).id).toBe('embedwave');
    expect(embedServerById('legacy-vidsrc').id).toBe('embedwave');
    expect(embedServerById('server2').id).toBe('embedwave');
    expect(embedServerById('vidlink').id).toBe('vidlink');
  });

  it('slugs titles and encodes trailer keys', () => {
    expect(formatEmbedTitle('  Spider-Man: Brand New Day ')).toBe(
      'spider-man-brand-new-day',
    );
    expect(trailerUrl('a/b c')).toBe(
      'https://www.youtube.com/embed/a%2Fb%20c?autoplay=1&rel=0&playsinline=1&modestbranding=1',
    );
  });
});
