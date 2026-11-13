# AniFox Manga API

The manga backend for [AniFox](https://github.com/ItzFallenMe/AniFox), maintained by
[ItzFallenMe](https://github.com/ItzFallenMe).

- Search manga
- Manga details and chapter list
- Chapter page images

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | API information |
| `GET` | `/health` | Health check |
| `GET` | `/api/search/naruto?page=1` | Search manga |
| `GET` | `/api/mangaList` | Catalog with filters |
| `GET` | `/api/manga/:id` | Manga details and chapters |
| `GET` | `/api/manga/:id/:chapter` | Chapter images |

## Development

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

The API runs on `http://localhost:3000` by default.

## Deploy to Vercel

```bash
cd server
vercel
```

`vercel.json` routes every request to the Express app in `api/index.js`. Use the
Vercel deployment's root URL as `MANGA_API_URL` in AniFox; do not add `/api` to
that client setting.

Metadata and page images come from the public
[MangaDex API](https://api.mangadex.org/docs/). No API key is required. Set
`MANGADEX_API_URL` only when you need to route requests through your own proxy
or a mirror; the default is `https://api.mangadex.org`.

The API is a metadata and page-image proxy. It does not store content. Respect
MangaDex's rate limits and terms when deploying it.

## License

GPL-3.0 — see the repository [LICENSE](../../LICENSE).
