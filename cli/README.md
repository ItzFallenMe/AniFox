# AniFox CLI

A small Node.js terminal client for the AniFox website API.

## Requirements

- Node.js 22 or newer
- Network access to the AniFox deployment

## Run locally

From the repository root:

```bash
node cli/index.mjs --help
node cli/index.mjs manga sources
node cli/index.mjs manga search "one piece"
node cli/index.mjs manga catalog --page 1 --type latest
node cli/index.mjs tmdb search "dune"
node cli/index.mjs tmdb trending --type movie --window week
node cli/index.mjs stream movie 550
```

## Install as a command

```bash
npm install -g ./cli
anifox --help
```

## API origin

The default API origin is `https://anifox.runs-on.dev`. Set a different deployment origin with:

```bash
ANIFOX_API_URL=https://your-anifox-host.example anifox manga sources
```

The value is the website origin, not an `/api` URL. The CLI appends the documented routes, for example `/api/manga/sources`, `/api/manga/search`, `/api/tmdb/search/multi`, and `/api/stream`.

## Commands

| Command | Description |
| --- | --- |
| `manga sources` | List configured manga sources |
| `manga catalog` | Browse MangaDex catalog |
| `manga search <query>` | Search manga |
| `manga title <id>` | Fetch manga details |
| `manga chapter <manga-id> <chapter-id>` | Fetch chapter pages |
| `tmdb search <query>` | Search movie and TV metadata |
| `tmdb trending` | Browse trending titles |
| `stream movie <tmdb-id>` | Resolve a movie stream URL |
| `stream tv <tmdb-id> <season> <episode>` | Resolve a TV episode URL |
| `stream anime <anilist-id> <episode>` | Resolve an anime episode URL |

Append `--json` to list/search commands for machine-readable output. Stream commands print the provider redirect URL returned by AniFox.

## Notes

- Movie/TV metadata requires the deployment's server-side `TMDB_API_KEY`.
- Download links are intentionally not included in this initial CLI.
- The CLI uses only documented AniFox API routes and does not proxy or host media.
