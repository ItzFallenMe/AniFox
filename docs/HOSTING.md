# Hosting AniFox Web

AniFox Web is a **full-stack Next.js application**, not a static site. The
website and shared API must be deployed together because the browser client and
Flutter app use the same-origin `/api` routes for TMDB, MangaDex, streaming, and
download links. Do not enable static export or deploy only generated HTML.

## Choose a host

| Host | Best for | Free-plan caveat |
| --- | --- | --- |
| [Cloudflare Workers](#cloudflare-workers-recommended) | Recommended; the repository already includes OpenNext and Wrangler configuration | The Free plan currently allows 100,000 Worker requests per day and 10 ms CPU time per invocation; the Worker bundle must also fit the free size limit. |
| [Vercel](#vercel) | Fastest setup for Next.js | Hobby is limited to personal or non-commercial use and has monthly usage limits. |
| [Netlify](#netlify) | Managed Next.js deployment with Git-based previews | The Free plan uses monthly credits; projects pause when the included credits are exhausted. |
| [Render](#render) | A conventional Node.js server and a simple monorepo setup | Free web services sleep after 15 minutes of inactivity, have an ephemeral filesystem, and can take about a minute to wake. Use for demos and testing, not dependable always-on hosting. |

Free-tier policies, limits, and eligibility change. Check each provider's current
terms before deploying. A free host also does not include the cost of a custom
domain you buy separately.

## Before you deploy

1. Push the repository to a Git provider supported by your chosen host.
2. Set the web app's build/runtime environment variables in the hosting
   dashboard. Do not commit a populated `.env` file.
3. Keep the website and API on one origin. For example, if the site is hosted at
   `https://anifox.example`, its API is hosted at `https://anifox.example/api`.
4. Use the root [`README`](../README.md) and
   [`website/README`](../website/README.md) for product, route, and local
   development details.

### Environment variables

| Variable | Needed for | Notes |
| --- | --- | --- |
| `TMDB_API_KEY` | Movie and TV metadata | Server-side website variable. The Flutter app also needs this value at build time for movie/TV matching. |
| `NEXT_PUBLIC_SITE_URL` | Canonical page metadata | Set to the public website origin, with no trailing path. |
| `DOWNLOAD_PROVIDER_URL` | Optional provider-backed downloads | Server-side only. Configure only a provider you are authorized to use. Leave unset to disable provider downloads. |
| `MANGADEX_API_URL` | Optional MangaDex API mirror | Defaults to `https://api.mangadex.org`. |

`ANIFOX_API_URL` is **not needed for website API requests**; the web client uses
its own origin. Set `NEXT_PUBLIC_SITE_URL` to the website origin to ensure page
metadata uses the right canonical URL. Set `ANIFOX_API_URL` to that same origin
when building the Flutter app:

```bash
ANIFOX_API_URL=https://anifox.example
TMDB_API_KEY=your-tmdb-key
npm run flutter -- build apk --release
```

Do not append `/api` to `ANIFOX_API_URL`. Never put server-only values such as
`DOWNLOAD_PROVIDER_URL` in a Flutter build.

## Cloudflare Workers (recommended)

This repository already includes `website/wrangler.jsonc`,
`website/open-next.config.ts`, and OpenNext scripts. Cloudflare Workers supports
the dynamic routes AniFox needs; **Cloudflare Pages static export does not**.

1. Create a Cloudflare account and connect the repository, or deploy from a local
   checkout.
2. Make `NEXT_PUBLIC_SITE_URL` available during the build. For a local CLI
   deployment, put it in the root `.env` or export it in the shell; for a
   connected build, add it to the build environment. Configure
   `TMDB_API_KEY` and optional `DOWNLOAD_PROVIDER_URL` as Worker secrets after
   the first deployment. Do not commit secrets to `wrangler.jsonc`.
3. From the repository root:

   ```bash
   cd website
   npm ci
   npx wrangler login
   npm run cloudflare:preview
   npm run cloudflare:deploy
   ```

4. Set `TMDB_API_KEY` and optional `DOWNLOAD_PROVIDER_URL` in the Worker's
   settings as secrets (or run `npx wrangler secret put TMDB_API_KEY` and
   `npx wrangler secret put DOWNLOAD_PROVIDER_URL` from `website`). Set
   `MANGADEX_API_URL` there only if using a mirror. Open the assigned
   `workers.dev` URL or attach a custom domain, then copy that origin into
   `ANIFOX_API_URL` when building the Flutter app.

The current Workers Free limits include 100,000 requests per day and 10 ms of
CPU time per HTTP invocation. Network wait time is not CPU time. If a page or
route regularly exceeds a limit, optimize it or compare the current paid plan.
OpenNext also documents a 3 MiB Worker bundle limit on the Free plan.
See [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/),
[Workers limits](https://developers.cloudflare.com/workers/platform/limits/),
and the [OpenNext Cloudflare guide](https://opennext.js.org/cloudflare).

## Vercel

Vercel has first-party Next.js support and can deploy the dynamic pages and API
routes.

1. Import the repository as a new Vercel project.
2. Set **Root Directory** to `website` and select the Next.js framework preset.
3. Enable **Include source files outside of the Root Directory in the Build
   Step**. The MangaDex API adapter is in the sibling
   `server/anifox-manga-api/server/` directory and is imported by the web app.
4. Keep the default install and build commands (`npm install` and `npm run
   build`, or the detected equivalents).
5. Add the variables listed in [Environment variables](#environment-variables)
   in the Vercel project settings, then deploy.

Vercel's free **Hobby** plan is for personal or non-commercial use. Review its
[plan limits](https://vercel.com/docs/plans/hobby) and
[terms](https://vercel.com/legal/terms#hobby-plan) before using it for a public
or monetized deployment.

## Netlify

Netlify's Next.js integration uses its OpenNext adapter and supports dynamic
routes. Configure the monorepo so the build can see both `website/` and the
sibling manga adapter directory.

1. Import the repository as a new Netlify site.
2. Leave **Base directory** at the repository root and set **Package directory**
   to `website`.
3. Use the detected Next.js build settings (normally `npm run build`). Do not
   set a static publish directory or use `next export`.
4. Add the variables listed in [Environment variables](#environment-variables)
   to the site's environment settings, then deploy.

The current Netlify Free plan includes 300 monthly credits; a site pauses when
it reaches its free-plan limit. See
[Netlify's plans](https://www.netlify.com/pricing/),
[monorepo setup](https://docs.netlify.com/build/configure-builds/monorepos/),
and [Next.js support](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/).

## Render

Render can run AniFox as a normal Node.js Next.js server. Keep the **Root
Directory** at the repository root: Render does not make files outside a
configured root directory available to the build, and AniFox imports the
MangaDex adapter from a sibling directory.

1. Create a **Web Service** from the repository.
2. Leave **Root Directory** blank (repository root) and choose Node.
3. Set **Build Command** to:

   ```bash
   npm ci --prefix website && npm --prefix website run build
   ```

4. Set **Start Command** to:

   ```bash
   npm --prefix website start
   ```

5. Set `NODE_VERSION` to `22` and add the variables listed in
   [Environment variables](#environment-variables). Choose the Free compute
   plan if available for your account.
6. Deploy, then use the assigned `onrender.com` origin as
   `ANIFOX_API_URL` for Flutter builds.

Render's free web services sleep after 15 minutes without inbound traffic, take
about a minute to wake, and lose local filesystem changes on restarts or
redeploys. AniFox's app data is local to each user's device, but these limits can
make the first web request slow. See [Render free instances](https://render.com/docs/free)
and [monorepo support](https://render.com/docs/monorepo-support).

## Verify a deployment

- Open `/` and `/home`.
- Open `/api/manga/sources`; it should list MangaDex as the only manga source.
- Open `/api/manga/catalog?page=1`; it should return Safe-rated MangaDex titles.
- Check movie and TV pages after setting `TMDB_API_KEY`.
- If downloads are not configured, `/api/download-links` should return a clear
  unavailable response. Do not configure an unlicensed provider just to make the
  route return links.
- Build the Flutter app with `ANIFOX_API_URL` set to the deployed origin and
  verify MangaDex browsing from the app.
