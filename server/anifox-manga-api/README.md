# Manga API adapters

The current AniFox manga API is part of the website deployment. Next.js route
handlers live in [`website/app/api/manga`](../../website/app/api/manga) and call
the source adapters in [`server/`](server). The website and API deploy together
to Cloudflare Workers with OpenNext; this directory is not a standalone Express
or Vercel service.

From the repository root, install the adapter dependency and run its tests:

```bash
npm ci --prefix server/anifox-manga-api/server
npm run api:test
```

See [`server/README.md`](server/README.md) for implemented sources and routes.

AniFox is licensed under the GNU General Public License v3.0 only. See the
repository root [`LICENSE`](../../LICENSE).
