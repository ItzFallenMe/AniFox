# AniFox Web

<p align="center">
  <img src="../assets/images/app_logo.png" width="120" alt="AniFox logo" />
</p>

<p align="center">
  The website and web client for <a href="https://github.com/ItzFallenMe/AniFox">AniFox</a> —
  a black-glass home for anime, movies, TV, and manga.
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

- **Hover-expanding rail** — an icon rail on desktop that widens to labelled
  navigation, with inline search in the top bar.
- **Mobile tab bar** — a fixed bottom bar with safe-area spacing, while the top
  bar keeps the brand and search.
- **Cinematic home** — a 16:9 hero billboard with editorial titles, a numbered
  **Trending Right Now** rail and horizontally scrollable poster rails.
- **Consistent catalogs** — Movies, TV and Anime open with the same billboard
  and rail feed as the home page.
- **Search** — combined AniList + TMDB results with type filters and URL state.
- **Details** — cinematic title pages with synopsis, ratings, cast, seasons and
  episode lists.
- **Watch** — iframe playback with four bundled servers, episode navigation and
  **Chromecast** support.
- **Manga** — MangaDex catalog plus connected MangaDex, MangaPill, Asura Scans,
  ComicK and TCB Scans search and chapter reading through the shared `/api`.
- **Credits** — `/credits` lists the author, repository, metadata providers and
  the stack.
- **Download landing page** — platform download cards and live GitHub release
  download totals.
- **Downloads** — title pages show available quality/source links in AniFox,
  with an episode picker for series; provider URLs stay server-side.

## Routes

| Route | Description |
| --- | --- |
| `/` | AniFox marketing homepage |
| `/download` | Android release downloads |
| `/privacy`, `/terms` | Privacy and terms |
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
| `/api/manga/[...path]` | Shared manga source API used by web and Flutter |
| `/api/stream` | Validated redirect to a bundled playback provider |
| `/api/download` | Validated redirect to the configured licensed download provider |
| `/api/download-links` | Server-side fetch of provider choices for the title page |
| `/api/download-link` | Validated redirect for a selected provider link |
| `/api/image` | Allow-listed manga image proxy |
| `/api/download-count` | Aggregated GitHub release downloads |

## Getting started

Requirements: **Node.js 22+** for Next.js and Cloudflare OpenNext tooling.

```bash
cp .env.example .env
npm install --prefix website
npm run web:dev
```

Open <http://localhost:3000> for the homepage,
<http://localhost:3000/download> for app releases, or
<http://localhost:3000/home> for the streaming app.

## Environment

Use the root [`.env.example`](../.env.example) as the one local configuration
file. Copy it to `.env`; the website loads it for local development. Set
`ANIFOX_API_URL` to the website origin when building the Flutter app. Web pages
call their own `/api` routes and need no API URL.

Server-side values include `TMDB_API_KEY`, `MANGADEX_API_URL` (optional API
mirror), and `DOWNLOAD_PROVIDER_URL`. `DISCORD_APPLICATION_ID` is public and is
forwarded to Flutter desktop builds by `npm run flutter -- ...`. Never commit a
populated `.env` file.

## Streaming source API

The player and Flutter app build same-origin `/api/stream` URLs. The handler
validates the source and media IDs, then redirects to one of the bundled
providers: Vidly, VidBolt, Vidy or EmbedWave. The selected provider serves its
own player and media; AniFox does not proxy playback bytes.

## Download provider

AniFox does not ship a download source. Set the server-only
`DOWNLOAD_PROVIDER_URL` to a provider you are licensed to use. The website
fetches the provider's title page server-side and renders its download choices
in AniFox. Selecting a choice uses a same-origin redirect; AniFox does not proxy
the resulting file.

The provider must serve one page per title, using the same templates as the
streaming source:

```
/movie/{tmdbId}
/tv/{tmdbId}/{season}/{episode}
/anime/{anilistId}/{episode}
```

Set the variable to an HTTPS provider origin. The web link-list adapter expects
download cards linking to the provider's same-origin `/get?t=...` route, as
Streamrip does. A different provider may need its own adapter or an official
links API. The Flutter app continues to use the `/api/download` redirect.

Example:

```dotenv
DOWNLOAD_PROVIDER_URL=https://downloads.example.com
```

Example link-list request: `/api/download-links?type=movie&tmdbId=603`

The populated root `.env` is git-ignored. For production, configure server-side
values in the Cloudflare Workers environment/secrets panel; do not commit real
keys.

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

### Cloudflare Workers

The web app uses dynamic Next.js route handlers for TMDB, manga, streaming and
download resolution. Cloudflare's current OpenNext adapter deploys full-stack
Next.js apps to **Workers**; a static Pages export cannot host these routes. The
Flutter client uses the same Worker origin.

```bash
cd website
npm install
npx wrangler login
npm run cloudflare:deploy
```

`wrangler.jsonc` and `open-next.config.ts` are checked in. Configure
`TMDB_API_KEY`, `DOWNLOAD_PROVIDER_URL`, and any needed public build values such
as `NEXT_PUBLIC_CAST_RECEIVER_APP_ID` in the Worker environment. `ANIFOX_API_URL`
is only needed by Flutter clients and should be the Worker site's root origin.

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
│   └── api/               # Shared manga, stream, download, TMDB and release routes
├── components/            # Top nav, shell, hero, rails, cards, cast button
├── lib/                   # TMDB, AniList, server-resolved providers, cast and hooks
└── public/                # AniFox marks, banner and PWA assets
```

## Data sources & legal

Metadata comes from TMDB (movies, TV) and AniList (anime). Manga connectors
currently implemented in the monorepo include MangaDex, MangaPill, Asura Scans,
ComicK and TCB Scans. AniFox does not host or store media. Playback and download
providers deliver their own pages and media. Source implementations adapted
from MeManga are attributed in the root [`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md).
AniFox is not affiliated with TMDB, AniList, MyAnimeList, Discord or any provider.

## Credits

Created and maintained by [ItzFallenMe](https://github.com/ItzFallenMe).
See [`/credits`](app/credits/page.tsx) and the
[repository](https://github.com/ItzFallenMe/AniFox).

## Contributing

See the root [`CONTRIBUTING.md`](../CONTRIBUTING.md) for setup, checks and pull
request rules. Security reports go through [`SECURITY.md`](../SECURITY.md).

## License

GPL-3.0-or-later. See the repository root [`LICENSE`](../LICENSE).
