import type { CatalogKey } from '../config/catalogs';
import { TMDBService, tagMovies, tagShows } from './tmdb';
import type { MediaItem } from '../types';

export interface CatalogPage {
  items: MediaItem[];
  page: number;
  totalPages: number;
}

/** TMDB never paginates past 500 pages. */
export const MAX_CATALOG_PAGES = 500;

const pageOf = (items: MediaItem[], page: number, totalPages: number): CatalogPage => ({
  items,
  page,
  totalPages: Math.max(1, Math.min(totalPages, MAX_CATALOG_PAGES)),
});

/** One page of a named catalog, tagged for navigation. */
export const fetchCatalogPage = async (
  key: CatalogKey,
  page = 1,
  region?: string,
): Promise<CatalogPage> => {
  switch (key) {
    case 'popularMovies': {
      const response = await TMDBService.getPopularMovies(page, region);
      return pageOf(tagMovies(response.results), response.page, response.total_pages);
    }
    case 'nowPlaying': {
      const response = await TMDBService.getNowPlayingMovies(page, region);
      return pageOf(tagMovies(response.results), response.page, response.total_pages);
    }
    case 'upcoming': {
      const response = await TMDBService.getUpcomingMovies(page, region);
      return pageOf(tagMovies(response.results), response.page, response.total_pages);
    }
    case 'topRatedMovies': {
      const response = await TMDBService.getTopRatedMovies(page, region);
      return pageOf(tagMovies(response.results), response.page, response.total_pages);
    }
    case 'trendingMovies': {
      const response = await TMDBService.getTrendingMovies(page);
      return pageOf(tagMovies(response.results), response.page, response.total_pages);
    }
    case 'popularTv': {
      const response = await TMDBService.getPopularTVShows(page, region);
      return pageOf(tagShows(response.results), response.page, response.total_pages);
    }
    case 'airingToday': {
      const response = await TMDBService.getAiringTodayTV(page);
      return pageOf(tagShows(response.results), response.page, response.total_pages);
    }
    case 'onTheAir': {
      const response = await TMDBService.getOnTheAirTV(page);
      return pageOf(tagShows(response.results), response.page, response.total_pages);
    }
    case 'topRatedTv': {
      const response = await TMDBService.getTopRatedTVShows(page);
      return pageOf(tagShows(response.results), response.page, response.total_pages);
    }
    case 'trendingTv': {
      const response = await TMDBService.getTrendingTVShows(page);
      return pageOf(tagShows(response.results), response.page, response.total_pages);
    }
    default:
      return pageOf([], page, 1);
  }
};
