# Changelog

All notable changes to AniFox are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and releases use
[semantic versioning](https://semver.org/).

## [Unreleased]

### Fixed

- Web API routes now use the Node.js runtime supported by the OpenNext
  Cloudflare Worker build.
- Web and app CI install the shared manga adapter dependencies before building
  the website or running adapter tests.

### Added

- Open-source contributor guides, issue forms, pull request template, security
  policy and code of conduct.
- Web checks workflow, Dependabot configuration and editor defaults.
- Third-party font license notices and a single documented root environment
  template for contributors.

### Changed

- Removed Google Cast from the web player; bundled third-party iframe sources do
  not expose media URLs for a practical non-Google TV casting path.
- Web client rebuilt around the billboard and rail layout, with a hover-expand
  sidebar on desktop and floating tab navigation on mobile.
- Watch pages now place a 16:9 player stage above the title details on every
  screen size, keeping the host player fully interactive.
- Movies, TV, anime, explore and manga pages share one search and poster-grid
  design.
- Downloads screen shows storage location, totals, status filters and richer
  progress cards.

### Fixed

- Manga API uses the public MangaDex API after the old scraper provider went
  offline, so catalog, search, chapters and reader pages work again.
- Android CI installs the Rust toolchain and targets required by `rhttp`.
- Download, server and episode panels stay hidden until opened, so they no
  longer intercept touches on the player.
- Removed the unused top navigation and home spotlight components.

## [2.1.5] - 2026-10-23

### Added

- In-app download provider that saves files to `AniFox/downloads`.
- Chromecast receiver on the web client.
- Manga catalog, chapter list and reader backed by the Manga API.

[Unreleased]: https://github.com/ItzFallenMe/AniFox/compare/v2.1.5...HEAD
[2.1.5]: https://github.com/ItzFallenMe/AniFox/releases/tag/v2.1.5
