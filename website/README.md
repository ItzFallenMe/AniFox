# AniFox Web

<p align="center">
  <img src="../assets/images/app_logo.png" width="120" alt="AniFox logo" />
</p>

<p align="center">
  The website and web client for <a href="https://github.com/ItzFallenMe/AniFox">AniFox</a> —
  browse anime, movies, TV, and Safe-rated MangaDex titles.
  <br />
  Built with Next.js, React, TypeScript and Tailwind CSS.
</p>

---

## Contents

- [What's inside](#whats-inside)
- [Routes](#routes)
- [Getting started](#getting-started)
- [Environment](#environment)
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
- **Watch** — iframe playback with four bundled servers and episode navigation.
- **Manga** — MangaDex search and chapter reading through the shared `/api`,
  restricted to titles MangaDex explicitly rates Safe.
- **Credits** — `/credits` lists the author, repository, metadata providers and
  the stack.
- **Download page** — platform installers and APKs from GitHub Releases.
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
| `/manga/[id]` | Manga details and hosted chapter list |
| `/manga/[id]/[chapter]` | Manga reader |
| `/credits` | Credits |
| `/api/tmdb/[...path]` | Server-side TMDB proxy |
| `/api/manga/[...path]` | Shared manga source API used by web and Flutter |
| `/api/stream` | Validated redirect to a bundled playback provider |
| `/api/download-links` | Server-side fetch of provider choices for the title page |
| `/api/download-link` | Validated redirect for a selected provider link |
| `/api/image` | Allow-listed manga image proxy |

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
mirror), and `DOWNLOAD_PROVIDER_URL`. The download provider is optional; only
configure a provider you are authorized to use. `NEXT_PUBLIC_SITE_URL` sets the canonical
website origin for metadata. `DISCORD_APPLICATION_ID` is public and is forwarded
to Flutter desktop builds by `npm run flutter -- ...`. Never commit a populated
`.env` file.

## Streaming source API

The player and Flutter app build same-origin `/api/stream` URLs. The handler
validates the source and media IDs, then redirects to one of the bundled
providers: Vidly, VidBolt, Vidy or EmbedWave. The selected provider serves its
own player and media; AniFox does not proxy playback bytes.

## Download provider

AniFox does not ship a download source. Set the server-only
`DOWNLOAD_PROVIDER_URL` to a provider you are licensed to use. The website and
Flutter app fetch the provider's title page server-side and render available
download choices. Selecting a choice uses a same-origin redirect; the app can
save supported links for offline playback. AniFox does not proxy the resulting
file.

The provider must serve one page per title, using the same templates as the
streaming source:

```
/movie/{tmdbId}
/tv/{tmdbId}/{season}/{episode}
/anime/{anilistId}/{episode}
```

Set the variable to an HTTPS provider origin. The web link-list adapter expects
download cards linking to the provider's same-origin `/get?t=...` route. A
different provider may need its own adapter or an official links API. The Flutter
app uses `/api/download-links` and `/api/download-link` to show the same choices
and save the selected media to its offline downloads.

Example:

```dotenv
DOWNLOAD_PROVIDER_URL=https://downloads.example.com
```

Example link-list request: `/api/download-links?type=movie&tmdbId=603`

The populated root `.env` is git-ignored. For production, configure server-side
values in the Cloudflare Workers environment/secrets panel; do not commit real
keys.

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
npm ci
npx wrangler login
npm run cloudflare:deploy
```

`wrangler.jsonc` and `open-next.config.ts` are checked in. Make
`NEXT_PUBLIC_SITE_URL` available during the build and configure `TMDB_API_KEY`
and optional `DOWNLOAD_PROVIDER_URL` as Worker secrets. See the
[hosting guide](../docs/HOSTING.md) for complete Cloudflare steps and other
deployment options. `ANIFOX_API_URL` is for Flutter clients and should be the
Worker site's root origin.

## Project structure

```
website/
├── app/                  # Next.js App Router pages and API routes
│   ├── anime|movies|tv  # Catalog pages
│   ├── credits/          # Credits page
│   ├── explore/          # Search
│   ├── home/              # Streaming home
│   ├── manga/             # Manga catalog, details and reader
│   ├── title/[type]/[id]  # Title details
│   ├── watch/[type]/[id]/[ep]
│   └── api/               # Shared manga, stream, download, TMDB and release routes
├── components/            # Top nav, shell, hero, rails and cards
├── lib/                   # TMDB, AniList, server-resolved providers and hooks
└── public/                # AniFox marks, banner and PWA assets
```

## Data sources & legal

Metadata comes from TMDB (movies, TV) and AniList (anime). MangaDex is the only
source exposed by AniFox for manga. Catalog, search, title, and chapter routes
accept only titles that MangaDex explicitly rates Safe.
Images use the same-origin `/api/image` proxy for web and app clients. Only
MangaDex-hosted chapters are offered, with language labels. Since MangaDex
content is community-rated, this is not a parental-control guarantee.
AniFox does not host or store media. Playback and download providers deliver
their own pages and media. Source-adapter attribution is documented in the root
[`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md).
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
