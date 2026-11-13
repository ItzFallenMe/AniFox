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

- Flutter `3.41.x` or newer (the repo pins a version in `.fvmrc`)
- Dart `3.9.x` or newer
- Node.js `20+` for the website
- Platform toolchains for the targets you build

## Local setup

### Flutter app

```bash
flutter pub get
flutter run --dart-define=TMDB_API_KEY="your-tmdb-key"
```

Movies and TV need a TMDB key. Anime works without one. Never commit real keys;
pass them as `--dart-define` values or keep them in a local, ignored file.

### Website

```bash
cd website
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000/home> for the streaming client.

## Before opening a pull request

Run the checks that cover your change:

```bash
# Flutter
flutter analyze
dart format --output=none --set-exit-if-changed lib test

# Website
cd website
npm run typecheck
npm run lint
npm run build
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

AniFox is licensed under the GNU General Public License v3.0. By contributing you
agree that your changes are provided under the same license.
