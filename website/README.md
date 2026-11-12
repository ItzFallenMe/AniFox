# AniFox Web

The website and web client for [AniFox](https://github.com/ItzFallenMe/AniFox),
built with Next.js, React, TypeScript and Tailwind CSS.

The root route is the download landing page. The streaming web app lives at
`/home`, with title discovery and playback pages under the same app shell.

## Features

- **Download landing page** — responsive animated overview with GitHub release
  download totals and links to the app builds.
- **Home** — trending, popular and top rated anime, movies and TV at `/home`.
- **Search** — combined AniList + TMDB search with type filters.
- **Details** — cinematic title pages with synopsis, ratings, cast, seasons and
  episode lists.
- **Watch** — iframe-only playback with four bundled servers and episode
  navigation. AniFox does not download media in the web app.
- **Manga** — `/manga` catalog, details and reader backed by the separate AniFox
  Manga API.

Metadata comes from TMDB (movies, TV) and AniList (anime). AniFox does not
host or store any media; playback is supplied by the third-party hosts.

## Getting started

```bash
cd website
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and configure the server environment:

```dotenv
TMDB_API_KEY=your_tmdb_v3_or_v4_key
MANGA_API_URL=https://your-manga-api.vercel.app
```

`TMDB_API_KEY` is read only by the server-side TMDB proxy and is never sent to
the browser. There is no settings screen or local key-entry flow. Manga is
optional; until `MANGA_API_URL` is set, the `/manga` page explains that the
service is not configured. AniList-backed anime metadata does not require a
TMDB key.

Open <http://localhost:3000> for the download page or <http://localhost:3000/home>
for the streaming app.

## Build

```bash
npm run build
npm start
```

## Deploy

The project is Vercel-ready: import the repository, set the root directory to
`website`, set `TMDB_API_KEY` and (optionally) `MANGA_API_URL` in the project
environment, then deploy. `vercel.json` is included. The landing page's download
count is cached and aggregated from public GitHub release assets.

## Structure

```
website/
├── app/                 # Next.js App Router pages
│   ├── anime|movies|tv # catalog pages
│   ├── explore/        # search
│   ├── home/            # streaming home
│   ├── manga/           # manga catalog, details and reader
│   ├── title/[type]/[id]
│   └── watch/[type]/[id]/[ep]
│   └── api/             # GitHub counts and server-side metadata/API proxies
├── components/          # shell, sidebar, hero, rails and cards
├── lib/                 # TMDB, AniList, servers and hooks
└── public/logo.png
```

## License

GPL-3.0-or-later. AniFox is created by
[ItzFallenMe](https://github.com/ItzFallenMe).
