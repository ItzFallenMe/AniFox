import {
  canShowInCatalog,
  getMediaTitle,
  getOverviewText,
  getTrailerKey,
  isDateReleased,
  isPosterValid,
  isStatusReleased,
  needsOverviewFallback,
} from '../src/services/tmdbPolicy';

const DAY = 86400000;
const isoDaysFromNow = (days: number) =>
  new Date(Date.now() + days * DAY).toISOString().slice(0, 10);

describe('isPosterValid', () => {
  it('accepts TMDB paths and rejects everything else', () => {
    expect(isPosterValid('/abc123.jpg')).toBe(true);
    expect(isPosterValid('')).toBe(false);
    expect(isPosterValid(null)).toBe(false);
    expect(isPosterValid(undefined)).toBe(false);
    expect(isPosterValid('abc123.jpg')).toBe(false);
    expect(isPosterValid('/')).toBe(false);
    expect(isPosterValid('/a b.jpg')).toBe(false);
  });
});

describe('isDateReleased', () => {
  it('treats today and the past as released, the future as not', () => {
    expect(isDateReleased(isoDaysFromNow(-30))).toBe(true);
    expect(isDateReleased(isoDaysFromNow(0))).toBe(true);
    expect(isDateReleased(isoDaysFromNow(30))).toBe(false);
  });

  it('rejects empty, missing and malformed dates', () => {
    expect(isDateReleased('')).toBe(false);
    expect(isDateReleased(null)).toBe(false);
    expect(isDateReleased('not-a-date')).toBe(false);
  });
});

describe('isStatusReleased', () => {
  it('requires movies to be Released', () => {
    expect(isStatusReleased('movie', 'Released')).toBe(true);
    expect(isStatusReleased('movie', 'Post Production')).toBe(false);
  });

  it('rejects series that have not started airing', () => {
    expect(isStatusReleased('tv', 'Returning Series')).toBe(true);
    expect(isStatusReleased('tv', 'In Production')).toBe(false);
    expect(isStatusReleased('tv', 'Planned')).toBe(false);
    expect(isStatusReleased('tv', 'Pilot')).toBe(false);
  });
});

describe('canShowInCatalog', () => {
  const released = {
    id: 1,
    title: 'A Film',
    poster_path: '/poster.jpg',
    release_date: '2020-05-01',
  };

  it('keeps a released title with a poster and a name', () => {
    expect(canShowInCatalog(released, 'movie')).toBe(true);
  });

  it('rejects people, missing posters and nameless entries', () => {
    expect(canShowInCatalog({ ...released, media_type: 'person' }, undefined)).toBe(
      false,
    );
    expect(canShowInCatalog({ ...released, poster_path: null }, 'movie')).toBe(false);
    expect(canShowInCatalog({ id: 2, poster_path: '/p.jpg' }, 'movie')).toBe(false);
  });

  it('rejects future releases unless the catalog allows unreleased titles', () => {
    const future = {
      ...released,
      title: undefined,
      name: 'Future Series',
      release_date: undefined,
      first_air_date: isoDaysFromNow(60),
    };
    expect(canShowInCatalog(future, 'tv')).toBe(false);
    expect(canShowInCatalog(future, 'tv', { allowUnreleased: true })).toBe(true);
  });

  it('rejects titles whose status says they are still in production', () => {
    expect(
      canShowInCatalog(
        { ...released, status: 'Post Production', release_date: isoDaysFromNow(-1) },
        'movie',
      ),
    ).toBe(false);
  });
});

describe('getMediaTitle', () => {
  it('prefers the localized title and falls back to the original', () => {
    expect(getMediaTitle({ id: 1, title: 'Localized' })).toBe('Localized');
    expect(getMediaTitle({ id: 1, name: 'Localized show' })).toBe('Localized show');
    expect(getMediaTitle({ id: 1, title: '  ', original_title: 'Original' })).toBe(
      'Original',
    );
    expect(getMediaTitle({ id: 1 })).toBe('Untitled');
  });
});

describe('getOverviewText', () => {
  it('never returns an empty paragraph', () => {
    expect(getOverviewText('A story.')).toBe('A story.');
    expect(getOverviewText('   ')).toBe('Synopsis not yet available.');
    expect(getOverviewText(undefined)).toBe('Synopsis not yet available.');
  });
});

describe('getTrailerKey', () => {
  it('prefers an official YouTube trailer', () => {
    expect(
      getTrailerKey({
        results: [
          { type: 'Trailer', site: 'Vimeo', key: 'vimeo' },
          { type: 'Trailer', site: 'YouTube', key: 'one' },
          { type: 'Trailer', site: 'YouTube', key: 'two', official: true },
        ],
      }),
    ).toBe('two');
  });

  it('falls back to the first YouTube trailer and then to null', () => {
    expect(
      getTrailerKey({
        results: [
          { type: 'Teaser', site: 'YouTube', key: 'teaser' },
          { type: 'Trailer', site: 'YouTube', key: 'trailer' },
        ],
      }),
    ).toBe('trailer');
    expect(getTrailerKey({ results: [] })).toBeNull();
    expect(getTrailerKey(undefined)).toBeNull();
  });
});

describe('needsOverviewFallback', () => {
  it('flags payloads with any empty synopsis', () => {
    expect(needsOverviewFallback({ overview: 'Full' })).toBe(false);
    expect(needsOverviewFallback({ overview: '' })).toBe(true);
    expect(
      needsOverviewFallback({ overview: 'Full', seasons: [{ overview: '  ' }] }),
    ).toBe(true);
    expect(needsOverviewFallback({ overview: 'Full', episodes: [{ overview: '' }] })).toBe(
      true,
    );
  });
});
