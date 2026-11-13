export const GITHUB_URL = 'https://github.com/ItzFallenMe/AniFox';
export const RELEASES_URL = `${GITHUB_URL}/releases/latest`;
/** Server route that redirects to the newest APK on GitHub releases. */
export const DOWNLOAD_URL = '/api/release';
/** Page listing every APK across recent releases. */
export const DOWNLOAD_PAGE = '/download';
export const TMDB_URL = 'https://www.themoviedb.org';
export const CREATOR_URL = 'https://github.com/ItzFallenMe';

export const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Experience', href: '#experience' },
  { label: 'Servers', href: '#servers' },
  { label: 'FAQ', href: '#faq' },
];

/** Poster snapshots used by the UI mockups. */
export const POSTERS = [
  {
    title: 'Frieren',
    src: 'https://image.tmdb.org/t/p/w342/dqZENchTd7lp5zht7BdlqM7RBhD.jpg',
  },
  {
    title: 'Jujutsu Kaisen',
    src: 'https://image.tmdb.org/t/p/w342/fHpKWq9ayzSk8nSwqRuaAUemRKh.jpg',
  },
  {
    title: 'Dune: Part Two',
    src: 'https://image.tmdb.org/t/p/w342/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
  },
  {
    title: 'Attack on Titan',
    src: 'https://image.tmdb.org/t/p/w342/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg',
  },
  {
    title: 'Your Name',
    src: 'https://image.tmdb.org/t/p/w342/q719jXXEzOoYaps6babgKnONONX.jpg',
  },
  {
    title: 'Interstellar',
    src: 'https://image.tmdb.org/t/p/w342/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
  },
];

export const PROVIDERS = [
  { name: 'Vidly', note: 'Default · anime, TV, movies' },
  { name: 'VidBolt', note: 'Alternative · anime, TV, movies' },
  { name: 'Vidy', note: 'Anime and TV' },
  { name: 'EmbedWave', note: 'Movies and TV · TMDB IDs' },
];

export const FAQS = [
  {
    q: 'Is AniFox free?',
    a: 'Yes. AniFox is a free, open-source app. There is no account, no subscription and no locked tab — the catalogue, player and library are available from day one.',
  },
  {
    q: 'Does AniFox host or upload any video?',
    a: 'No. AniFox resolves or redirects to third-party playback providers, which serve their own player and media. AniFox does not host or proxy video bytes. Metadata and artwork come from TMDB and AniList.',
  },
  {
    q: 'Why are there several servers?',
    a: 'Every provider resolves streams differently. If one is slow or a title is missing, switch providers from the player. Providers control availability and may display their own ads.',
  },
  {
    q: 'What works without a connection?',
    a: 'Your watchlist, resume history, search history and episode alerts are stored on-device, so the library opens instantly. Playback itself always comes from the streaming providers and needs a connection.',
  },
  {
    q: 'How do episode alerts work?',
    a: 'In supported Flutter app builds, open a series and tap the bell next to its next episode. AniFox schedules a local notification on your device; it does not use a push server.',
  },
  {
    q: 'Where does Discord Rich Presence appear?',
    a: 'Android uses Discord’s Social SDK RPC service; Windows, macOS and Linux use desktop RPC. Both require DISCORD_APPLICATION_ID and Discord installed. iOS needs extra Discord account-linking setup; web Rich Presence is not supported.',
  },
];
