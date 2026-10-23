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
  it('builds the ad-free provider URLs', () => {
    expect(urlFor('server1', movie)).toBe(
      'https://sarui-mov-provider.vercel.app/embed/movie/969681?autoplay=1&title=Spider-Man%3A%20Brand%20New%20Day',
    );
    expect(urlFor('server1', episode)).toBe(
      'https://sarui-mov-provider.vercel.app/embed/tv/95479/1/3?autoplay=1&title=JUJUTSU%20KAISEN',
    );
  });

  it('builds movie and episode paths for every embed provider', () => {
    expect(urlFor('server3', movie)).toBe(
      'https://embedwave.cc/embed/movie/969681',
    );
    expect(urlFor('server3', episode)).toBe(
      'https://embedwave.cc/embed/tv/95479/1/3',
    );
    expect(urlFor('server4', movie)).toBe(
      'https://watch.embed-api.stream/embed/movie/969681',
    );
    expect(urlFor('server4', episode)).toBe(
      'https://watch.embed-api.stream/embed/tv/95479/1/3',
    );
    expect(urlFor('server7', movie)).toBe(
      'https://vidsrc.sh/embed/movie/969681',
    );
    expect(urlFor('server7', episode)).toBe(
      'https://vidsrc.sh/embed/tv/95479/1/3',
    );
  });

  it('adds vidlink\'s next-episode button only for series', () => {
    expect(urlFor('server5', movie)).toBe('https://vidlink.pro/movie/969681');
    expect(urlFor('server5', episode)).toBe(
      'https://vidlink.pro/tv/95479/1/3?nextbutton=true',
    );
  });

  it('passes id, season and episode to multiembed', () => {
    expect(urlFor('server6', movie)).toBe(
      'https://multiembed.mov/?video_id=969681&tmdb=1',
    );
    expect(urlFor('server6', episode)).toBe(
      'https://multiembed.mov/?video_id=95479&tmdb=1&s=1&e=3',
    );
  });

  it('hides the disabled provider from playable servers', () => {
    expect(EMBED_SERVERS.some(server => server.disabled)).toBe(true);
    expect(PLAYABLE_SERVERS.every(server => !server.disabled)).toBe(true);
    expect(PLAYABLE_SERVERS).toHaveLength(6);
  });

  it('falls back to the first server for unknown preferences', () => {
    expect(embedServerById(null).id).toBe('server1');
    expect(embedServerById('legacy-vidsrc').id).toBe('server1');
    expect(embedServerById('server5').id).toBe('server5');
    expect(embedServerById('server2').id).toBe('server1');
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
