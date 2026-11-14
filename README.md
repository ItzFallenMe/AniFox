# AniFox

<p align="center">
  <img src="assets/images/app_logo.png" width="160" alt="AniFox logo" />
</p>

<p align="center">
  A free client for anime, movies, TV shows and manga — built with
  Flutter for Android, iOS, macOS, Windows and Linux, plus a Next.js web client.
  <br />
  Built by <a href="https://github.com/ItzFallenMe">ItzFallenMe</a>.
</p>

<p align="center">
  <a href="https://github.com/ItzFallenMe/AniFox/actions/workflows/test-apk.yml"><img alt="Test APK" src="https://github.com/ItzFallenMe/AniFox/actions/workflows/test-apk.yml/badge.svg" /></a>
  <a href="https://github.com/ItzFallenMe/AniFox/releases"><img alt="Latest release" src="https://img.shields.io/github/v/release/ItzFallenMe/AniFox?label=release" /></a>
  <a href="https://github.com/ItzFallenMe/AniFox/releases"><img alt="Total app downloads" src="https://img.shields.io/github/downloads/ItzFallenMe/AniFox/total?label=app%20downloads" /></a>
  <a href="LICENSE"><img alt="License: GPL-3.0" src="https://img.shields.io/badge/license-GPL--3.0-orange" /></a>
</p>

## What AniFox is

AniFox is one project with Flutter clients, a Next.js web client, and a shared
API hosted by the web app. The API provides MangaDex catalog/reader data and
validated links to third-party streaming and download providers. AniFox does not
proxy streaming or download media.

The repository contains two clients and the manga API they share:

| Part | Path | Stack |
| --- | --- | --- |
| Flutter app | `lib/` | Flutter, Riverpod, Material 3 |
| Web client and landing page | `website/` | Next.js, TypeScript, Tailwind |
| Shared API and website | `website/app/api/` | Next.js routes deployed with the web client |
| Manga source adapters | `server/anifox-manga-api/server/` | Node-compatible modules bundled into the web API |

## Highlights

- **Metadata-first browsing** — trending, popular, top-rated and upcoming lists
  for movies, TV and anime, with search across all three.
- **Bundled stream hosts** — the shared `/api/stream` route validates requests
  and redirects to four built-in embed servers (Vidly, VidBolt, Vidy, EmbedWave).
- **Library and tracking** — keep a local library and sync progress with AniList,
  MyAnimeList, Kitsu and Simkl.
- **Continue watching and reading** — keep local anime episode and manga page
  history. Embedded video hosts do not expose playback timestamps, so the app can
  remember the selected episode but cannot resume its exact position.
- **Provider-backed downloads** — when `DOWNLOAD_PROVIDER_URL` is configured,
  the website lists available provider links and the Flutter app can save
  supported media for offline playback in `AniFox/downloads`.
- **Personalisation** — colour schemes, dynamic colour, AMOLED black, home
  layout, header and navigation styles, UI scale, card density and a TV layout.
- **Local-first data** — library, history and settings stay on device and can be
  exported or restored.
- **Manga reader** — MangaDex catalog and chapter reader, restricted to titles
  MangaDex explicitly rates Safe.
- **Discord Rich Presence** — Android uses Discord's Social SDK RPC service;
  Windows, macOS and Linux use desktop RPC. Configure `DISCORD_APPLICATION_ID`
  in the root `.env`. iOS and web integrations are not implemented; see
  [Discord notes](docs/DISCORD_RICH_PRESENCE.md).
- **No AniFox account required.** Third-party playback providers may show their
  own ads and have their own availability and policies.

## Getting started

Requirements:

- Flutter `3.44.0` (pinned in `.fvmrc`; `fvm flutter` works too)
- Dart `3.9.x` or newer
- Node.js `22+` for the website and Cloudflare Worker tooling
- Toolchains for the platforms you build

```bash
cp .env.example .env
npm install --prefix website
flutter pub get
npm run web:dev
```

