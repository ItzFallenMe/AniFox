# AniFox Rebrand — OpenCode Task Brief

## How to run this
- Switch OpenCode to **Plan mode** (`Tab`) first, paste everything below the line, and let it propose a plan before touching files. Review, then let it execute.
- Do it phase by phase (Phase 1 → verify → Phase 2 → verify …) rather than all at once — easier to isolate and `/undo` a bad step.
- If this codespace doesn't already have an `AGENTS.md`, run `/init` first so OpenCode has accurate context on the repo's real structure — this brief is the *task*, not the standing project conventions.
- Trim Phase 4's feature list to what you actually want before running it.

---

You're working in my Flutter repo, a fork of `frostnova721/animestream` (anime streaming/download app with AniList tracking, GPL-3.0, cross-platform: Android/iOS/Windows/Linux/macOS/Web). I'm turning it into my own app called **AniFox**, by **ItzFallenMe**. There's a `refers/` folder in this workspace with other apps' source for UI inspiration — use it for design patterns, not this task's code.

### Ground rules
- Grep before you edit — confirm exact locations before any find-and-replace, don't assume paths.
- Don't break what already works: multi-source streaming, AniList sync, the downloader, desktop PiP, the existing theme switcher, notifications. Run `flutter analyze` and a debug build after each phase.
- Keep the GPL-3.0 `LICENSE` file as-is, and keep a short credit line ("Originally based on animestream by FrostNova, GPL-3.0") in the README and an About/Settings screen — required for a GPL fork.
- Match the existing commit style: `feat(scope): ...`, `fix: ...`, `refactor: ...`, `docs: ...`, `chore: ...`.
- Leave signing keystores, `key.properties`, and `.env` alone — mine, not part of this task.
- Out of scope unless I say otherwise: scraper/source backend logic, AniList auth flow, state-management architecture.

### Phase 1 — Rebrand
Replace the app name (`animestream`/`AnimeStream` → `AniFox`) and author (`FrostNova`/`frostnova721` → `ItzFallenMe`, alongside the GPL credit above, not instead of it). Likely spots — confirm each, not exhaustive:
- `pubspec.yaml` — `name:`, `description:`
- Android — `AndroidManifest.xml` (`android:label`), `build.gradle` (`applicationId`; changing this means existing installs won't upgrade in place — propose a new id, e.g. `com.itzfallenme.anifox`, and confirm with me before committing to it)
- iOS — `Info.plist` (`CFBundleName`, `CFBundleDisplayName`), Xcode bundle identifier
- Windows/Linux/macOS — runner app name / window title
- Web — `manifest.json`, `index.html` title
- In-app — about/settings/contributors screens, any "made with ❤️ by" strings, app bar titles
- Regenerate launcher icons for every platform from the new logo using `flutter_launcher_icons` (add as a dev dependency, don't hand-resize icons)

### Phase 2 — Theme from my logo
- Swap the logo file(s) under `lib/assets/icons/` (and wherever the launcher-icon source images live) for my AniFox logo.
- Find the existing theme system first — it already has multiple presets (default, AMOLED/monochrome, etc. — search for `ThemeData`/`ColorScheme`/files with "theme" in the name) before adding anything.
- Pull a palette from the new logo. If I've given you hex codes directly, use those instead of auto-extracting from the PNG — more accurate.
- Add an "AniFox" preset with that palette (primary/accent/surface/dark background), make it the default, but keep the existing presets selectable rather than deleting them.
- Style note: my other UI work leans glassmorphism — frosted/blurred translucent surfaces, soft borders. Carry that into cards/sheets/the nav bar where it doesn't fight the logo palette.

### Phase 3 — App-open animation (Discord/Crunchyroll style)
Two layers:
1. **Native splash** — add `flutter_native_splash`, configure it in `pubspec.yaml` with the AniFox logo on a background color from the new theme, generate for every platform.
2. **In-app animated intro** — a first route that scales/fades the logo in (~500-700ms, a slight overshoot like `Curves.easeOutBack` reads well), optionally a soft glow/color wash behind it in the accent color, holds briefly (~600-900ms), then transitions into the existing home screen (reuse the current initial-route logic, don't duplicate it). Keep total time ~1.5-2.5s and make it tap-to-skip. Build it with Flutter's own `AnimationController`/`Tween` — no new dependency needed — unless I already have a Lottie/Rive file for the logo reveal, in which case use the `lottie`/`rive` package against that asset instead.

### Phase 4 — New features (I'll trim this before running — treat each line as optional)
- [ ] **Discord Rich Presence** — "Watching `<Anime>` · Ep `<N>`" in my Discord status during playback. Desktop-only (Windows/Linux/macOS) — Discord's RPC IPC doesn't reach Android/iOS/Web, so gate it behind a platform check. Check pub.dev for the current best-maintained package (`dart_discord_presence`, `discord_rpc`, `flutter_discord_rpc` all exist — compare upkeep before picking one); needs an app registered on the Discord Developer Portal for an application ID + art assets.
- [ ] **AniSkip auto-skip** — auto-skip OP/ED using the community AniSkip API keyed by MAL/AniList id, with a manual override if timestamps are missing or wrong. Check current AniSkip API docs for the exact request shape before implementing.
- [ ] **Episode-release notifications** — local/push notification when a new episode airs for something on my AniList watching/planning list, using AniList's airing-schedule data (extends the existing "completed" notification).
- [ ] **Cast to TV** — Chromecast (and AirPlay on iOS) support in the player.
- [ ] **Continue-watching home-screen widget** — Android widget showing the next unwatched episode for one-tap resume.
- [ ] **Visual stats dashboard** — an in-app chart view (genre breakdown, watch-time trend) instead of only linking out to AniList's stats page.
- [ ] **App lock** — optional PIN/biometric lock on launch.

### Phase 5 — Polish using refers/
Before touching a screen (home/browse grid, player controls, anime detail page, settings), check `refers/` for an app that handles it well and adapt the pattern — spacing, motion, structure — into this codebase's existing widgets/state management. Rewrite to fit, don't paste foreign code wholesale, and check that reference app's license before lifting anything non-trivial from it.

### Done-check for every phase
- `flutter analyze` clean
- Debug build succeeds and boots through the new intro into the existing home screen
- Streaming/downloading/AniList sync/theme switching still work
- `CHANGELOG.md` updated in the existing style
- Final grep pass — no leftover "animestream"/"FrostNova" strings