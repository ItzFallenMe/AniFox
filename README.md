<p align="center">
  <img src="lib/assets/icons/logo.png" width="180" alt="AniFox Logo">
</p>

<h1 align="center">AniFox</h1>

<p align="center">
  Stream and download anime with AniList tracking
</p>

<p align="center">
  <a href="https://github.com/ItzFallenMe/AniFox/releases"><img src="https://img.shields.io/github/v/release/ItzFallenMe/AniFox?style=for-the-badge&color=F97316"></a>
  <a href="https://github.com/ItzFallenMe/AniFox/releases"><img src="https://img.shields.io/github/downloads/ItzFallenMe/AniFox/total?style=for-the-badge&color=F97316"></a>
  <a href="https://github.com/ItzFallenMe/AniFox/blob/master/LICENSE"><img src="https://img.shields.io/github/license/ItzFallenMe/AniFox?style=for-the-badge&color=F97316"></a>
  <a href="https://discord.gg/DEQHYGJ9Zr"><img src="https://img.shields.io/badge/Discord-Join-5865F2?style=for-the-badge&logo=discord&logoColor=white"></a>
</p>

---

## About

**AniFox** is an anime streaming and downloading app (Android, Windows, Linux, macOS) with built-in AniList tracking, episode notifications, a home screen continue-watching widget, and an extension system for adding community sources.

Originally based on [animestream](https://github.com/frostnova721/animestream) by [FrostNova](https://github.com/frostnova721), GPL-3.0.

This repository ships the **full source tree** — no private submodule is required to build.

## Features

- Stream anime from 12+ built-in providers (AnimeKai, AnimePahe, Gogoanime, AllAnime, AnimeParadise, MegaPlay, Anikoto, AniZone, AnimeGG, AniDB, AnimeOnsen, Gojo)
- ShonenX-style **Extensions**: add remote repos (provins / Mangayomi / AniFox index.json) and install extra sources
- Download episodes for offline viewing (queue, pause/resume, retry, MKV remux with embedded subtitles)
- AniList sync (watch history, scoring, lists) + MAL / SimKl
- Episode release notifications with cover art and deep links
- Continue-watching Android widget (up to 3 entries with progress)
- Discord Rich Presence on desktop
- Deep customization: themes, custom accent color, fonts, card radius, grid density, home sections, startup tab, subtitles
- Settings backup/restore (JSON), search history, genre & watch-time stats

## Installation

Download the latest build for your platform from [Releases](https://github.com/ItzFallenMe/AniFox/releases):

| Platform | Artifact |
|---|---|
| Android | `app-release.apk` (universal) or split APKs |
| Windows | `windows.zip` — extract and run `anifox.exe` |
| Linux | `linux.zip` — extract and run the `anifox` bundle |
| macOS | `macos.zip` — extract and drag `AniFox.app` (unsigned build) |

## Building

**Prerequisites:** [Flutter](https://docs.flutter.dev/get-started/install), Android SDK (for APKs), CMake + Ninja + GTK dev libs (for Linux), Visual Studio Build Tools (for Windows), Xcode (for iOS/macOS)

The full source tree is in this repository — just clone and build.

```bash
git clone https://github.com/ItzFallenMe/AniFox.git
cd AniFox

cp .env_example .env     # fill in your keys
flutter pub get

# Convenience wrappers (handles pubspec versions + zip packaging)
bash scripts/build.sh android
bash scripts/build.sh windows   # or: linux | macos | all

# ...or call Flutter directly:
flutter build apk     --dart-define-from-file=.env
flutter build windows --dart-define-from-file=.env
flutter build linux   --dart-define-from-file=.env
flutter build macos   --dart-define-from-file=.env
```

Set up your signing keystore in `android/app/` and `android/key.properties` before building release APKs.

### Scripts

| Script | Purpose |
|---|---|
| `scripts/check.sh` | `flutter analyze` + `flutter test` |
| `scripts/build.sh <target>` | Build + package a platform release |
| `scripts/release.sh <version>` | Validate, tag `vX.Y.Z`, push (triggers CI) |

## Environment Variables

Copy `.env_example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `SIMKL_CLIENT_ID` | Simkl API client ID |
| `SIMKL_CLIENT_SECRET` | Simkl API client secret |
| `DISCORD_APP_ID` | Discord application ID for Rich Presence (desktop) |

All three are available as GitHub Actions secrets for CI builds.

## Releasing

```bash
# 1. Set the version in pubspec.yaml, e.g. 2.0.0+3
# 2. Commit, then:
bash scripts/release.sh 2.0.0
```

The workflow validates the tag against `pubspec.yaml`, runs analyze + tests,
then builds Android/Windows/Linux/macOS in parallel and publishes a GitHub
release (`-alpha`/`-beta`/`-rc` versions are marked as prereleases).

## Contributing

Contributions are welcome! Open an issue or submit a pull request.

## License

GNU General Public License v3.0 — see [LICENSE](LICENSE).

## Disclaimer

- AniFox and its developers are not responsible for any content accessed through the app.
- All content is sourced from third-party APIs and websites.
- Users are responsible for compliance with their local laws and regulations.

## Community

[![Discord](https://invidget.switchblade.xyz/DEQHYGJ9Zr)](https://discord.gg/DEQHYGJ9Zr)
