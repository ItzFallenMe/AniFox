# AniFox TUI

An interactive terminal app for AniFox, built with the same kind of Rich + selector-based TUI architecture used by [Viu](https://github.com/viu-media/viu), but backed by AniFox's own API.

## Run

Requires Python 3.11+ and an interactive terminal.

```bash
cd tui
python -m venv .venv
# Linux/macOS
source .venv/bin/activate
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
pip install -e .
anifox
```

Or run without installing the console script:

```bash
pip install -e .
python -m anifox_tui.app
```

## Features

- Browse MangaDex's Safe-rated catalog and search manga
- Open manga details and choose from returned chapters
- Inspect chapter page URLs returned by AniFox
- Browse trending TMDB movies and TV
- Search movies and TV, inspect details, and select TV seasons/episodes
- Resolve a provider URL through AniFox and optionally open it in a browser
- Rich terminal panels and fuzzy interactive selectors

## API

The default API origin is `https://anifox.runs-on.dev`. Set the origin only; do not append `/api`.

```bash
ANIFOX_API_URL=https://anifox.runs-on.dev anifox
# or
anifox --base-url https://anifox.runs-on.dev
```

The client calls AniFox routes such as `/api/manga/catalog`, `/api/manga/search`, `/api/tmdb/search/multi`, `/api/tmdb/trending/all/week`, and `/api/stream`. TMDB browsing requires the deployment's server-side `TMDB_API_KEY`.

## Viu attribution

The interactive selector facade and overall selector-oriented TUI approach are adapted from patterns in [viu-media/viu](https://github.com/viu-media/viu). Viu is released under the Unlicense (public domain dedication); see `THIRD_PARTY_LICENSES/UNLICENSE`. This app does not copy Viu's scraping providers, downloader, or playback implementation. It uses AniFox's documented API instead.

## Notes

- AniFox's manga adapter currently documents MangaDex as its only source, with Safe-rated filtering. This is community-rated and is not a parental-control guarantee.
- Stream resolution returns a third-party provider URL; AniFox does not proxy or host media.
- This is an API client, not a media scraper or downloader.
