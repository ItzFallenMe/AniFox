<p align="center">
  <img src="lib/assets/icons/logo.png" width="180" alt="AniFox Logo">
</p>

<h1 align="center">AniFox</h1>

<p align="center">
  <b>A modern anime streaming experience built with Flutter.</b><br>
  Stream • Download • Track with AniList • Customize everything
</p>

<p align="center">
  <a href="https://github.com/ItzFallenMe/AniFox/releases">
    <img src="https://img.shields.io/github/v/release/ItzFallenMe/AniFox?style=for-the-badge&color=F97316" />
  </a>
  <a href="https://github.com/ItzFallenMe/AniFox/releases">
    <img src="https://img.shields.io/github/downloads/ItzFallenMe/AniFox/total?style=for-the-badge&color=F97316" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/ItzFallenMe/AniFox?style=for-the-badge&color=F97316" />
  </a>
  <a href="https://discord.gg/9p2UP7X2hN">
    <img src="https://img.shields.io/discord/1298715486436657202?style=for-the-badge&logo=discord&label=Discord" />
  </a>
</p>

<p align="center">
  <b>Android</b> • <b>Windows</b> • <b>Linux</b> • <b>macOS</b>
</p>

---

## 📖 About

AniFox is a modern **Flutter-powered anime streaming application** focused on providing a smooth, elegant, and feature-rich watching experience — now on **desktop as well as mobile**.

Whether you're binge-watching your favorite series, downloading episodes for offline viewing, or keeping everything synced with **AniList**, AniFox keeps your anime library organized and accessible.

Originally based on **AnimeStream** by FrostNova and expanded with numerous improvements, redesigned UI components, additional features, and continuous maintenance.

**v2 "Eclipse"** brings the full source into this repository, adds desktop builds, a community **extension system**, deep customization, and Discord Rich Presence.

> **No private submodule needed.** Clone, run `flutter pub get`, build. The whole source tree is here.

---

# ✨ Features

## 🎬 Streaming

- **12 built-in providers** — AnimeKai, AnimePahe, Gogoanime, AllAnime, AnimeParadise, MegaPlay, Anikoto, AniZone, AnimeGG, AniDB, AnimeOnsen, Gojo
- **Extensions system** — add community repositories and install extra sources without waiting for an app update
- Fast episode loading
- Multiple video qualities and servers per episode
- Sub and dub selection
- Subtitle support with full styling controls
- Per-episode server memory ("quick play")
- External player support
- Continue Watching

---

## 🖥️ Cross-Platform

