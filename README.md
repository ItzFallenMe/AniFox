# AniFox

<p align="center">
  <img src="assets/images/app_logo.png" width="160" alt="AniFox logo" />
</p>

<p align="center">
  A clean, ad-free client for anime, movies, TV shows and manga — built with
  Flutter for Android, iOS, macOS, Windows and Linux, plus a Next.js web client.
  <br />
  Built by <a href="https://github.com/ItzFallenMe">ItzFallenMe</a>.
</p>

<p align="center">
  <a href="https://github.com/ItzFallenMe/AniFox/actions/workflows/test-apk.yml"><img alt="Test APK" src="https://github.com/ItzFallenMe/AniFox/actions/workflows/test-apk.yml/badge.svg" /></a>
  <a href="https://github.com/ItzFallenMe/AniFox/releases"><img alt="Latest release" src="https://img.shields.io/github/v/release/ItzFallenMe/AniFox?label=release" /></a>
  <a href="LICENSE"><img alt="License: GPL-3.0" src="https://img.shields.io/badge/license-GPL--3.0-orange" /></a>
</p>

> **AniFox: Reimagined** — this branch is the rebuilt app with the current web
> client and app. It becomes `main` when the rebuild is released.

## What AniFox is

AniFox is a front-end. It reads public metadata from TMDB, AniList and
MyAnimeList, and plays media through third-party embed hosts. Nothing is hosted,
uploaded or stored by this project, and no account is required.

The repository contains two clients and the manga API they share:

| Part | Path | Stack |
| --- | --- | --- |
| Flutter app | `lib/` | Flutter, Riverpod, Material 3 |
| Web client and landing page | `website/` | Next.js, TypeScript, Tailwind |
| Manga API | `server/anifox-manga-api/` | Express on Vercel |

## Highlights

- **Metadata-first browsing** — trending, popular, top-rated and upcoming lists
  for movies, TV and anime, with search across all three.
- **Bundled stream hosts** — playback uses four built-in embed servers (Vidly,
  VidBolt, Vidy, EmbedWave). No extensions to install.
- **Library and tracking** — keep a local library and sync progress with AniList,
  MyAnimeList, Kitsu and Simkl.
- **Continue watching** — resume an episode or film from the home rail.
- **Downloads through your provider** — the provider page opens inside AniFox,
  and the quality links it produces are saved to `AniFox/downloads` and playable
  from Downloads.
- **Personalisation** — colour schemes, dynamic colour, AMOLED black, home
  layout, header and navigation styles, UI scale, card density and a TV layout.
- **Local-first data** — library, history and settings stay on device and can be
  exported or restored.
- **Manga reader** — catalog, chapter list and a paged reader backed by the
  optional AniFox Manga API.
- **Chromecast on the web** — a custom receiver at `/cast` drives the player.
- **No ads, no accounts required.**

## Getting started

Requirements:

- Flutter `3.41.x` or newer (pinned in `.fvmrc`; `fvm flutter` works too)
- Dart `3.9.x` or newer
- Toolchains for the platforms you build

```bash
flutter pub get
flutter run
```

Anime works without any keys. Movies and TV need a free TMDB API key for title
matching. Pass it at build time — never commit it:

```bash
export TMDB_API_KEY="your-tmdb-key"
flutter run --dart-define=TMDB_API_KEY="$TMDB_API_KEY"
```

### Build-time configuration

| Define | Required | Purpose |
| --- | --- | --- |
| `TMDB_API_KEY` | For movies and TV | TMDB metadata and ID matching |
| `DOWNLOAD_URL` | Only for downloads | Base URL of your licensed download provider |
| `MANGA_API_URL` | Only for manga | Root URL of the deployed AniFox Manga API |

```bash
flutter build apk --release \
  --dart-define=TMDB_API_KEY="$TMDB_API_KEY" \
  --dart-define=DOWNLOAD_URL="https://downloads.example.com" \
  --dart-define=MANGA_API_URL="https://your-manga-api.vercel.app"
```

Do not append `/api` to `MANGA_API_URL`.

### Downloads

Downloads are provided by an operator you are licensed to use — AniFox ships no
download source. Set `DOWNLOAD_URL` to that provider's origin. The app opens
that page inside AniFox, intercepts the file links it produces and saves them
to `AniFox/downloads`:

| Platform | Folder |
| --- | --- |
| Windows, macOS, Linux | `Downloads/AniFox/downloads` |
| Android | `AniFox/downloads` on shared storage when file access is granted; otherwise the app's private `AniFox/downloads` |
| iOS | `AniFox/downloads` inside the app's documents |

The provider page uses these routes:

```
/movie/{tmdbId}
/tv/{tmdbId}/{season}/{episode}
/anime/{anilistId}/{episode}
```

The provider authorises the request by allowed domain, so no API key is
involved; add your app or site to the provider's allowlist. Without
`DOWNLOAD_URL` the download button reports that downloads are not configured.

### Builds

```bash
flutter build apk --release        # Android
flutter build appbundle --release  # Play Store bundle
flutter build ios --release        # iOS (macOS host)
flutter build macos --release      # macOS
flutter build windows --release    # Windowsflutter build linux --release          # Linux
```

