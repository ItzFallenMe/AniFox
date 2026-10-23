<p align="center">
  <img src="assets/anifox-logo.png" width="180" alt="AniFox Logo">
</p>

<h1 align="center">AniFox</h1>

<p align="center">
  <b>A modern anime streaming experience built with Flutter.</b><br>
  Stream • Download • Track with AniList • Customize everything
</p>

<p align="center">
  <a href="https://github.com/ItzFallenMe/AniFox/releases">
    <img src="https://img.shields.io/github/v/release/ItzFallenMe/AniFox?style=for-the-badge&color=F97316" />
  </a>
  <a href="https://github.com/ItzFallenMe/AniFox/releases">
    <img src="https://img.shields.io/github/downloads/ItzFallenMe/AniFox/total?style=for-the-badge&color=F97316" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/ItzFallenMe/AniFox?style=for-the-badge&color=F97316" />
  </a>
  <a href="https://discord.gg/9p2UP7X2hN">
    <img src="https://img.shields.io/discord/1298715486436657202?style=for-the-badge&logo=discord&label=Discord" />
  </a>
</p>

**Anime, movies and series in one black-glass Android client.** A bare React
Native app with a Media3-backed offline library, episode alerts, a
watchlist that follows you between sessions, optional Discord presence, and a
Next.js site that serves the newest APK directly from GitHub Releases.

