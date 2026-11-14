# Manga API adapters

The current AniFox manga API is part of the website deployment. Next.js route
handlers live in [`website/app/api/manga`](../../website/app/api/manga) and call
the source adapters in [`server/`](server). The website and API deploy together
as one Next.js application; this directory is not a standalone Express service.
See the [hosting guide](../../docs/HOSTING.md) for deployment options.

Run the adapter tests from the repository root:

```bash
npm run api:test
```

See [`server/README.md`](server/README.md) for implemented sources and routes.

AniFox is licensed under the GNU General Public License v3.0 only. See the
repository root [`LICENSE`](../../LICENSE).
