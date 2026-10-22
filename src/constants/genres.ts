/** TMDB genre ids used by the home feed, plus their display names. */

export const GENRE_IDS = {
  action: 28,
  animation: 16,
  comedy: 35,
  crime: 80,
  drama: 18,
  horror: 27,
  romance: 10749,
  sciFi: 878,
  thriller: 53,
} as const;

const GENRE_NAMES: Record<number, string> = {
  [GENRE_IDS.action]: 'Action',
  [GENRE_IDS.animation]: 'Animation',
  [GENRE_IDS.comedy]: 'Comedy',
  [GENRE_IDS.crime]: 'Crime',
  [GENRE_IDS.drama]: 'Drama',
  [GENRE_IDS.horror]: 'Horror',
  [GENRE_IDS.romance]: 'Romance',
  [GENRE_IDS.sciFi]: 'Sci-Fi',
  [GENRE_IDS.thriller]: 'Thriller',
};

export const getGenreName = (genreId: number): string =>
  GENRE_NAMES[genreId] ?? 'Featured';
