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
  { name: 'AniFox Provider', note: 'Ad-free default' },
  { name: 'EmbedWave', note: 'Fast mirrors' },
  { name: 'Embed API', note: 'Wide catalogue' },
  { name: 'VidLink', note: 'Clean player' },
  { name: 'MultiEmbed', note: 'Fallback' },
  { name: 'VidSrc', note: 'Backup stream' },
];

export const FAQS = [
  {
    q: 'Is AniFox free?',
    a: 'Yes. AniFox is a free, open-source Android client. There is no account, no subscription and no locked tab — the whole catalogue, player and library are available from day one.',
  },
  {
    q: 'Does AniFox host or upload any video?',
    a: 'No. Metadata and artwork come from TMDB, while playback is embedded from third-party providers. AniFox stores no media and hosts nothing. All titles and trademarks belong to their owners.',
  },
  {
    q: 'Why are there several servers?',
    a: 'Every provider resolves streams differently. If one is slow or a title is missing, the player can switch providers instantly without losing your place. The default provider is ad-free and is tried first.',
  },
  {
    q: 'What works without a connection?',
    a: 'Your watchlist, resume history, search history and episode alerts are stored on-device, so the library opens instantly. Playback itself always comes from the streaming providers and needs a connection.',
  },
  {
    q: 'How do episode alerts work?',
    a: 'Open a series and tap the bell next to its next episode. AniFox schedules a local Android notification for the air date at 19:00 — it arrives even when the app is closed. You can cancel any alert from the Alerts screen.',
  },
  {
    q: 'Where does Discord Rich Presence appear?',
    a: 'Presence is optional and off by default. Once enabled in Settings, your Discord profile shows the title and episode you are watching while the player is open. It needs the Discord Social SDK linked into the build and a client ID — the repository includes the bridge and setup guide.',
  },
];
