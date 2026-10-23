# AniFox website

Marketing site for the AniFox Android app. Built with Next.js 14 (App Router),
Tailwind CSS and the same black-glass design language as the app and the
`../dashboard` project.

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

## Editing content

Most copy lives in two places:

- `lib/links.ts` — repository/release URLs, provider list, posters, FAQ.
- `app/page.tsx` — hero, feature grid, showcases and CTA sections.

Sections are anchored for the nav: `#features`, `#experience`, `#servers`,
`#faq`.

## Structure

```
app/
  page.tsx        landing page
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
fails. No API key is required.

## Design notes

- Canvas `#050506`, glass surfaces at 2–6% white, hairline borders.
- Brand orange `#FF7A1A` is reserved for spotlights, the primary CTA and live
  cues; everything else stays silver/white so the app screenshot reads first.
- Motion is CSS-only and respects `prefers-reduced-motion`.
