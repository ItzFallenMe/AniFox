# AniFox TUI

An interactive terminal UI for browsing the AniFox API. Built with Node.js 22+ and native terminal controls; no runtime dependencies.

## Run

From the repository root:

```bash
node cli/index.mjs
```

Or install the package locally:

```bash
npm install -g ./cli
anifox
```

## Controls

| Key | Action |
| --- | --- |
| `↑` / `↓` or `j` / `k` | Navigate lists |
| `Enter` | Open selected item |
| `/` | Search the current catalog |
| `n` / `p` | Next / previous manga catalog page |
| `c` | Enter a chapter ID from manga details |
| `s` | Resolve a stream for a supported media item |
| `Esc` | Go back |
| `q` | Quit |

## Features

- MangaDex source list, catalog, search, details and chapter page lookup
- TMDB movie/TV search and trending feed
- Stream URL resolution for movie, TV and anime IDs
- Scrollable JSON detail view
- ANSI terminal interface with no third-party runtime dependencies

## API origin

The default origin is `https://anifox.runs-on.dev`. The app appends documented `/api/...` routes to this origin.

Override it with:

```bash
ANIFOX_API_URL=https://your-anifox-host.example node cli/index.mjs
```

Set the website origin only; do not append `/api`.

## Requirements and notes

- Node.js 22 or newer
- An interactive terminal (TTY)
- Movie/TV metadata depends on the deployment's server-side `TMDB_API_KEY`.
- Stream resolution returns a third-party provider URL. AniFox does not proxy or host media.
- Download-link APIs are not exposed in this initial TUI.
