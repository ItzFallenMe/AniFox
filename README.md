# AniFox

<p align="center">
  <img src="assets/images/app_logo.png" width="160" alt="AniFox logo" />
</p>

<p align="center">
  A clean, ad-free anime, movie and TV streaming client for Android, iOS,
  macOS, Windows, Linux and the web.
  <br />
  Built by <a href="https://github.com/ItzFallenMe">ItzFallenMe</a>.
</p>

## Features

- **Metadata-first browsing** – discover anime, movies and TV shows using TMDB,
  AniList and MyAnimeList metadata.
- **Built-in stream hosts** – playback uses four bundled embed servers
  (Vidly, VidBolt, Vidy, EmbedWave) without user-managed extensions.
- **Library & tracking** – keep a local library and sync progress with AniList,
  MyAnimeList, Kitsu and Simkl.
- **Continue watching** – pick up from where you left off.
- **Offline downloads** – capture HLS/MP4 streams from the player, decrypt
  AES-128 segments and keep episodes available offline.
- **Personalisation** – multiple themes, dynamic colour, configurable home
  layout, navigation styles, TV-friendly layout and an optional Liquid Glass
  navigation surface (toggle it in Settings → UI).
- **Local-first data** – library, history and settings stay on device; backups can
  be exported and restored.
- **No ads, no accounts required.**

## Getting started

Requirements:

- Flutter `3.41.x` or newer (the repo pins a version in `.fvmrc`)
- Dart `3.9.x` or newer
- Platform toolchains for the targets you want to build

```bash
flutter pub get
flutter run
```

Anime metadata and playback work without a TMDB key. Movie and TV playback may
need a free TMDB API key for title matching. Pass it as a build-time define; do
not commit it to the repository:

```bash
export TMDB_API_KEY="your-tmdb-v3-key"
flutter run --dart-define=TMDB_API_KEY="$TMDB_API_KEY"
flutter build apk --release --dart-define=TMDB_API_KEY="$TMDB_API_KEY"
```

Builds:

```bash
flutter build apk --release        # Android
flutter build ios --release        # iOS (macOS host required)
flutter build macos --release      # macOS
flutter build windows --release    # Windows
flutter build linux --release      # Linux
```

App display names, bundle identifiers and icons are configured in
`package_rename_config.yaml` and `flutter_launcher_icons.yaml`. After changing the
logo, run:

```bash
dart run flutter_launcher_icons
```

## Web app

`website/` contains the AniFox website and web client — Next.js, TypeScript and
Tailwind. `/` is the app download landing page, `/home` opens the streaming app,
and `/manga` opens the manga catalog and reader.

```bash
cd website
npm install
cp .env.example .env.local
npm run dev
```

Set `TMDB_API_KEY` in `website/.env.local` for movie and TV metadata. The key is
used only by the server-side TMDB proxy; there is no key-entry UI or browser
storage. Anime metadata comes from AniList. Playback stays in the selected
third-party embed iframe; the web app does not download media. The landing page
shows the combined GitHub release-asset download count.

To enable web manga, set `MANGA_API_URL` to the deployed AniFox Manga API URL in
`website/.env.local` and in the website deployment's environment settings.
See [website/README.md](website/README.md) for all routes and configuration.

## Manga API

The optional `server/anifox-manga-api/server/` project is a standalone manga
backend intended for Vercel. Set `DATAPROVIDER_URL` on the API deployment to the
upstream catalog host. After deploying it, point the website and Flutter build
at the API's public root URL (do not append `/api`):

```bash
flutter run --dart-define=MANGA_API_URL="https://your-manga-api.vercel.app"
```

The API URL is deliberately not hard-coded. Flutter uses it to search and match
manga, load chapters and read page images; the website proxies catalog, title,
and chapter requests through its server routes. Deploy the API before enabling
these clients.

## Project structure

```
lib/
  common/      shared models, widgets and providers
  core/        app bootstrap, routing, networking, storage, updates
  modules/     feature modules (browse, playback, library, history, tracking,
               preferences, welcome, launch, reader, tv)
  streaming/   bundled embed hosts, URL building and metadata sources
  assets/       images and app icons
website/       Next.js web client
server/        optional Vercel manga API
```

## Legal

AniFox does not host, upload or distribute any video or manga content. All media
is streamed from third-party providers that are publicly available on the
internet. AniFox is not affiliated with any of those providers, nor with TMDB,
AniList, MyAnimeList or any other metadata service. Users are responsible for
complying with the laws of their country.

## License

AniFox is free software licensed under the **GNU General Public License v3.0**.
See [LICENSE](LICENSE) for the full text.

This project is a derivative of the open-source
[AnymeX](https://github.com/RyanYuuki/AnymeX) project and keeps the same license.