For Flutter commands, use the root wrapper to forward `.env` values as build
defines:

```bash
npm run flutter -- run
```

For an Android emulator, set `ANIFOX_API_URL=http://10.0.2.2:3000` in `.env`.

Anime works without any keys. Movies and TV need a free TMDB API key for title
matching. Add it to the root `.env` (never commit that file); the wrapper passes
it only to Flutter build/run commands:

```bash
# In the root .env file:
TMDB_API_KEY=your-tmdb-key

# In your shell:
npm run flutter -- run
```

### Build-time configuration

| Define | Required | Purpose |
| --- | --- | --- |
| `TMDB_API_KEY` | For movies and TV | TMDB metadata and ID matching |
| `ANIFOX_API_URL` | App clients | Root URL of the website deployment that hosts `/api` |
| `DOWNLOAD_PROVIDER_URL` | Server-side | Licensed provider origin; never bundled into clients |
| `DISCORD_APPLICATION_ID` | Optional | Discord application ID for Android and desktop Rich Presence |

```bash
npm run flutter -- build apk --release
```

The wrapper reads the root `.env` and forwards client defines. Server-only
values such as `DOWNLOAD_PROVIDER_URL` are not embedded in the app.

### Downloads

AniFox ships no download source. Set `DOWNLOAD_PROVIDER_URL` only to a provider
you are authorized to use. Keep it in the root `.env` locally or as a server-side
web-host variable. Clients retrieve provider choices through the same-origin
`/api/download-links` route. The website presents the choices; the app downloads
the selected file into its offline library at `AniFox/downloads`:

| Platform | Folder |
| --- | --- |
| Windows, macOS, Linux | `Downloads/AniFox/downloads` |
| Android | `AniFox/downloads` on shared storage when file access is granted; otherwise the app's private `AniFox/downloads` |
| iOS | `AniFox/downloads` inside the app's documents |

The provider uses these title routes:

```
/movie/{tmdbId}
/tv/{tmdbId}/{season}/{episode}
/anime/{anilistId}/{episode}
```

The provider authorises the request by allowed domain; add your AniFox website
domain to its allowlist. The provider serves the files directly; AniFox does not
proxy them.

### Builds

```bash
npm run flutter -- build apk --release                         # Android
npm run flutter -- build appbundle --release                   # Play Store bundle
npm run flutter -- build ios --release --no-codesign            # iOS verification
npm run flutter -- build macos --release                       # macOS
npm run flutter -- build windows --release                     # Windows
npm run flutter -- build linux --release                       # Linux
```

Tagging `vMAJOR.MINOR.PATCH` publishes Android APKs for `arm64-v8a`,
`armeabi-v7a` and `x86_64`, a universal APK, a Play Store app bundle, and
Windows, Linux and macOS packages, plus a `SHA256SUMS.txt` checksum list.
The iOS target is compiled as an unsigned verification artifact; an installable
iOS release still requires Apple signing and provisioning credentials.

Display names, bundle identifiers and icons live in `package_rename_config.yaml`
and `flutter_launcher_icons.yaml`. After changing the logo:

```bash
dart run flutter_launcher_icons
```

## Web client

`website/` contains the landing page at `/`, the streaming client at `/home`, and
the shared API routes used by both clients.

```bash
npm install --prefix website
npm run web:dev
```

Open <http://localhost:3000> for the landing page, <http://localhost:3000/home>
for the client. Website environment variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `TMDB_API_KEY` | For movies and TV | Server-side TMDB proxy; Flutter also receives a build define |
| `DOWNLOAD_PROVIDER_URL` | For downloads | Server-side licensed provider origin |
| `ANIFOX_API_URL` | Flutter app | Web deployment origin; website routes use their own origin |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical website origin for page metadata |
| `DISCORD_APPLICATION_ID` | Optional | Public application ID for Android and desktop Rich Presence |
| `MANGADEX_API_URL` | Optional | MangaDex API mirror |

