import {
  buildEmbedUrl,
  originOf,
  slugify,
  type ServerUrlConfig,
} from '../src/utils/streamUrl';

const defaultServer: ServerUrlConfig = { url: 'https://vidfast.pro' };

describe('buildEmbedUrl', () => {
  it('builds the default movie pattern with autoplay', () => {
    expect(
      buildEmbedUrl(defaultServer, { type: 'movie', tmdbId: 123 }),
    ).toBe('https://vidfast.pro/movie/123?autoplay=true');
  });

  it('builds the default TV pattern with season and episode', () => {
    expect(
      buildEmbedUrl(defaultServer, { type: 'tv', tmdbId: 456, season: 2, episode: 7 }),
    ).toBe('https://vidfast.pro/tv/456/2/7?autoplay=true');
  });

  it('uses a custom pattern verbatim and does not append autoplay', () => {
    const server: ServerUrlConfig = {
      url: 'https://videasy.to/',
      movieUrlPattern: '{url}/{type}/{tmdbId}',
    };
    expect(buildEmbedUrl(server, { type: 'movie', tmdbId: 9 })).toBe(
      'https://videasy.to/movie/9',
    );
  });

  it('fills type aliases and query parameters', () => {
    const server: ServerUrlConfig = {
      url: 'https://screenscape.me',
      movieUrlPattern: '{url}/embed?tmdb={tmdbId}&type={type}',
      movieTypeLabel: 'movies',
    };
    expect(buildEmbedUrl(server, { type: 'movie', tmdbId: 55 })).toBe(
      'https://screenscape.me/embed?tmdb=55&type=movies',
    );
  });

  it('fills season, episode, imdb and slug placeholders', () => {
    const server: ServerUrlConfig = {
      url: 'https://cinejoy.to',
      tvUrlPattern:
        '{url}/watch/{type}/{tmdbId}-{slug}?s={season}&e={episode}&imdb={imdbId}',
    };
    expect(
      buildEmbedUrl(server, {
        type: 'tv',
        tmdbId: 10,
        season: 1,
        episode: 3,
        imdbId: 'tt123',
        title: 'Jujutsu Kaisen',
      }),
    ).toBe('https://cinejoy.to/watch/tv/10-jujutsu-kaisen?s=1&e=3&imdb=tt123');
  });
});

describe('helpers', () => {
  it('slugifies titles', () => {
    expect(slugify('Spy × Family')).toBe('spy-family');
  });

  it('derives the server origin', () => {
    expect(originOf('https://vidlink.pro/')).toBe('https://vidlink.pro');
  });
});
