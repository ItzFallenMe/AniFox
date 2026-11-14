# Manga source adapters

This folder contains AniFox's server-side manga source adapters. It is a source
package, not a separately deployed web service: Next.js handlers under
[`website/app/api/manga`](../../../website/app/api/manga) call these modules and
the chosen web host deploys the website and API on one origin. See the
[hosting guide](../../../docs/HOSTING.md) for supported deployment options.

## Implemented sources

| Source | Catalog | Search | Details | Chapters | Pages |
| --- | --- | --- | --- | --- | --- |
| MangaDex | Safe-rated only | Safe-rated only | Safe-rated only | Safe-rated only | Safe-rated only |

MangaDex is the only manga adapter in the project. It is community-rated, so Safe
filtering is not a parental-control guarantee.

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
Only MangaDex-hosted chapter pages are returned, in any available language;
externally hosted chapters are excluded. Manga images are served through the
allow-listed `/api/image` proxy.
Streaming and download provider pages use separate `/api/stream` and download
routes; those routes redirect and do not proxy media bytes.

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

Some historical adapter parsing and source research were ported from MeManga at commit
[`4268b38a7cab2ea7e5a5d0612a5c15d05befb8b8`](https://github.com/meellm/MeManga/tree/4268b38a7cab2ea7e5a5d0612a5c15d05befb8b8),
then adapted for AniFox's API and data models. The unused legacy adapters have
been removed; MeManga is not a runtime dependency. The notice is retained for
attribution and license compliance.
See the root [`THIRD_PARTY_NOTICES.md`](../../../THIRD_PARTY_NOTICES.md) for
copyright and license terms. AniFox is maintained by
[ItzFallenMe](https://github.com/ItzFallenMe).

## License

AniFox's own code is GPL-3.0-only; third-party notices and license
attributions are included at the repository root.
