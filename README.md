# AniFox

**Anime & movies, beautifully unified.** A bare React Native Android app — no Expo — written in TypeScript and built around the sarui-movies design language: a near-black zinc canvas, a rose action colour, amber scores and cinematic billboards.

Created and maintained by **ItzFallenMe** · [github.com/ItzFallenMe](https://github.com/ItzFallenMe)

---

## What's inside

| Area | What it does |
|------|----------------|
| **Home** | Cinematic spotlight billboard for today's top trending film, then a paged **Trending today** grid with the sarui pagination bar. |
| **Browse** | Every sarui-movies catalog as its own paged screen: Popular, Now Playing, Upcoming, Top Rated and Trending movies; Popular, Airing Today, On The Air, Top Rated and Trending series. |
| **Anime** | Anime spotlight plus four rails — ongoing this season, most popular, top rated and anime films — in a poster grid. |
| **Search** | Debounced multi-search across movies, series and anime, with page-by-page results and the catalog policy applied. |
| **Details** | Backdrop hero, rose spotlight pills, amber score, synopsis, cast, similar titles, a full season/episode picker for series, and an in-app trailer sheet (official YouTube trailer first, with an English fallback lookup). |
| **Player** | sarui-movies' embed player: seven providers (server 1 is the ad-free provider), in-player server switching, reload, failure recovery, autoplay, and an **ad-free guard** that blocks popunders, ad frames and app-store redirects. |
| **You** | Project, creator credit, embed-server list, data sources, disclaimer, and the entry point to **Settings** — liquid-glass tab bar plus the default server and autoplay behaviour, persisted on device. |

The catalog is metadata for anime, movies and series from **TMDB**; playback is embedded from third-party providers, exactly like sarui-movies.

## Catalog policy

Ported from sarui-movies, every list — home, catalogs, anime rails, search and
"more like this" — passes through `src/services/tmdbPolicy.ts` before it is
rendered:

- entries without a usable poster path or title are dropped, so cards never
  render a broken frame;
- unreleased titles are hidden, with TMDB statuses (`In Production`,
  `Post Production`, `Planned`, `Pilot`) and future release dates both counted —
  the **Upcoming** catalog is the one deliberate exception;
- titles fall back to TMDB's original name when the localized one is blank, and
  synopses always render a sentence rather than an empty paragraph.

`CATALOG_LANGUAGE` and `FALLBACK_LANGUAGE` in `src/config/env.ts` control
localization. When they differ, missing synopses (including season and episode
synopses) are re-requested in the fallback language and copied across by id;
titles and ordering stay localized. Both default to `en-US`, which keeps each
screen at one request per endpoint.

## Stack

- **React Native 0.88** (bare CLI project, new architecture, Hermes) — Android only
- **TypeScript 6**
- React Navigation 7 (bottom tabs + native stack)
- `react-native-webview` for embed playback and trailers
- `@react-native-async-storage/async-storage` for persisted settings
- `lucide-react-native` icons, `react-native-linear-gradient`
- `@sbaiahmed1/react-native-blur` for the real backdrop-blur glass tab bar
- Outfit + Inter, bundled as Android assets

## Setup

### 1. Requirements

- Node **22.11+**
- JDK **17 or 21** and the Android SDK (platform 37, build tools 37.0.0)
- A device or emulator running Android 7.0+ (minSdk 24)

### 2. Install

```bash
npm install
```

### 3. Add your TMDB key

Open [`src/config/env.ts`](src/config/env.ts) and replace the placeholder:

```ts
const TMDB_API_KEY = 'YOUR_TMDB_API_KEY';
```

Get a free key at <https://www.themoviedb.org/settings/api>. The key is read at
runtime, so no native rebuild is required — restart Metro with:

```bash
npm start -- --reset-cache
```

`CATALOG_REGION` in the same file controls the region used for regional
catalogs; `CATALOG_LANGUAGE` / `FALLBACK_LANGUAGE` localize metadata.

### 4. Run on Android

```bash
npm start          # Metro
npm run android    # build + install on the connected device/emulator
```

### 5. Build a release APK

```bash
cd android
./gradlew assembleRelease
```

The APK lands in `android/app/build/outputs/apk/release/`. The template signs
release builds with the debug keystore — generate your own keystore and update
`android/app/build.gradle` before distributing.

### Build with GitHub Actions

The **Android APK** workflow builds a universal release APK on every push to
`main`, on `v*` tags, or from **Actions → Android APK → Run workflow**. The
finished APK is uploaded as the `AniFox-APK` artifact.

Add `TMDB_API_KEY` under **Settings → Secrets and variables → Actions** so the
built app ships with a working catalog. Without that secret the APK installs
normally but opens on the TMDB setup screen.

## Project layout

```
├── android/                      native Android project (com.itzfallenme.anifox)
│   └── app/src/main/assets/fonts  Outfit + Inter
├── assets/anifox.png             app mark
├── App.tsx                       root component
├── index.js                      entry point
├── src/
│   ├── components/               billboard, poster grid/card, pagination, trailer sheet
│   │   └── ui/                   dashboard-style primitives
│   ├── config/catalogs.ts        browsable catalog definitions
│   ├── config/embedServers.ts    embed player providers + URL builders
│   ├── config/env.ts             TMDB key, region, language, app info
│   ├── config/settings.ts        preference types, defaults, glass presets
│   ├── hooks/                    home, catalog, anime, search, detail and settings
│   ├── navigation/               root stack, tabs, floating tab bar
│   ├── screens/                  Splash, Home, Browse, Catalog, Anime, Search, Detail, Player, You, Settings
│   ├── services/
│   │   ├── tmdb.ts               TMDB client
│   │   ├── tmdbPolicy.ts         catalog policy and title/synopsis rules
│   │   └── catalogs.ts           paged browse-catalog fetcher
│   ├── theme/                    colours, fonts, spacing, glow
│   ├── types/                    TMDB models and helpers
│   └── utils/
│       ├── adBlock.ts            ad-free navigation + injected guard
│       └── format.ts             rating/runtime/clock formatting
└── __tests__/                    unit tests (policy, TMDB client, embed URLs, ad guard)
```

## How playback works

The player is sarui-movies' embed player, ported to a WebView:

1. A server is chosen from `src/config/embedServers.ts` — server 1 is
   sarui's own ad-free provider, and the rest are the embed providers from
   sarui's environment (embedwave, embed-api.stream, vidlink, multiembed,
   vidsrc).
