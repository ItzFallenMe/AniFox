<p align="center">
  <img src="lib/assets/icons/logo.png" width="180" alt="AniFox Logo">
</p>

<h1 align="center">AniFox</h1>

<p align="center">
  <b>A modern Android anime streaming experience built with Flutter.</b><br>
  Stream • Download • Track with AniList • Beautiful UI
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

---

## 📖 About

AniFox is a modern **Flutter-powered Android anime streaming application** focused on providing a smooth, elegant, and feature-rich watching experience.

Whether you're binge-watching your favorite series, downloading episodes for offline viewing, or keeping everything synced with **AniList**, AniFox keeps your anime library organized and accessible.

Originally based on **AnimeStream** by FrostNova and expanded with numerous improvements, redesigned UI components, additional features, and continuous maintenance.

---

# ✨ Features

## 🎬 Streaming

- Multiple anime providers
- Fast episode loading
- Multiple video qualities
- Subtitle support
- External player support
- Continue Watching

---

## 📥 Downloads

- Download episodes
- Offline playback
- Download management
- Resume interrupted downloads

---

## 📚 AniList Integration

- Login with AniList
- Automatic watch progress sync
- Update scores
- Manage lists
- Track completed anime
- Recently watched synchronization

---

## 🔔 Smart Features

- Episode release notifications
- Continue Watching widget
- Personalized recommendations
- Watch statistics
- Genre statistics
- Watch time dashboard

---

## 🎨 UI & Experience

- Material Design 3
- Smooth animations
- Native splash screen
- Multiple themes
- AniFox Orange Theme
- AMOLED Dark Theme
- Responsive layouts
- Fast navigation

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

Download the latest APK from the **Releases** page.

https://github.com/ItzFallenMe/AniFox/releases

Enable **Install Unknown Apps** if installing manually.

---

# 🛠 Building From Source

## Requirements

- Flutter
- Android Studio
- Android SDK
- Git
- GitHub Personal Access Token

Clone the repository

```bash
git clone https://github.com/ItzFallenMe/AniFox.git
cd AniFox
```

Fetch the private core

```bash
export PRIVATE_REPO_TOKEN=YOUR_GITHUB_PAT

bash scripts/fetch_core.sh
```

Install dependencies

```bash
flutter pub get
```

Create your environment file

```text
cp .env_example .env
```

Run

```bash
flutter run --dart-define-from-file=.env
```

Build Release

```bash
flutter build apk --release --dart-define-from-file=.env
```

---

# 🔐 Environment Variables

Copy `.env_example` to `.env`

| Variable | Description |
|-----------|-------------|
| `SIMKL_CLIENT_ID` | Simkl Client ID |
| `SIMKL_CLIENT_SECRET` | Simkl Client Secret |

---

# 📂 Project Structure

```
lib/
 ├── assets/
 ├── core/
 ├── models/
 ├── providers/
 ├── screens/
 ├── services/
 ├── utils/
 ├── widgets/
 └── main.dart
```

---

# 🏗 Tech Stack

- Flutter
- Dart
- Riverpod
- Material 3
- AniList API
- Simkl API
- Android SDK

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature/amazing-feature
```

3. Commit your changes

```bash
git commit -m "feat: add amazing feature"
```

4. Push

```bash
git push origin feature/amazing-feature
```

5. Open a Pull Request

---

# 🗺 Roadmap

- [x] AniList Integration
- [x] Downloads
- [x] Notifications
- [x] Continue Watching
- [x] Widgets
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

- FrostNova — Original AnimeStream project
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
