# AniFox website

Marketing and download site for the AniFox Android app. Built with Next.js 14
(App Router), Tailwind CSS and the same black-glass design language as the app.

## Run it

```bash
cd website
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build
npm start        # serve the build
```

## Deploy (Vercel)

Import the repository, set **Root Directory** to `website/`, keep the **Next.js**
preset, and deploy. Optionally add `GITHUB_TOKEN` to raise GitHub API limits.

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/download` | APK list from the latest GitHub releases (arch + size + direct link) |
| `/privacy`, `/terms` | Legal pages |
| `/api/releases` | JSON release/asset list (10 min cache) |
| `/api/release` | Redirect to the newest APK (universal → arm64 → any) |

## Editing content

- `lib/links.ts` — repository URLs, provider list, posters, FAQ.
- `lib/releases.ts` — GitHub release fetching, ABI naming, byte/date format.
- `app/page.tsx` — hero, feature grid, showcases and CTA sections.

Sections are anchored for the nav: `#features`, `#experience`, `#servers`,
`#faq`.

No API key is required for the site itself. Downloads always come from GitHub
Releases, so publishing a tag is enough to update both `/download` and the
buttons.

## Structure

```
app/
  page.tsx        landing page
  download/       APK list
  api/release/    newest-APK redirect
  api/releases/   release/asset JSON
  privacy/        privacy policy
  terms/          terms of use
  globals.css     design tokens + motion system
components/
  site-nav.tsx    floating pill navigation
  site-footer.tsx footer
  phones.tsx      app UI mockups (pure HTML/CSS)
  motion.tsx      reveal, spotlight, counter
  faq.tsx         accordion
public/
  anifox-logo.png the app mark
```

The UI mockups use poster artwork from `image.tmdb.org`; they need a network
connection to display, and the layout falls back to a dark tile if an image
fails.

## Design notes

- Canvas `#050506`, glass surfaces at 2–6% white, hairline borders.
- Brand orange `#FF7A1A` is reserved for spotlights, the primary CTA and live
  cues; everything else stays silver/white so the app screenshot reads first.
- Motion is CSS-only and respects `prefers-reduced-motion`.
