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

**AniFox** is an Android anime streaming and downloading app with built-in AniList tracking, episode notifications, and a home screen continue-watching widget.

Originally based on [animestream](https://github.com/frostnova721/animestream) by [FrostNova](https://github.com/frostnova721), GPL-3.0.

## Features

- Stream anime from multiple sources
- Download episodes for offline viewing
- AniList sync (watch history, scoring, lists)
- Episode release notifications
- Continue-watching Android widget
- Genre and watch-time stats dashboard
- Multiple themes including AniFox (orange)
- Native splash screen with animated intro

## Installation

Download the latest APK from [Releases](https://github.com/ItzFallenMe/AniFox/releases).

## Building

**Prerequisites:** [Flutter](https://docs.flutter.dev/get-started/install), Android SDK

```bash
git clone https://github.com/ItzFallenMe/AniFox.git
cd AniFox
flutter pub get
flutter build apk --dart-define-from-file=.env
```

Set up your signing keystore in `android/app/` and `android/key.properties` before building release APKs.

## Environment Variables

Copy `.env_example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `SIMKL_CLIENT_ID` | Simkl API client ID |
| `SIMKL_CLIENT_SECRET` | Simkl API client secret |
| `COMMENTUM_API_URL` | Commentum API endpoint |

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