Deploy the website and shared API together; they must share one origin. See the
[free hosting guide](docs/HOSTING.md) for Cloudflare Workers, Vercel, Netlify,
and Render setup.

## Manga API

The shared manga API lives at `website/app/api/manga`. The same routes serve the
web and Flutter clients. Source adapters and tests live under
`server/anifox-manga-api/server` and are bundled into the web deployment rather
than hosted as a separate Express service.

```bash
npm run api:test
```

Manga browsing and reading use MangaDex only. AniFox requests only its `safe`
content rating and rejects titles with any other or missing rating when opening
details or chapter pages. MangaDex-hosted chapters in any available language
open in AniFox. Chapters hosted elsewhere are not offered. MangaDex is
community-maintained, so its rating is not a parental-control guarantee; report
anything mislabeled at the source.
Port attribution and license details are in
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

| Client | Setting |
| --- | --- |
| Web | Same origin as the website; no separate API URL |
| App | `ANIFOX_API_URL=https://your-site.example` in root `.env` |

Use the website origin; do not append `/api`. MangaDex images are served through
AniFox's same-origin `/api/image` proxy for consistent loading in web and app.
Check `MANGADEX_API_URL` only when using a custom API mirror.

## Project structure

```
lib/
  common/      shared models, widgets, cards and providers
  core/        bootstrap, routing, networking, storage, theme, updates
  modules/     browse, playback, library, history, tracking, downloads,
               preferences, reader, tv, alerts, launch
  streaming/   bundled embed hosts, URL building, metadata sources
  assets/      images and icons
website/       Next.js landing page, web client and shared /api deployment
server/        manga source adapters/tests bundled into the web API
scripts/       root .env to Flutter build-define wrapper
```

## CI and releases

- **Test APK** (`test-apk.yml`) — runs Flutter analysis/tests and manga API tests,
  and builds debug APKs on pushes and pull requests.
- **Release app builds** (`release-apk.yml`) — validates a `vMAJOR.MINOR.PATCH`
  tag, builds Android and desktop packages, verifies the unsigned iOS target,
  then publishes Android and desktop artifacts to a GitHub release. Windows and
  macOS packages are unsigned; macOS notarization and an installable iOS release
  need platform signing credentials.

Configure the Actions variable `ANIFOX_API_URL` with the production HTTPS website
origin, and the `TMDB_API_KEY`, `ANDROID_KEYSTORE_BASE64`,
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` and `ANDROID_KEY_PASSWORD`
repository secrets before publishing. The iOS verification artifact is not
installable; App Store distribution requires Apple signing/provisioning setup.

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Troubleshooting

- **No movie or TV results** — `TMDB_API_KEY` is missing from the build. Rebuild
  with the define; changing it at runtime has no effect.
- **A title opens the wrong match** — anime is matched to TMDB by title and year.
  Use the title page's AniList or MyAnimeList link to confirm the entry.
- **The download button says downloads are not configured** — set the
  server-side `DOWNLOAD_PROVIDER_URL` for the website/API deployment.
- **A download stays in the provider page** — the provider opened a format the
  app does not intercept (for example a blob or a ZIP). Use a direct MP4, MKV or
  HLS link, or download from the site instead.
- **Downloads are not visible on Android** — grant file access when prompted.
  Without it AniFox keeps files in its private `AniFox/downloads` folder.
- **Manga is empty** — the shared website `/api` route or selected providers
  are unavailable. The Flutter build must point `ANIFOX_API_URL` at the website.
- **Discord presence is missing** — Android requires the Discord app installed
  and `DISCORD_APPLICATION_ID` configured; desktop builds also need the Discord
  desktop client running. Check [Discord notes](docs/DISCORD_RICH_PRESENCE.md).
## Community

- [Contributing guide](CONTRIBUTING.md) — setup, checks and pull request rules
- [Documentation index](docs/README.md) — developer and feature guides
- [Hosting guide](docs/HOSTING.md) — free options for deploying the web client and shared API
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
