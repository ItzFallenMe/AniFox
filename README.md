# AniFox

**Anime & movies, beautifully unified.** A bare React Native Android app — no Expo — written in TypeScript and built around the ItzFallenMe dashboard's black-glass design language.

Created and maintained by **ItzFallenMe** · [github.com/ItzFallenMe](https://github.com/ItzFallenMe)

---

## What's inside

| Area | What it does |
|------|----------------|
| **Home** | Auto-rotating hero carousel of trending anime, plus rows for airing anime, anime films, popular movies, top-rated series, action and all-time greats. |
| **Anime** | Category browser — trending, airing this season, series, movies and top rated — in a three-column poster grid. |
| **Search** | Debounced multi-search across anime, movies and series with quick suggestions. |
| **Details** | Backdrop hero, ratings, genres, synopsis, cast, similar titles, and a full season/episode picker for series. |
| **Player** | Resolves a direct stream from nine embed providers with Flickv4's scraper, custom playback controls, server switching and automatic failover. |
| **You** | Project, creator credit, server list, data sources and disclaimer. |

The catalog is metadata for anime, movies and series from **TMDB**; playback is resolved from third-party embed providers, exactly like Flickv4.

## Stack

- **React Native 0.88** (bare CLI project, new architecture, Hermes) — Android only
- **TypeScript 6**
- React Navigation 7 (bottom tabs + native stack)
- `react-native-video` for playback, `react-native-webview` for stream resolution
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

`CATALOG_REGION` in the same file controls the region used for popular-movie
rows.

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

## Project layout

```
├── android/                      native Android project (com.itzfallenme.anifox)
│   └── app/src/main/assets/fonts  Outfit + Inter
├── assets/anifox.png             app mark
├── App.tsx                       root component
├── index.js                      entry point
├── src/
│   ├── components/               hero, rows, posters, scraper, TMDB setup
│   │   └── ui/                   dashboard-style primitives
│   ├── config/env.ts             TMDB key, region, app/creator info
│   ├── hooks/                    home, anime, search and detail data
│   ├── navigation/               root stack, tabs, floating tab bar
│   ├── screens/                  Splash, Home, Anime, Search, Detail, Player, You
│   ├── services/
│   │   ├── tmdb.ts               TMDB client
│   │   └── servers.ts            playback servers + headers
│   ├── theme/                    colours, fonts, spacing, glow
│   ├── types/                    TMDB models and helpers
│   └── utils/
│       ├── streamUrl.ts          embed URL builder (from Flickv4)
│       └── format.ts             rating/runtime/clock formatting
└── __tests__/                    unit tests (embed URLs, scraper script, TMDB)
```

## How playback works

1. The Player screen mounts `WebViewScraper` for the selected server.
2. The scraper builds an embed URL from the TMDB id (plus season/episode) and
   loads it in a hidden, full-size WebView.
3. Injected scripts hook `fetch`, XHR, `<video>.src`, video.js and performance
   entries, auto-tap play overlays, and post the resolved `m3u8`/`mp4`/`mpd`
   URL back to React Native.
4. The stream plays in `react-native-video` with the server's `Referer`/`Origin`
   headers. If it errors, the app moves to the next untried server.

Servers live in `src/services/servers.ts` with per-server URL templates and
timeouts. Add, remove or reorder them there.

## Verification

```bash
npm run typecheck
npm run lint
npm test
```

Unit tests cover the embed URL builder (default patterns, custom templates,
type aliases, placeholders and slugs).

## Disclaimer

AniFox does not host, upload or distribute any video content. All titles,
artwork and trademarks belong to their respective owners. Playback is resolved
from third-party providers. This is a personal project by ItzFallenMe, not
affiliated with any streaming service or with TMDB.

## License

MIT © 2026 ItzFallenMe. See [LICENSE](LICENSE).