Tagging `v*` publishes release builds for `arm64-v8a`, `armeabi-v7a` and
`x86_64`, plus a universal APK and a `SHA256SUMS.txt` file, through the
`Release APK` workflow.

Display names, bundle identifiers and icons live in `package_rename_config.yaml`
and `flutter_launcher_icons.yaml`. After changing the logo:

```bash
dart run flutter_launcher_icons
```

## Web client

`website/` contains the landing page at `/` and the streaming client at `/home`,
plus catalogs, title pages, the player and the manga reader. It is a separate
Next.js app with its own README.

```bash
cd website
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000> for the landing page, <http://localhost:3000/home>
for the client. Website environment variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `TMDB_API_KEY` | For movies and TV | Server-side TMDB proxy only; never sent to the browser |
| `NEXT_PUBLIC_STREAM_API_URL` | No | Extra embed source, listed first when set |
| `NEXT_PUBLIC_DOWNLOAD_URL` | No | Download provider origin, embedded by allowed domain |
| `NEXT_PUBLIC_CAST_RECEIVER_APP_ID` | For Cast | Custom receiver application id |
| `MANGA_API_URL` | No | Manga API root URL (no `/api`) |

The site deploys to Vercel or Cloudflare through the OpenNext adapter. See
[`website/README.md`](website/README.md) for routes, the download provider
contract, Chromecast setup and deploy commands.

## Manga API

`server/anifox-manga-api/` is the customized manga backend used by both the app
and the web client. It proxies search, catalog, title and chapter-page requests
and stores no content itself.

```bash
cd server/anifox-manga-api/server
npm install
cp .env.example .env
npm run dev
```

Metadata and page images come from the public [MangaDex API](https://api.mangadex.org/docs/);
no API key is required. Deploy the `server` directory to Vercel, then point the
clients at the deployment:

| Client | Setting |
| --- | --- |
| Web | `MANGA_API_URL` in `website/.env.local` or the hosting environment |
| App | `--dart-define=MANGA_API_URL=https://your-manga-api.vercel.app` |

Use the deployment root URL in both cases; do not append `/api`. A `502` from
the API means MangaDex could not be reached, so retry or check
`MANGADEX_API_URL` if you pointed it at a proxy.

## Project structure

```
lib/
  common/      shared models, widgets, cards and providers
  core/        bootstrap, routing, networking, storage, theme, updates
  modules/     browse, playback, library, history, tracking, downloads,
               preferences, reader, tv, alerts, launch
  streaming/   bundled embed hosts, URL building, metadata sources
  assets/      images and icons
website/       Next.js landing page and web client
server/        manga API used by both clients
```

## CI and releases

- **Test APK** (`test-apk.yml`) — runs `flutter analyze` and uploads a debug APK
  on pushes and pull requests.
- **Release APK** (`release-apk.yml`) — on a `v*` tag, builds split-per-ABI
  release APKs and attaches them to a GitHub release.

Release signing uses the `ANDROID_KEYSTORE_BASE64`,
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` and `ANDROID_KEY_PASSWORD`
repository secrets. Without them the build completes debug-signed.

```bash
git tag v2.1.5
git push origin v2.1.5
```

## Troubleshooting

- **No movie or TV results** — `TMDB_API_KEY` is missing from the build. Rebuild
  with the define; changing it at runtime has no effect.
- **A title opens the wrong match** — anime is matched to TMDB by title and year.
  Use the title page's AniList or MyAnimeList link to confirm the entry.
- **The download button says downloads are not configured** — the build has no
  `DOWNLOAD_URL`. Rebuild with your provider's origin.
- **A download stays in the provider page** — the provider opened a format the
  app does not intercept (for example a blob or a ZIP). Use a direct MP4, MKV or
  HLS link, or download from the site instead.
- **Downloads are not visible on Android** — grant file access when prompted.
  Without it AniFox keeps files in its private `AniFox/downloads` folder.
- **Manga is empty** — `MANGA_API_URL` is unset, or the API deployment failed.
  Check the API URL first, then the site or app configuration.
- **Chromecast button is disabled** — the web build has no
  `NEXT_PUBLIC_CAST_RECEIVER_APP_ID`, or the site is not served over HTTPS.

## Community

- [Contributing guide](CONTRIBUTING.md) — setup, checks and pull request rules
- [Code of conduct](CODE_OF_CONDUCT.md)
- [Security policy](SECURITY.md) — report vulnerabilities privately
- [Changelog](CHANGELOG.md) — what changed in each release
- [Issues](https://github.com/ItzFallenMe/AniFox/issues) and
  [discussions](https://github.com/ItzFallenMe/AniFox/discussions)

## Legal

AniFox does not host, upload or distribute any video or manga content. All media
is streamed from third-party providers that are publicly available on the
internet. AniFox is not affiliated with those providers, nor with TMDB, AniList,
MyAnimeList or any other metadata service. Users are responsible for complying
with the laws of their country, and downloads are only lawful with a licensed
provider.

## License

AniFox is free software licensed under the **GNU General Public License v3.0**.
See [LICENSE](LICENSE). This project is a derivative of
[AnymeX](https://github.com/RyanYuuki/AnymeX) and keeps the same license.