Created and maintained by **[ItzFallenMe](https://github.com/ItzFallenMe)**.

> AniFox hosts no media. Metadata and artwork come from TMDB; playback is
> embedded from third-party providers. Use the app only for content you are
> allowed to watch.

---

## What's inside

| Area | What it does |
|------|--------------|
| **Home** | Cinematic billboard, **Continue watching** rail, paged Trending grid, and an in-app update banner when a newer release exists. |
| **Browse** | Every TMDB catalog as a paged screen: Popular, Now Playing, Upcoming, Top Rated and Trending movies; Popular, Airing Today, On The Air, Top Rated and Trending series. |
| **Anime** | Anime spotlight plus ongoing, most popular, top rated and anime-film rails. |
| **Search** | Debounced multi-search across movies, series and anime, with page-by-page results and the last eight searches kept locally. |
| **Detail** | Backdrop hero, score, synopsis, cast, similar titles, season/episode picker, trailer sheet, bookmark toggle, **Continue Sx · Ex** and next-episode alert. |
| **Player** | Seven embed providers, in-player server switching, reload and recovery, autoplay, an ad-free navigation guard, **landscape fullscreen** that rotates in and back out automatically, and **Download** once the stream is detected. |
| **Library** | Watchlist, resume history, recent searches, episode alerts and offline downloads — all stored on-device. |
| **You** | Library counts, streaming-server list, data sources, disclaimer, settings and creator credit. |
| **Settings** | Glass tab bar intensity, default server, autoplay, landscape player, Discord presence (only in builds that support it), reset. |

The catalog is TMDB metadata. Playback is embedded from third-party providers,
exactly like the original sarui-movies player this project grew out of.

## Catalog policy

Every list — home, catalogs, anime rails, search and "more like this" — passes
through `src/services/tmdbPolicy.ts`:

- entries without a poster or title are dropped, so cards never render broken;
- unreleased titles are hidden using TMDB statuses and future release dates —
  the **Upcoming** catalog is the deliberate exception;
- blank localized titles fall back to the original name, and synopses always
  render a sentence.

`CATALOG_LANGUAGE` and `FALLBACK_LANGUAGE` in `src/config/env.ts` control
localization. When they differ, missing synopses are re-requested in the
fallback language and copied across by id.

## Offline downloads

Providers build signed manifests at runtime, so there is no public URL to
resolve ahead of time. Downloads therefore work from the stream the player is
**already** playing:

1. `src/utils/streamProbe.ts` is injected into the player WebView before the
   provider's scripts. It watches `fetch`/XHR and resource-timing entries and
   posts the first `.m3u8`/`.mp4` URL back to React Native.
2. When a stream is detected, the player panel enables **Download film** /
   **Download episode**. Android's `CookieManager` supplies provider cookies and
   the player page is sent as the `Referer`.
3. `AnifoxDownloads` queues a Media3 `DownloadRequest`. A custom
   `DownloaderFactory` applies those headers to every manifest and segment
   request and supports HLS and progressive MP4.
4. Completed titles appear under **You → Downloads** and play in a native Media3
   activity backed by the same cache — no network required.

Downloads continue in the background through a foreground `DownloadService` and
are stored in app-private storage. The downloader can only capture streams the
page exposes unencrypted: DRM-protected players and cross-origin iframes that
never expose a manifest cannot be downloaded.

## Update notifications

The app is side-loaded, so updates come from GitHub Releases:

- `src/services/updates.ts` asks the public GitHub API for the newest release,
  compares it with `APP_INFO.version` and caches the answer for six hours;
- a dismissible banner on Home shows the new version and opens the APK asset
  (preferring universal, then arm64) when tapped;
- dismissing remembers that version, so the banner does not return.

No background polling, no account, no telemetry.

## Discord Rich Presence

Presence is optional and **off by default**. The Settings toggle is only shown
in builds where it can actually publish — users never see setup instructions.

Real Rich Presence on Android requires Discord's Social SDK, which is a
downloadable native artifact with no Maven or React Native distribution.
`android/app/src/main/java/com/itzfallenme/anifox/discord/` contains the bridge
and a reflective `DiscordSdkAdapter` seam: add the SDK to `android/app/libs/`,
paste a client id into `DISCORD_CLIENT_ID` in `src/config/env.ts`, and implement
`DiscordSdkAdapterImpl`. Presence is published only while the player is open and
cleared on exit. See the README inside that folder for the exact steps.

> A "log in with Discord" button cannot enable presence on its own: Discord does
> not accept third-party presence updates over OAuth. Account linking only makes
> sense together with a backend that syncs the library, which this project does
> not ship (yet).

## Stack

- **React Native 0.88** (bare CLI, new architecture, Hermes) — Android only
- **TypeScript 6**, React 19
- React Navigation 7 (bottom tabs + native stack)
- `react-native-webview` for embed playback and trailers
- **Media3 1.5.1** (ExoPlayer, HLS, UI, database) for downloads and offline playback
- `@react-native-async-storage/async-storage` for settings and the library
- `@sbaiahmed1/react-native-blur` for the glass tab bar
- `lucide-react-native`, `react-native-linear-gradient`
- Outfit + Inter, bundled as Android assets (and reused by the website)
- **Next.js 14.2.35 + Tailwind** for the marketing site

## Getting started

### Requirements

- Node **22.11+**
- JDK **17 or 21** and the Android SDK (platform 37, build tools 37.0.0)
- A device or emulator on Android 7.0+ (minSdk 24)

### Install and run

```bash
npm install
npm start          # Metro
npm run android    # build + install
```

### TMDB key

`src/config/env.ts` reads `TMDB_API_KEY` at runtime; replace the bundled value
with your own free key from <https://www.themoviedb.org/settings/api>, then
restart Metro with `npm start -- --reset-cache`. No native rebuild needed.

`CATALOG_REGION` picks the region for regional catalogs;
`CATALOG_LANGUAGE` / `FALLBACK_LANGUAGE` localize metadata.

### Build an APK

```bash
cd android
./gradlew assembleRelease
```

Release builds are split per ABI (`armeabi-v7a`, `arm64-v8a`, `x86_64`) with a
universal fallback, so the output directory contains several APKs. The template
signs with the debug keystore — generate your own key before publishing.

### Versioning

`version` in `package.json`, `versionCode` / `versionName` in
`android/app/build.gradle` and `APP_INFO.version` in `src/config/env.ts` must
agree. v2.0.0 uses `versionCode 2`.

## Website (`website/`)

A separate Next.js app using the same black-glass design language, the app's
Inter/Outfit fonts and the brand orange.

| Route | Purpose |
|-------|---------|
| `/` | Landing page: hero, features, player/library showcases, providers, FAQ, download CTA. |
| `/download` | **APK list** — every asset of recent GitHub releases with architecture, size and direct link. |
| `/privacy`, `/terms` | Legal pages. |
| `/api/releases` | JSON release + asset list, cached for ten minutes. |
| `/api/release` | `307` redirect to the newest APK (universal → arm64 → any). |

All download buttons point at `/download`; the API routes read GitHub on the
server, keeping any optional `GITHUB_TOKEN` private.

```bash
cd website
npm install
npm run dev
npm run build
```

**Deploying to Vercel:** import the repository, set the project root to
`website/`, framework preset **Next.js**, and add `GITHUB_TOKEN`
(optional, avoids API rate limits). Nothing else is required.

## GitHub Actions

- **`android.yml`** — on every push to `main` and on manual dispatch: typecheck,
  lint, test, build every APK and upload them as artifacts.
- **`release.yml`** — on `v*` tags (or manual dispatch with a tag): runs the same
  checks, builds every APK, writes `SHA256SUMS.txt`, and publishes a GitHub
  Release with all of them attached. The website's download page updates from
  that release automatically.

Both pipelines publish the same set, named from `package.json`'s version:

| Asset | ABI | Use it for |
|-------|-----|------------|
| `anifox-2.0.0-arm64-v8a.apk` | arm64-v8a | Almost every phone from ~2017 on (recommended) |
| `anifox-2.0.0-armeabi-v7a.apk` | armeabi-v7a | Older 32-bit devices |
| `anifox-2.0.0-x86_64.apk` | x86_64 | Emulators and x86 tablets |
| `anifox-2.0.0-universal.apk` | all | Any device, larger download |
| `app-release.apk` | all | Plain alias of the universal build for direct links |

To publish: bump `package.json`, `android/app/build.gradle` and
`src/config/env.ts` together, then `git tag v2.1.0 && git push origin v2.1.0`.

Add `TMDB_API_KEY` under **Settings → Secrets and variables → Actions** so
released builds ship with a working catalog.

## Project layout

```
├── android/                      native project (com.itzfallenme.anifox)
│   └── app/src/main/java/com/itzfallenme/anifox/
│       ├── discord/              presence bridge + SDK adapter seam
│       ├── notifications/        episode-alert scheduling + receiver
│       ├── offline/              Media3 downloads, service, offline player
│       └── orientation/          landscape / portrait lock for the player
├── assets/anifox-logo.png        app mark / launcher icon source
├── src/
│   ├── components/               billboard, cards, rows, update banner, UI kit
│   ├── config/                   catalogs, embed servers, env, settings
│   ├── hooks/                    feeds, details, library, downloads, updates
│   ├── navigation/               stack, tabs, floating glass tab bar
│   ├── screens/                  Splash, Home, Browse, Catalog, Anime, Search,
│   │                             Detail, Player, You, Settings, Watchlist,
│   │                             Alerts, Downloads
│   ├── services/                 TMDB, policy, library stores, alerts,
│   │                             downloads, presence, update checker
│   ├── theme/                    colours, type, spacing, glow
│   ├── types/                    TMDB models + helpers
│   └── utils/                    ad guard, stream probe, formatting
├── website/                      Next.js marketing + APK downloads site
├── .github/workflows/            build and release pipelines
├── __tests__/                    unit tests
└── App.tsx                       root component
```

## How playback works

1. A server is chosen from `src/config/embedServers.ts`; the default is the
   ad-free provider, with six alternatives.
2. Its URL builder takes the TMDB id plus season/episode and returns the embed
   URL; autoplay follows the saved setting.
3. The provider streams inside a WebView with fullscreen video enabled.
4. The stage opens in landscape fullscreen when **Landscape player** is on
   (default). The header's fullscreen button toggles it by hand, Android back
   leaves fullscreen before it leaves the player, and closing the player hands
   the device back to the system orientation.
5. A stall shows **Try again** / **Next server**, and the chips below the stage
   switch providers at any time.

### Fullscreen and orientation

Embed pages draw their own controls, so the app keeps a large fullscreen button
in its **own** header (42 pt tile, 8 pt hit slop) instead of relying on the
provider's cramped one. In fullscreen the panel is hidden and the video takes
every pixel after the compact header, with the notch insets respected on both
sides. Rotation goes through `NativeModules.AnifoxOrientation`
(`android/.../orientation/OrientationModule.kt`), which sets sensor landscape or
sensor portrait on the current activity; because `MainActivity` handles
`configChanges`, rotating never recreates the React instance, so playback and
downloads keep running.

### Ad-free guard

`src/utils/adBlock.ts` keeps embeds watchable:

- no popunders — second windows are blocked and `window.open`, dialogs and
  `beforeunload` traps are neutralised before page scripts run;
- no ad surfaces — known ad/tracker iframes and overlays are removed on load and
  on DOM mutations;
- contained navigation — store/messaging schemes and ad hosts are refused, and
  the top frame cannot be redirected away from the provider.

The player's **Ad-free** toggle disables the guard for providers that need the
redirect (compatibility mode).

## Verification

```bash
npm run typecheck
npm run lint
npm test
npx react-native bundle --platform android --dev false \
  --entry-file index.js --bundle-output /tmp/index.android.bundle --assets-dest /tmp/assets
```

59 tests cover the catalog policy, TMDB endpoints, embed URL builders, the
ad guard, preference defaults, the library stores (watchlist, resume ordering,
search dedupe, alert timing, date formatting), stream detection and download
identity.

The Android build itself needs the SDK; CI runs it on every push.

## Privacy and data

Everything personal lives on the device: watchlist, history, searches, alerts,
downloads and settings. No account, analytics or crash reporter is present.
Requests go only to TMDB, the chosen embed provider, GitHub (update check) and
Discord (only if presence is enabled).

## Disclaimer

AniFox does not host, upload or distribute video content. All titles, artwork
and trademarks belong to their respective owners. This is a personal project,
not affiliated with any streaming service, TMDB or Discord.

## License

MIT © 2026 ItzFallenMe. See [LICENSE](LICENSE).
