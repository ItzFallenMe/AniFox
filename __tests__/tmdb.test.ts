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
  it('drops people results and keeps movies and shows', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        page: 1,
        total_pages: 1,
        total_results: 3,
        results: [
          { id: 1, title: 'Film', media_type: 'movie' },
          { id: 2, name: 'Show', media_type: 'tv' },
          { id: 3, name: 'Person', media_type: 'person' },
        ],
      }),
    });

    const response = await TMDBService.searchMulti('fox');

    expect(response.results).toHaveLength(2);
    expect(response.results.map(item => item.media_type)).toEqual(['movie', 'tv']);
  });
});
