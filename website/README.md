# AniFox Web

<p align="center">
  <img src="../assets/images/app_logo.png" width="120" alt="AniFox logo" />
</p>

<p align="center">
  The website and web client for <a href="https://github.com/ItzFallenMe/AniFox">AniFox</a> —
  a bingr.one-inspired streaming front-end for anime, movies and TV.
  <br />
  Built with Next.js, React, TypeScript and Tailwind CSS.
</p>

---

## Contents

- [What's inside](#whats-inside)
- [Routes](#routes)
- [Getting started](#getting-started)
- [Environment](#environment)
- [Chromecast](#chromecast)
- [Scripts](#scripts)
- [Deploy](#deploy)
- [Project structure](#project-structure)
- [Data sources & legal](#data-sources--legal)
- [Credits](#credits)
- [License](#license)

## What's inside

- **Floating top navigation** — a glass navigation bar that hides on scroll,
  with inline search and animated active states.
- **Cinematic home** — rotating hero billboard, category shortcuts, a ranked
  **Top 10** rail and horizontally scrollable poster rails with hover previews.
- **Search** — combined AniList + TMDB results with type filters and URL state.
- **Details** — cinematic title pages with synopsis, ratings, cast, seasons and
  episode lists.
- **Watch** — iframe playback with four bundled servers, episode navigation and
  **Chromecast** support.
- **Manga** — catalog, details and reader backed by the optional AniFox Manga API.
- **Credits** — `/credits` lists the author, repository, metadata providers and
  the stack.
- **Download landing page** — platform download cards and live GitHub release
  download totals.

## Routes

| Route | Description |
| --- | --- |
| `/` | App download landing page |
| `/home` | Streaming home |
| `/explore` | Search and discovery |
| `/movies`, `/tv`, `/anime` | Catalog pages |
| `/title/[type]/[id]` | Title details |
| `/watch/[type]/[id]/[ep]` | Player |
| `/manga` | Manga catalog |
| `/manga/[id]/[chapter]` | Manga reader |
| `/credits` | Credits |
| `/cast` | Custom Chromecast receiver |
| `/api/tmdb/[...path]` | Server-side TMDB proxy |
| `/api/manga/[...path]` | Server-side manga proxy |
| `/api/download-count` | Aggregated GitHub release downloads |

## Getting started

Requirements: **Node.js 20+** (Node 22+ for the Cloudflare tooling).

```bash
cd website
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000> for the download page or
<http://localhost:3000/home> for the streaming app.

## Environment

```dotenv
# Server-only TMDB key (v3 API key or v4 read token). Never exposed to the browser.
TMDB_API_KEY=your_tmdb_api_key

# Optional manga API root URL — do not append /api.
MANGA_API_URL=https://your-manga-api.vercel.app

# Optional Chromecast receiver application id.
NEXT_PUBLIC_CAST_RECEIVER_APP_ID=

# Optional streaming source (listed first when set).
NEXT_PUBLIC_STREAM_API_URL=

# Optional download provider (embedded, authorised by domain).
NEXT_PUBLIC_DOWNLOAD_URL=
```

## Streaming source

Setting `NEXT_PUBLIC_STREAM_API_URL` adds a source named "AniFox Source" to the
player and makes it the default. It must serve these routes, each returning an
embeddable player:

```
/movie/{tmdbId}
/tv/{tmdbId}/{season}/{episode}
/anime/{anilistId}/{episode}
```

## Download provider

AniFox does not ship a download source. Point `NEXT_PUBLIC_DOWNLOAD_URL` at a
provider you are licensed to use. Its pages are embedded from its own domain
and it authorises the site by allowed domain — there is no API key or proxy.

The provider must serve one page per title, using the same templates as the
streaming source:

```
/movie/{tmdbId}
/tv/{tmdbId}/{season}/{episode}
/anime/{anilistId}/{episode}
```

Set the variable to the provider's origin only (no trailing slash). The title
page then shows a download panel that loads the matching page in an iframe,
with an episode picker for series. Because the request comes from the visitor's
browser, add this site's domain to the provider's allowlist.

Example:

```dotenv
NEXT_PUBLIC_DOWNLOAD_URL=https://downloads.example.com
```

Example link: `https://downloads.example.com/movie/603`

Example embed:

```html
<iframe src="https://downloads.example.com/movie/603" width="100%" height="900" frameborder="0"></iframe>
```

`.env.local` is git-ignored. Do not commit real keys — set them in your hosting
provider's dashboard instead.

## Chromecast

The player is a third-party iframe, so it cannot be sent to Google's Default
Media Receiver. AniFox instead ships a custom receiver at `/cast` and talks to it
over a private Cast namespace.

1. Create a receiver at <https://cast.google.com/publish> using
   `https://<your-domain>/cast` as the receiver URL.
2. Set `NEXT_PUBLIC_CAST_RECEIVER_APP_ID` to the generated application id.
3. Serve the site over HTTPS — Cast requires a secure origin.

Without the variable the Cast button stays visible but disabled and explains why.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run cloudflare:build` | Build the Cloudflare Worker bundle |
| `npm run cloudflare:preview` | Build and preview locally with Wrangler |
| `npm run cloudflare:deploy` | Build and deploy to Cloudflare |

## Deploy

### Vercel

Import the repository, set the root directory to `website`, add `TMDB_API_KEY`
and (optionally) `MANGA_API_URL`, then deploy. `vercel.json` is included.

### Cloudflare

The app uses server routes (TMDB and manga proxies), so it deploys as a Worker
through the OpenNext adapter rather than as a static Pages export. Cloudflare
serves Next.js apps this way on its current platform.

```bash
cd website
npm install
npx wrangler login
npm run cloudflare:deploy
```

`wrangler.jsonc` and `open-next.config.ts` are checked in. Add `TMDB_API_KEY`
(as a secret), `MANGA_API_URL` and `NEXT_PUBLIC_CAST_RECEIVER_APP_ID` in the
Cloudflare dashboard.

## Project structure

```
website/
├── app/                  # Next.js App Router pages and API routes
│   ├── anime|movies|tv  # Catalog pages
│   ├── cast/             # Chromecast receiver
│   ├── credits/          # Credits page
│   ├── explore/          # Search
│   ├── home/              # Streaming home
│   ├── manga/             # Manga catalog, details and reader
│   ├── title/[type]/[id]  # Title details
│   ├── watch/[type]/[id]/[ep]
│   └── api/               # GitHub counts and metadata proxies
├── components/            # Top nav, shell, hero, rails, cards, cast button
├── lib/                   # TMDB, AniList, servers, cast and hooks
└── public/logo.png
```

## Data sources & legal

Metadata comes from TMDB (movies, TV) and AniList (anime). AniFox does not host
or store any media; playback is supplied by third-party embed hosts. AniFox is
not affiliated with TMDB, AniList, MyAnimeList or any embed provider.

## Credits

Created and maintained by [ItzFallenMe](https://github.com/ItzFallenMe).
See [`/credits`](app/credits/page.tsx) and the
[repository](https://github.com/ItzFallenMe/AniFox).

## License

GPL-3.0-or-later. See the repository root [`LICENSE`](../LICENSE).
