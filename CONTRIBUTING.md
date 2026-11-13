# Contributing to AniFox

Thanks for taking the time to improve AniFox. This guide covers the setup,
checks and conventions used in the repository. By participating you agree to
follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to help

- **Bug reports** — open an issue using the bug report form with the app or web
  version, platform and reproduction steps.
- **Feature requests** — describe the problem you want solved, not only the
  solution. Small, focused proposals are easiest to review.
- **Code** — fix an issue, add a stream source, improve the web client or the
  Flutter UI.
- **Docs** — corrections to the READMEs and setup instructions are always
  welcome.

Please do not open public issues for security problems. See
[SECURITY.md](SECURITY.md).

## Requirements

- Flutter `3.44.0` (pinned in `.fvmrc`)
- Dart `3.9.x` or newer
- Node.js `22+` for the website and Cloudflare Worker build
- Platform toolchains for the targets you build

## Local setup

```bash
cp .env.example .env
npm ci --prefix website
npm ci --prefix server/anifox-manga-api/server
flutter pub get
```

Run the Flutter app with `npm run flutter -- run`; the wrapper reads the root
`.env` and forwards supported build values. Movies and TV need a TMDB key; anime
works without one. Never commit real keys.

```bash
npm run web:dev
```

Open <http://localhost:3000> for the landing page or
<http://localhost:3000/home> for the streaming client. The root `.env.example`
is the shared environment template; the website reads the root `.env`.

## Before opening a pull request

Run the checks that cover your change:

```bash
# Flutter
npm run flutter -- analyze --no-pub
npm run flutter -- test --no-pub
dart format --output=none --set-exit-if-changed lib test

# Web client and shared API
npm run web:typecheck
npm run web:lint
npm run web:build
npm run web:cloudflare:build
npm run api:test
```

Keep pull requests small and scoped. One logical change per pull request is
easier to review than a mixed refactor.

## Code style

- Follow the existing structure and naming. Feature code lives in
  `lib/modules/<feature>/` with `data`, `models`, `state` and `ui` folders.
- Prefer small widgets and providers over large screens with inline logic.
- Do not add banner comments or commented-out code.
- The website uses TypeScript, the Next.js App Router and Tailwind utilities.
- Match the existing dark theme and spacing; new UI should work at 360px wide
  and on desktop.

## Commit messages

Write a short imperative subject line, then a sentence or two explaining why the
change was made. Reference issues with `Fixes #123` when applicable.

## Secrets

API keys, keystores, `.env` files and downloaded media must never be committed.
The repository ignores `.env*` (except `.env.example`), `android/key.properties`,
keystores and archives. If you find a committed secret, report it privately
instead of opening an issue.

## Licensing

AniFox is licensed under the GNU General Public License v3.0 only. By
contributing, you agree that your contributions are provided under that license.