- **Windows** — custom frameless-style title bar, desktop player controls, fullscreen toggle
- **Linux** — native GTK build with tiling-WM aware windowing
- **macOS** — native build (unsigned, see [Installation](#-installation))
- **Android** — PiP, home-screen widget, native notifications
- Shared data directory layout and one build pipeline for every target

---

## 📥 Downloads

- Download episodes for offline playback
- Download queue with pause, resume, and **retry** on failure
- Parallel or queued (one-at-a-time) download modes
- MKV remuxer with optional **embedded subtitle tracks**
- Direct-download extraction where a source supports it

---

## 📚 AniList Integration

- Login with AniList
- Automatic watch progress sync
- Update scores
- Manage lists (watching, planning, completed, dropped, paused)
- Track completed anime
- Recently watched synchronization
- MyAnimeList and SimKl account support

---

## 🔔 Smart Features

- Episode release notifications with **cover art** and deep links
- Continue Watching widget showing up to 3 entries with progress
- Personalized recommendations
- Watch statistics
- Genre statistics
- Watch time dashboard
- Recent search history
- Settings backup and restore (JSON)

---

## 🎨 UI & Experience

- Material Design 3
- Smooth animations
- Native splash screen with animated intro
- 12 themes, light & dark, AMOLED black
- **Custom accent color** with automatic readable contrast
- **App font** selection
- Card corner radius and grid density controls
- Per-section home screen toggles and startup tab selection
- Full subtitle customization (font, size, stroke, shadow, background, margin)
- Haptic feedback toggle
- Discord Rich Presence on desktop

---

# 📱 Screenshots

> Screenshots coming soon.

| Home | Player | Details |
|------|---------|---------|
| 📷 | 📷 | 📷 |

| Downloads | Profile | Search |
|-----------|----------|--------|
| 📷 | 📷 | 📷 |

---

# 🚀 Installation

Download the latest build from the **Releases** page.

https://github.com/ItzFallenMe/AniFox/releases

| Platform | Artifact | How to run |
|---|---|---|
| Android | `app-release.apk` | Install directly (enable *Install Unknown Apps*), or grab a split APK for your ABI |
| Windows | `windows.zip` | Extract → run `anifox.exe` |
| Linux | `linux.zip` | Extract → run the `anifox` bundle |
| macOS | `macos.zip` | Extract → drag `AniFox.app` into Applications |

> macOS builds are unsigned. On first launch use right-click → **Open**, or run
> `xattr -cr AniFox.app` from Terminal.

---

# 🛠 Building From Source

## Requirements

- Flutter 3.44.0 (see `.fvmrc`; Dart 3.12+ required)
- Git
- Android SDK (for APKs)
- CMake, Ninja, and `libgtk-3-dev` (for Linux)
- Visual Studio Build Tools (for Windows)
- Xcode (for macOS)

Clone the repository

```bash
git clone https://github.com/ItzFallenMe/AniFox.git
cd AniFox
```

Create your environment file

```bash
cp .env_example .env
```

Install dependencies

```bash
flutter pub get
```

Run (debug)

```bash
flutter run --dart-define-from-file=.env
```

Build a release

```bash
# One-shot build + packaging per platform
bash scripts/build.sh android
bash scripts/build.sh windows    # or: linux | macos | all

# ...or call Flutter directly
flutter build apk     --release --dart-define-from-file=.env
flutter build windows --release --dart-define-from-file=.env
flutter build linux   --release --dart-define-from-file=.env
flutter build macos   --release --dart-define-from-file=.env
```

Set up your signing keystore in `android/app/` and `android/key.properties` before
building release APKs.

## Helper Scripts

| Script | Purpose |
|---|---|
| `scripts/check.sh` | `flutter pub get` + `flutter analyze` + `flutter test` |
| `scripts/build.sh <target>` | Build and package a platform release (`android`/`windows`/`linux`/`macos`/`all`) |
| `scripts/release.sh <version>` | Validate against `pubspec.yaml`, tag `vX.Y.Z`, push to trigger CI |

---

# 🔐 Environment Variables

Copy `.env_example` to `.env`

| Variable | Required | Description |
|---|---|---|
| `SIMKL_CLIENT_ID` | For SimKl | Simkl Client ID |
| `SIMKL_CLIENT_SECRET` | For SimKl | Simkl Client Secret |
| `DISCORD_APP_ID` | For Discord RPC | Discord Application ID (desktop Rich Presence) |

All three are also available as GitHub Actions secrets for CI builds.

---

# 🧩 Extensions

AniFox can load additional sources from community repositories, following the
extension approach used by [ShonenX](https://github.com/roshancodespace/ShonenX).

1. Go to **Settings → General → Manage Providers**
2. Add a repository URL (any provins / Mangayomi / AniFox `index.json`)
3. Browse the **Available** tab and tap **install**

Installed extensions appear alongside the built-in providers and can be enabled,
disabled, or removed at any time.

---

# 📂 Project Structure

```
lib/
├── core/                    # providers, downloader, remuxer, network, database
│   ├── anime/
│   │   ├── providers/       # 12 built-in sources + AnimeProvider interface
│   │   ├── extensions/      # v2 repo manager + Mangayomi adapter
│   │   ├── extractors/      # Kwik, Vidtube, Streamwish
│   │   └── downloader/      # queue, isolate workers, MKV remux
│   ├── app/                 # bootstrap, env, theme resolution, Discord RPC
│   ├── data/                # Hive settings, preferences, search history
│   ├── database/            # AniList / MAL / SimKl / AniSkip clients
│   ├── network/             # HTTP client + response cache
│   ├── integrations/        # notifications, widget, Discord
│   └── remuxer/             # TS → MKV muxer (H.264, AAC, subtitles)
├── ui/
│   ├── models/              # providers, widgets, bottom sheets
│   ├── pages/               # screens (home, search, info, watch, settings)
│   └── theme/               # theme registry + ThemeResolver
└── main.dart                # entry point, deep links, desktop window setup
```

---

# 🏗 Tech Stack

- Flutter 3.44.0 / Dart 3.12
- `provider` for state management
- Material 3
- Hive for local persistence
- `better_player` + `fvp` for playback
- Custom isolate-based download manager
- AniList / MyAnimeList / Simkl APIs
- `awesome_notifications` for scheduled episode alerts
- `home_widget` for the Android widget
- `dart_discord_presence` for desktop Rich Presence
- Custom TS → MKV remuxer (H.264, AAC, subtitle tracks)

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature/amazing-feature
```

3. Run the checks before committing

```bash
bash scripts/check.sh
```

4. Commit your changes

```bash
git commit -m "feat: add amazing feature"
```

5. Push and open a Pull Request

```bash
git push origin feature/amazing-feature
```

CI runs the same analyze + test gate before any build is published.

---

# 🗺 Roadmap

- [x] AniList Integration
- [x] Downloads
- [x] Notifications
- [x] Continue Watching
- [x] Widgets
- [x] Windows, Linux & macOS support
- [x] Extension system
- [x] Discord Rich Presence
- [x] Deep theming & customization
- [ ] Chromecast Support
- [ ] Android TV Support
- [ ] Better Recommendation Engine
- [ ] More Streaming Providers
- [ ] Multi-language Support
- [ ] iOS Support (Future)

---

# ❓ FAQ

### Is AniFox free?

Yes.

### Does AniFox host anime?

No.

AniFox acts as a client that accesses publicly available third-party sources.

### Can I download anime?

Yes.

Supported providers allow offline downloading.

### Does AniFox require an AniList account?

No.

AniList is optional but recommended for synchronization.

### A provider stopped working. Now what?

Open **Settings → General → Manage Providers** and install an alternative source from a
community repository. Provider availability changes often, and you can add a new one
without waiting for an app update.

### Which platforms are supported?

Android, Windows, Linux, and macOS. iOS is planned; the code is mostly platform-agnostic
but the player and notification stack need work first.

---

# ⚠ Disclaimer

AniFox does **not** host or upload any video content.

All media is provided by publicly available third-party sources.

The developers of AniFox are **not responsible** for the content available through those sources.

Users are responsible for complying with the laws and regulations applicable in their jurisdiction.

---

# 📜 License

This project is licensed under the **GNU General Public License v3.0**.

See the [LICENSE](LICENSE) file for details.

---

# ❤️ Credits

- [FrostNova](https://github.com/frostnova721) — Original AnimeStream project
- [ShonenX](https://github.com/roshancodespace/ShonenX) — extension system inspiration
- AniList
- Simkl
- Flutter Team
- Contributors

---

# 🌟 Support

If you enjoy AniFox, consider helping the project by:

⭐ Starring the repository

🐛 Reporting bugs

💡 Suggesting new features

🤝 Contributing code

---

<p align="center">

Made with ❤️ using Flutter

</p>