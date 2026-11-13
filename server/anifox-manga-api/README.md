# AniFox Manga API

Manga backend for AniFox, maintained by [ItzFallenMe](https://github.com/ItzFallenMe).

```
server/                 Express app consumed by Vercel
next exemple/           Next.js usage example
docs/                   Astro API documentation
types/                  Shared TypeScript response types
```

- Run locally: `cd server && npm install && npm run dev`
- Deploy: import this `server` directory into Vercel (`vercel.json` already routes
  requests to `api/index.js`).
- Endpoint notes live in [`server/README.md`](server/README.md).

Licensed under GPL-3.0. See the repository root `LICENSE`.