2. The server's URL builder takes the TMDB id plus season/episode and returns
   the embed URL the provider expects; autoplay follows the saved setting.
3. The provider streams inside the WebView (fullscreen video is enabled), so
   the app never handles a media file and hosts nothing.
4. If a provider stalls or errors, the player shows a recovery card with
   **Try again** and **Next server**; the server chips below the video switch
   providers at any time.

Servers live in `src/config/embedServers.ts`. Add, remove or reorder them
there; set a default in **Settings → Default server**.

## Ad-free playback

`src/utils/adBlock.ts` implements the three guards that make embeds watchable:

- **No popunders** — the WebView never opens a second window, and injected
  script neutralises `window.open`, `alert`, `confirm`, `prompt` and
  `beforeunload` traps before page scripts run.
- **No ad surfaces** — iframes, overlay containers and `adsbygoogle` slots on
  known ad/tracker hosts are removed on load and on every DOM mutation, and
  `target="_blank"` links are defused.
- **Contained navigation** — app-store/messaging schemes and ad hosts are
  refused, and the top frame cannot be redirected away from the provider (or,
  for trailers, YouTube). Embedded video CDNs are left alone.

The player's **Ad-free** toggle switches the guard off for a provider that
legitimately needs the redirect (compatibility mode).

## Verification

```bash
npm run typecheck
npm run lint
npm test
```

Unit tests cover the catalog policy (poster and release gating, title and
synopsis rules, trailer selection), list filtering and the Upcoming exception,
detail and trailer endpoint paths, the embed server URL builders, and the
ad-free navigation guard plus its injected script.

## Disclaimer

AniFox does not host, upload or distribute any video content. All titles,
artwork and trademarks belong to their respective owners. Playback is resolved
from third-party providers. This is a personal project by ItzFallenMe, not
affiliated with any streaming service or with TMDB.

## License

MIT © 2026 ItzFallenMe. See [LICENSE](LICENSE).
