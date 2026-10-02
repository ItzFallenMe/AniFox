<p align="center">
  <img src="lib/assets/icons/logo.png" width="180" alt="AniFox Logo">
</p>

<h1 align="center">AniFox</h1>

<p align="center">
  <b>Stream, download, and track anime — on Android, Windows, Linux, and macOS.</b><br>
  AniFox v2 "Eclipse" · full source · bring your own sources
</p>

<p align="center">
  <a href="https://github.com/ItzFallenMe/AniFox/releases"><img src="https://img.shields.io/github/v/release/ItzFallenMe/AniFox?style=for-the-badge&color=F97316"></a>
  <a href="https://github.com/ItzFallenMe/AniFox/releases"><img src="https://img.shields.io/github/downloads/ItzFallenMe/AniFox/total?style=for-the-badge&color=F97316"></a>
  <a href="https://github.com/ItzFallenMe/AniFox/blob/master/LICENSE"><img src="https://img.shields.io/github/license/ItzFallenMe/AniFox?style=for-the-badge&color=F97316"></a>
  <a href="https://discord.gg/DEQHYGJ9Zr"><img src="https://img.shields.io/badge/Discord-Join-5865F2?style=for-the-badge&logo=discord&logoColor=white"></a>
</p>

---

## About

**AniFox** is an anime streaming and downloading client with AniList tracking, episode
notifications, a home-screen continue-watching widget, and an extension system for adding
community sources.

