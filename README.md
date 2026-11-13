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

<p align="center">
  <a href="https://github.com/ItzFallenMe/AniFox/actions/workflows/test-apk.yml"><img alt="Test APK" src="https://github.com/ItzFallenMe/AniFox/actions/workflows/test-apk.yml/badge.svg" /></a>
  <a href="https://github.com/ItzFallenMe/AniFox/releases"><img alt="Latest release" src="https://img.shields.io/github/v/release/ItzFallenMe/AniFox?label=release" /></a>
  <a href="LICENSE"><img alt="License: GPL-3.0" src="https://img.shields.io/badge/license-GPL--3.0-orange" /></a>
</p>

> **AniFox: Reimagined** — this branch is the rebuilt app. The `main` branch
> still contains the earlier code and will be replaced once the rebuild is
> complete.

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
- **Web client** — a bingr.one-inspired streaming UI with a floating top
  navigation, ranked Top 10 rail, animated poster rails and Chromecast support.
- **No ads, no accounts required.**

## Credits

AniFox is created and maintained by
[ItzFallenMe](https://github.com/ItzFallenMe). The web client also credits TMDB,
AniList and MyAnimeList for metadata, and the third-party embed hosts that
supply playback. A full credits page lives at `/credits` on the website.

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

Downloads use your own licensed provider. Point the app at it at build time;
`DOWNLOAD_API_KEY` is optional and is sent as a bearer token:

```bash
flutter build apk --release \
  --dart-define=DOWNLOAD_API_URL="https://your-download-api.example.com" \
  --dart-define=DOWNLOAD_API_KEY="$DOWNLOAD_API_KEY"
```

The provider must expose `GET /downloads` with the query and response shape
described in [`website/README.md`](website/README.md). Without these defines the
download button reports that downloads are not configured.

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
third-party embed iframe. Saving media for offline use is optional and goes
through the operator's own licensed download provider (`DOWNLOAD_API_URL`), via
the server-side `/api/download/*` proxy. The landing page shows the combined
GitHub release-asset download count.

The site deploys to Vercel or Cloudflare (through the OpenNext adapter, see
[`website/README.md`](website/README.md)). Chromecast requires a custom receiver
application id — setup is documented there too.

To enable web manga, set `MANGA_API_URL` to the deployed AniFox Manga API URL in
`website/.env.local` and in the website deployment's environment settings.
See [website/README.md](website/README.md) for all routes and configuration.

## CI & releases

Two GitHub Actions workflows are included:

- **Test APK** (`.github/workflows/test-apk.yml`) — runs `flutter analyze` and
  uploads a debug APK on pushes and pull requests.
- **Release APK** (`.github/workflows/release-apk.yml`) — triggered by a `v*`
  tag, builds split-per-ABI release APKs and attaches them to a GitHub release.

Release builds are signed with the keystore provided through the
`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` and
`ANDROID_KEY_PASSWORD` repository secrets. Without them the build still
completes and is debug-signed.

```bash
git tag v2.1.5
git push origin v2.1.5
```

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
