import { TMDBService } from '../src/services/tmdb';

const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ results: [], page: 1, total_pages: 0, total_results: 0 }),
  });
  globalThis.fetch = mockFetch as unknown as typeof fetch;
});

const lastRequestUrl = () => new URL(mockFetch.mock.calls[0][0] as string);

describe('anime discovery', () => {
  it('queries Japanese animation series', async () => {
    await TMDBService.discoverAnimeTV(2);

    const url = lastRequestUrl();
    expect(url.pathname).toBe('/3/discover/tv');
    expect(url.searchParams.get('with_genres')).toBe('16');
    expect(url.searchParams.get('with_original_language')).toBe('ja');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('sort_by')).toBe('popularity.desc');
  });

  it('queries Japanese animation films', async () => {
    await TMDBService.discoverAnimeMovies();

    const url = lastRequestUrl();
    expect(url.pathname).toBe('/3/discover/movie');
    expect(url.searchParams.get('with_genres')).toBe('16');
    expect(url.searchParams.get('with_original_language')).toBe('ja');
  });

  it('scopes airing anime to the current season', async () => {
    await TMDBService.discoverAiringAnime();

    const url = lastRequestUrl();
    expect(url.searchParams.get('first_air_date.gte')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(url.searchParams.get('first_air_date.lte')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('searchMulti', () => {
  it('keeps only catalog-ready movies and shows', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        page: 1,
        total_pages: 1,
        total_results: 5,
        results: [
          { id: 1, title: 'Film', media_type: 'movie', poster_path: '/film.jpg' },
          { id: 2, name: 'Show', media_type: 'tv', poster_path: '/show.jpg' },
          { id: 3, name: 'Person', media_type: 'person', poster_path: '/person.jpg' },
          { id: 4, title: 'No poster', media_type: 'movie', poster_path: null },
          {
            id: 5,
            title: 'Not out yet',
            media_type: 'movie',
            poster_path: '/later.jpg',
            release_date: '2999-01-01',
          },
        ],
      }),
    });

    const response = await TMDBService.searchMulti('fox');

    expect(response.results.map(item => item.id)).toEqual([1, 2]);
    expect(response.results.map(item => item.media_type)).toEqual(['movie', 'tv']);
  });

  it('requests the catalog language and excludes adult results', async () => {
    await TMDBService.searchMulti('fox');

    const url = lastRequestUrl();
    expect(url.searchParams.get('language')).toBe('en-US');
    expect(url.searchParams.get('include_adult')).toBe('false');
    expect(url.pathname).toBe('/3/search/multi');
  });
});

describe('catalog policy', () => {
  it('drops entries without a usable poster from lists', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        page: 1,
        total_pages: 1,
        total_results: 2,
        results: [
          { id: 1, title: 'Kept', poster_path: '/kept.jpg', release_date: '2020-01-01' },
          { id: 2, title: 'Dropped', poster_path: null, release_date: '2020-01-01' },
        ],
      }),
    });

    const response = await TMDBService.getTrendingMovies();

    expect(response.results.map(movie => movie.id)).toEqual([1]);
  });

  it('keeps unreleased titles only in the upcoming catalog', async () => {
    const page = {
      page: 1,
      total_pages: 1,
      total_results: 1,
      results: [
        {
          id: 9,
          title: 'Future film',
          poster_path: '/future.jpg',
          release_date: '2999-01-01',
        },
      ],
    };
    mockFetch.mockResolvedValue({ ok: true, json: async () => page });

    const trending = await TMDBService.getTrendingMovies();
    expect(trending.results).toHaveLength(0);

    const upcoming = await TMDBService.getUpcomingMovies();
    expect(upcoming.results.map(movie => movie.id)).toEqual([9]);
  });
});

describe('detail endpoints', () => {
  it('requests the movie details at /movie/:id', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 7, title: 'Film', overview: 'Story' }),
    });

    const details = await TMDBService.getMovieDetails(7);

    const url = lastRequestUrl();
    expect(url.pathname).toBe('/3/movie/7');
    expect(details.title).toBe('Film');
  });

  it('requests trailers at /tv/:id/videos', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ type: 'Trailer', site: 'YouTube', key: 'official', official: true }],
      }),
    });

    await expect(TMDBService.getTrailerKey('tv', 42)).resolves.toBe('official');
    expect(lastRequestUrl().pathname).toBe('/3/tv/42/videos');
  });
});
