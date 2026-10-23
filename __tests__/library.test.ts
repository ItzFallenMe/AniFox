import { alertTimeForAirDate } from '../src/services/episodeAlerts';
import {
  clearWatchlist,
  isInWatchlist,
  toggleWatchlist,
  watchlistStore,
} from '../src/services/watchlist';
import {
  clearWatchHistory,
  recordWatch,
  watchHistoryStore,
} from '../src/services/watchHistory';
import {
  clearSearchHistory,
  recordSearch,
  searchHistoryStore,
} from '../src/services/searchHistory';
import { formatAirDate } from '../src/utils/format';
import type { MediaItem } from '../src/types';

const movie: MediaItem = {
  id: 550,
  media_type: 'movie',
  title: 'Fight Club',
  overview: '',
  poster_path: '/poster.jpg',
  backdrop_path: null,
};

const show: MediaItem = {
  id: 1399,
  media_type: 'tv',
  name: 'Game of Thrones',
  overview: '',
  poster_path: '/show.jpg',
  backdrop_path: null,
};

beforeEach(() => {
  clearWatchlist();
  clearWatchHistory();
  clearSearchHistory();
});

describe('watchlist', () => {
  it('toggles a title in and out', () => {
    expect(isInWatchlist(movie)).toBe(false);
    expect(toggleWatchlist(movie)).toBe(true);
    expect(isInWatchlist(movie)).toBe(true);
    expect(watchlistStore.getSnapshot()).toHaveLength(1);

    expect(toggleWatchlist(movie)).toBe(false);
    expect(watchlistStore.getSnapshot()).toHaveLength(0);
  });

  it('keeps movies and shows with the same id apart', () => {
    toggleWatchlist({ ...movie, id: 42 });
    toggleWatchlist({ ...show, id: 42 });
    expect(watchlistStore.getSnapshot()).toHaveLength(2);
  });
});

describe('watch history', () => {
  it('moves a rewatched title to the front and keeps one entry', () => {
    recordWatch(show, { season: 1, episode: 1 });
    recordWatch(movie);
    recordWatch(show, { season: 2, episode: 3, episodeName: 'The Door' });

    const entries = watchHistoryStore.getSnapshot();
    expect(entries).toHaveLength(2);
    expect(entries[0].item.id).toBe(show.id);
    expect(entries[0].season).toBe(2);
    expect(entries[0].episode).toBe(3);
  });
});

describe('search history', () => {
  it('dedupes case-insensitively and keeps the newest first', () => {
    recordSearch('anime');
    recordSearch('movies');
    recordSearch('Anime');
    expect(searchHistoryStore.getSnapshot()).toEqual(['Anime', 'movies']);
  });

  it('ignores one-character terms', () => {
    recordSearch('a');
    expect(searchHistoryStore.getSnapshot()).toEqual([]);
  });
});

describe('episode alert timing', () => {
  const now = new Date('2026-11-01T12:00:00').getTime();

  it('fires at 19:00 local on the air date', () => {
    const at = alertTimeForAirDate('2026-11-12', now);
    expect(at).not.toBeNull();
    expect(at?.getFullYear()).toBe(2026);
    expect(at?.getMonth()).toBe(10);
    expect(at?.getDate()).toBe(12);
    expect(at?.getHours()).toBe(19);
  });

  it('skips missing, malformed and past dates', () => {
    expect(alertTimeForAirDate(undefined, now)).toBeNull();
    expect(alertTimeForAirDate('', now)).toBeNull();
    expect(alertTimeForAirDate('12/11/2026', now)).toBeNull();
    expect(alertTimeForAirDate('2026-10-01', now)).toBeNull();
  });
});

describe('formatAirDate', () => {
  it('renders an ISO date', () => {
    expect(formatAirDate('2026-11-12')).toBe('Nov 12, 2026');
  });

  it('falls back for missing or malformed input', () => {
    expect(formatAirDate()).toBe('TBA');
    expect(formatAirDate('sometime')).toBe('sometime');
  });
});
