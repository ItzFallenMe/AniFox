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

**AniFox** is a cross-platform anime streaming and downloading app with built-in AniList tracking, episode notifications, Discord Rich Presence, and an Android home screen widget.

Originally based on [animestream](https://github.com/frostnova721/animestream) by [FrostNova](https://github.com/frostnova721), GPL-3.0.

## Features

- Stream anime from multiple sources
- Download episodes for offline viewing
- AniList sync (watch history, scoring, lists)
- Discord Rich Presence on desktop
- Episode release notifications
- Continue-watching Android widget
- Genre and watch-time stats dashboard
- Multiple themes including AniFox (orange)
- Native splash screen with animated intro

## Installation

Download the latest APK from [Releases](https://github.com/ItzFallenMe/AniFox/releases).

## Building

**Prerequisites:** [Flutter](https://docs.flutter.dev/get-started/install)

```bash
# Clone the repo
git clone https://github.com/ItzFallenMe/AniFox.git
cd AniFox

# Install dependencies
flutter pub get

# Build APK
./anifox build apk

# Build for Windows
./anifox build windows

# Package Windows installer (requires Inno Setup)
./anifox pack windows
```

The `./anifox` script automatically loads `.env` variables (API URL, SIMKL credentials, Discord App ID) so you don't pass `--dart-define-from-file` manually.

Set up your signing keystore in `android/app/` and `android/key.properties` before building release APKs.

## Environment Variables

Copy `.env_example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `SIMKL_CLIENT_ID` | Simkl API client ID |
| `SIMKL_CLIENT_SECRET` | Simkl API client secret |
| `COMMENTUM_API_URL` | Commentum API endpoint |
| `DISCORD_APP_ID` | Discord Developer Portal app ID |

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
