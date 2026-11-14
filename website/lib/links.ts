export const GITHUB_URL = 'https://github.com/ItzFallenMe/AniFox';
/** Page listing every APK across recent releases. */
export const DOWNLOAD_PAGE = '/download';
export const TMDB_URL = 'https://www.themoviedb.org';
export const CREATOR_URL = 'https://github.com/ItzFallenMe';

export const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Experience', href: '#experience' },
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

export const FAQS = [
  {
    q: 'Is AniFox free, and do I need an account?',
    a: 'AniFox is free and open source. You do not need an AniFox account or subscription. Connecting an external tracker is optional.',
  },
  {
    q: 'Does AniFox host videos?',
    a: 'No. Playback is provided by third-party embed hosts; AniFox does not host video. Metadata comes from services such as TMDB and AniList.',
  },
  {
    q: 'Does my app library sync with the website?',
    a: 'Not automatically. The Flutter app keeps its library, history and settings on that device. Optional AniList, MyAnimeList, Kitsu or Simkl connections can sync the progress those services support.',
  },
  {
    q: 'How does manga reading work?',
    a: 'AniFox lists MangaDex titles explicitly rated Safe and only offers chapters hosted by MangaDex. Chapters open in AniFox, in any available language, with a flag and language name. MangaDex ratings are community-maintained and are not a parental-control guarantee.',
  },
  {
    q: 'Can I download videos in the app?',
    a: 'The Flutter app can save supported direct-video or HLS links and manage them in Downloads. This requires a download provider to be configured for the AniFox deployment. The website shows provider download choices but does not keep offline files.',
  },
  {
    q: 'Where does streaming come from?',
    a: 'AniFox routes playback to four bundled third-party hosts: Vidly, VidBolt, Vidy and EmbedWave. Support varies by title and host, and availability is controlled by those providers.',
  },
  {
    q: 'What platforms can I use?',
    a: 'Use the web client in a browser, or download the Flutter app for Android, Windows, macOS or Linux when a build is available.',
  },
];