Originally based on [animestream](https://github.com/frostnova721/animestream) by
[FrostNova](https://github.com/frostnova721), GPL-3.0. The extension architecture takes
inspiration from [ShonenX](https://github.com/roshancodespace/ShonenX).

> **This repository ships the full source tree.** Clone, `flutter pub get`, build. No private
> submodule, no access tokens required.

---

## What's new in v2

| Area | Change |
|---|---|
| **Platforms** | Windows, Linux, and macOS builds alongside Android — custom title bar, desktop controls, PiP on desktop, FVP frame-exact playback |
| **Providers** | 12 built-in providers (up from 6): AnimeKai, Gogoanime, AllAnime, AnimeParadise, MegaPlay added; AnimePahe mirror rotation + pagination fixes |
| **Extensions** | ShonenX-style repo manager — add remote `index.json` repos, install/enable/disable sources in-app |
| **Customization** | App font, custom accent color (WCAG-aware), card radius, grid density, per-section home toggles, startup tab, full subtitle controls |
| **Discord RPC** | Desktop Rich Presence showing title + episode, synced on episode change |
| **Notifications** | Cover art + deep links, progress throttling, separate downloads channel |
| **Widget** | Continue-watching widget now holds up to 3 entries with progress % |
| **Downloader** | Working retry for failed downloads, queue-aware concurrency, MKV remux with embedded subtitles |
| **Themes** | Fixed default-theme bug (id `0` was rejected as invalid), single theme-resolution path |
| **Build system** | `validate` CI gate (analyze + tests), 4-platform parallel builds, prerelease auto-detection, local build/check scripts |

---

## Features

**Streaming & downloads**
- 12 built-in providers with dub/sub selection, multi-server picking, and per-episode server memory
- Queue, pause/resume, and retry downloads; MKV remux with optional embedded subtitle tracks
- Direct-download extraction where a source supports it

**Tracking**
- AniList sync: watch history, scores, and list statuses
- MyAnimeList and SimKl accounts
- Continue-watching and in-progress lists on the home screen
- Genre and watch-time statistics dashboard

**Integrations**
- Episode release notifications with cover art, firing at the real broadcast time
- Android home-screen widget with resume progress
- Discord Rich Presence on desktop
- Deep links (`anifox://info?id=<anilist_id>`)

**Customization**
- 12 themes (AniFox orange by default), light/dark, AMOLED black
- Custom accent color, app font, card corner radius, grid columns
- Subtitle styling: font, size, stroke, shadow, background, margin
- Startup tab, home-section toggles, haptic feedback, search history
- Settings backup and restore as JSON

---

## Built-in providers

| Provider | Sub | Dub | Notes |
|---|:---:|:---:|---|
| AnimeKai | ✅ | ✅ | Multi-server, vidtube/streamwish extraction |
| AnimePahe | ✅ | ✅ | Mirror rotation across 4 domains |
| Gogoanime (Anitaku) | ✅ | ✅ | Multi-mirror, direct downloads |
| AllAnime | ✅ | ✅ | GraphQL API with mirror fallback |
| AnimeParadise | ✅ | ✅ | JSON + HTML scraping |
| MegaPlay | ✅ | ✅ | TMDB-indexed catalog |
| Anikoto | ✅ | ✅ | AnimeSkip + Kiwi mapper |
| AniZone | ✅ | — | Single-quality streams |
| AnimeGG | ✅ | ✅ | Up to 4 qualities |
| AniDB | ✅ | ✅ | Embed aggregation |
| AnimeOnsen | ✅ | — | DASH; no download (needs ffmpeg) |
| Gojo | ✅ | ✅ | Quality selection + subtitles |

Provider availability changes often — if one goes down, the Extensions page lets you add
another without waiting for an app update.

---

## Extensions

AniFox v2 can load extra sources from community repositories, modelled on
[ShonenX](https://github.com/roshancodespace/ShonenX)'s system:

1. Go to **Settings → General → Manage Providers**
2. Add a repository URL (any provins / Mangayomi / AniFox `index.json`)
3. Browse **Available**, tap **install**

Installed extensions appear alongside the built-in providers and can be toggled off or
removed at any time.

---

## Installation

Grab the latest build for your platform from
[Releases](https://github.com/ItzFallenMe/AniFox/releases):

| Platform | Artifact | How to run |
|---|---|---|
| Android | `app-release.apk` | install directly, or split APKs per ABI |
| Windows | `windows.zip` | extract → `anifox.exe` |
| Linux | `linux.zip` | extract → run `anifox` |
| macOS | `macos.zip` | extract → drag `AniFox.app` (unsigned build) |

> macOS builds are unsigned. Gatekeeper will require a right-click → Open on first launch,
> or run `xattr -cr AniFox.app`.

---

## Building from source

**Prerequisites**
- [Flutter](https://docs.flutter.dev/get-started/install) 3.41.6 (see `.fvmrc`)
- Android SDK — for APKs
- CMake + Ninja + `libgtk-3-dev` — for Linux
- Visual Studio Build Tools — for Windows
- Xcode — for macOS

```bash
git clone https://github.com/ItzFallenMe/AniFox.git
cd AniFox

cp .env_example .env      # fill in your keys
flutter pub get

# One-shot build + packaging (handles version + zip):
bash scripts/build.sh android
bash scripts/build.sh windows      # or: linux | macos | all

# Or call Flutter directly:
flutter build apk     --dart-define-from-file=.env
flutter build windows --dart-define-from-file=.env
flutter build linux   --dart-define-from-file=.env
flutter build macos   --dart-define-from-file=.env
```

Set up your signing keystore in `android/app/` and `android/key.properties` before building
release APKs.

### Repository layout

```
lib/
├── core/                 # anime providers, downloader, remuxer, network, database
│   ├── anime/
│   │   ├── providers/    # 12 built-in sources + AnimeProvider interface
│   │   ├── extensions/   # v2 extension repo manager + Mangayomi adapter
│   │   ├── extractors/   # Kwik, Vidtube, Streamwish
│   │   └── downloader/   # queue, isolate workers, MKV remux
│   ├── app/              # bootstrap, env, theme resolution, Discord RPC
│   ├── data/             # Hive-backed settings, preferences, history
│   ├── database/         # AniList / MAL / SimKl / AniSkip clients
│   ├── network/          # HTTP client + response cache
│   └── remuxer/          # TS → MKV muxer (H.264, AAC, subtitles)
├── ui/                   # pages, widgets, providers, themes
└── main.dart             # app entry, deep links, desktop window setup
```

### Scripts

| Script | Purpose |
|---|---|
| `scripts/check.sh` | `flutter pub get` + `flutter analyze` + `flutter test` |
| `scripts/build.sh <target>` | Build and package a platform release |
| `scripts/release.sh <version>` | Validate, tag `vX.Y.Z`, push to trigger CI |

---

## Environment variables

Copy `.env_example` to `.env` and fill in:

| Variable | Required | Description |
|---|:---:|---|
| `SIMKL_CLIENT_ID` | for SimKl | Simkl API client ID |
| `SIMKL_CLIENT_SECRET` | for SimKl | Simkl API client secret |
| `DISCORD_APP_ID` | for Discord RPC | Discord application ID (desktop Rich Presence) |

All are available as GitHub Actions secrets for CI builds.

---

## Releasing

```bash
# 1. Bump "version:" in pubspec.yaml (e.g. 2.0.0+3)
# 2. Commit, then:
bash scripts/release.sh 2.0.0
```

The script checks that the tag matches `pubspec.yaml`, runs the analyze + test gate, then
tags and pushes. GitHub Actions then:

1. validates the tag against `pubspec.yaml`
2. runs `flutter analyze` and `flutter test`
3. builds Android, Windows, Linux, and macOS in parallel
4. publishes a GitHub release (versions containing `-alpha` / `-beta` / `-rc` are marked
   as prereleases)

Artifacts land as `app-release.apk`, `windows.zip`, `linux.zip`, and `macos.zip`.

---

## Contributing

Contributions are welcome — open an issue or submit a pull request. Please run
`bash scripts/check.sh` before pushing; CI enforces the same gate.

---

## Disclaimer

- AniFox and its developers are not responsible for any content accessed through the app.
- All content is sourced from third-party APIs and websites. AniFox hosts no media.
- Users are responsible for compliance with their local laws and regulations.

---

## License

GNU General Public License v3.0 — see [LICENSE](LICENSE).

---

## Community

[![Discord](https://invidget.switchblade.xyz/DEQHYGJ9Zr)](https://discord.gg/DEQHYGJ9Zr)