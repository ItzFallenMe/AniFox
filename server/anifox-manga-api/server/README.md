# Manga source adapters

This folder contains AniFox's server-side manga source adapters. It is a source
package, not a separately deployed web service: Next.js handlers under
[`website/app/api/manga`](../../../website/app/api/manga) call these modules and
Cloudflare Workers hosts the website and API on one origin.

## Implemented sources

| Source | Catalog | Search | Details | Chapters | Pages |
| --- | --- | --- | --- | --- | --- |
| MangaDex | Yes | Yes | Yes | Yes | Yes |
| MangaPill | No | Yes | Yes | Yes | Yes |
| Asura Scans | No | Yes | Yes | Yes | Yes |
| ComicK | No | Yes | Yes | Yes | Yes |
| TCB Scans | No | Yes | Yes | Yes | Yes |

Provider availability and page structure can change. The registry intentionally
lists only adapters implemented in this repository; it does not claim every
source in MeManga's catalog works in AniFox.

## API routes

The canonical client routes are hosted by the web app:

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/manga/sources` | Implemented sources and capabilities |
| `GET` | `/api/manga/catalog?page=1` | MangaDex catalog |
| `GET` | `/api/manga/search?query=naruto&source=all` | Search one or all sources |
| `GET` | `/api/manga/title/{id}` | Manga details and chapters |
| `GET` | `/api/manga/chapter/{mangaId}/{chapterId}` | Chapter page URLs |
| `GET` | `/api/image?url=...` | Allow-listed manga image proxy |

The API returns metadata and page-image URLs. It does not store manga content.
Streaming and download provider pages use separate `/api/stream` and
`/api/download` routes; those routes redirect and do not proxy media bytes.

## Tests

From the repository root:

```bash
npm run api:test
```

Or from this folder:

```bash
npm test
```

## Attribution

Some adapter parsing and source research were ported from MeManga at commit
[`4268b38a7cab2ea7e5a5d0612a5c15d05befb8b8`](https://github.com/meellm/MeManga/tree/4268b38a7cab2ea7e5a5d0612a5c15d05befb8b8),
then adapted for AniFox's API and data models. MeManga is not a runtime dependency.
See the root [`THIRD_PARTY_NOTICES.md`](../../../THIRD_PARTY_NOTICES.md) for
copyright and license terms. AniFox is maintained by
[ItzFallenMe](https://github.com/ItzFallenMe).

## License

AniFox's own code is GPL-3.0-or-later; third-party notices and license
attributions are included at the repository root.
