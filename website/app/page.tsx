import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRightIcon, GithubIcon, PlayIcon } from "@/components/icons";
import { DownloadCount } from "@/components/download-count";

const GITHUB = "https://github.com/ItzFallenMe/AniFox";
const RELEASES = `${GITHUB}/releases/latest`;

export const metadata: Metadata = {
  title: "Download AniFox",
  description:
    "Discover anime, movies, and TV in AniFox — a free, open-source streaming client for your favorite screens.",
};

const platforms = [
  { name: "Android", mark: "A", detail: "APK for phones and tablets", href: RELEASES, featured: true },
  { name: "iOS", mark: "iOS", detail: "Built with Flutter", href: RELEASES, featured: false },
  { name: "Windows", mark: "▦", detail: "Installer for Windows 10+", href: RELEASES, featured: false },
  { name: "macOS", mark: "⌘", detail: "Universal app", href: RELEASES, featured: false },
  { name: "Linux", mark: "⌁", detail: "AppImage and archives", href: RELEASES, featured: false },
  { name: "Web app", mark: "▶", detail: "No install, runs in the browser", href: "/home", featured: false },
];

const features = [
  {
    number: "01",
    title: "Find your next favorite",
    text: "Explore anime, movies, and TV in one place with metadata from AniList and TMDB.",
    kind: "discover",
  },
  {
    number: "02",
    title: "Your library, your way",
    text: "Keep a personal watchlist and continue where you left off, with data stored locally.",
    kind: "library",
  },
  {
    number: "03",
    title: "Made for your screens",
    text: "Use AniFox on Android, iOS, desktop, or jump straight into the web app.",
    kind: "devices",
  },
];

export default function DownloadLandingPage() {
  return (
    <main className="landing-page">
      <div className="landing-atmosphere" aria-hidden="true">
        <div className="landing-grid" />
        <div className="landing-orb landing-orb-one" />
        <div className="landing-orb landing-orb-two" />
      </div>

      <div className="landing-content">
        <header className="landing-header">
          <Link href="/" className="landing-brand" aria-label="AniFox download page">
            <Image src="/logo.png" width={44} height={44} alt="" priority />
            <span>AniFox</span>
          </Link>
          <nav className="landing-nav" aria-label="Landing page">
            <a href="#features">Features</a>
            <a href="#platforms">Platforms</a>
            <Link href="/credits">Credits</Link>
            <a href={GITHUB} target="_blank" rel="noreferrer" className="landing-source-link">
              <GithubIcon /> Source
            </a>
          </nav>
          <Link href="/home" className="landing-nav-cta">
            Open web app <ChevronRightIcon />
          </Link>
        </header>

        <section className="landing-hero">
          <div className="landing-copy">
            <div className="landing-kicker">
              <span className="landing-kicker-dot" />
              FREE · OPEN SOURCE · GPL-3.0
            </div>
            <h1>
              Your next story.
              <br />
              <span>Just a play away.</span>
            </h1>
            <p className="landing-lede">
              Anime, movies, and series come together in one beautifully simple place. Discover
              something new, make it yours, and pick up wherever you left off.
            </p>
            <div className="landing-actions">
              <a href={RELEASES} target="_blank" rel="noreferrer" className="landing-button landing-button-primary">
                <DownloadIcon />
                Get AniFox
                <ChevronRightIcon />
              </a>
              <Link href="/home" className="landing-button landing-button-secondary">
                <PlayIcon />
                Explore the web app
              </Link>
            </div>
            <div className="landing-proof">
              <span>No account needed</span>
              <span aria-hidden="true">·</span>
              <span>Local-first</span>
              <span aria-hidden="true">·</span>
              <span>Built by the community</span>
            </div>
            <DownloadCount />
          </div>

          <div className="landing-showcase" aria-label="A preview of AniFox">
            <div className="landing-showcase-halo" />
            <div className="landing-preview-window">
              <div className="landing-preview-topbar">
                <div className="landing-preview-brand">
                  <Image src="/logo.png" width={24} height={24} alt="" />
                  <span>ANIFOX</span>
                </div>
                <span className="landing-preview-section">DISCOVER</span>
                <span className="landing-preview-avatar">A</span>
              </div>
              <div className="landing-preview-hero">
                <div className="landing-preview-art" aria-hidden="true">
                  <span className="landing-art-sun" />
                  <span className="landing-art-ridge landing-art-ridge-back" />
                  <span className="landing-art-ridge landing-art-ridge-front" />
                </div>
                <div className="landing-preview-shade" />
                <div className="landing-preview-caption">
                  <span>TONIGHT&apos;S PICK</span>
                  <strong>Find your next favorite.</strong>
                  <small>One home for every kind of story.</small>
                </div>
              </div>
              <div className="landing-preview-library">
                <div className="landing-preview-library-head">
                  <span>Explore</span>
                  <span>Curated for you</span>
                </div>
                <div className="landing-preview-cards">
                  <div className="landing-preview-card landing-preview-card-anime">
                    <span>01 / ANIME</span>
                    <i />
                  </div>
                  <div className="landing-preview-card landing-preview-card-movie">
                    <span>02 / MOVIES</span>
                    <i />
                  </div>
                  <div className="landing-preview-card landing-preview-card-series">
                    <span>03 / SERIES</span>
                    <i />
                  </div>
                  <div className="landing-preview-card landing-preview-card-more">
                    <span>+</span>
                    <small>More to discover</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="landing-float-note">
              <span className="landing-float-icon"><PlayIcon /></span>
              <span><b>Pick up where you left off</b><small>Your library stays yours</small></span>
              <span className="landing-float-check">✓</span>
            </div>
            <div className="landing-orbit-badge" aria-hidden="true">A FOX<br />FOR EVERY STORY</div>
          </div>
        </section>

        <section id="features" className="landing-section landing-features">
          <div className="landing-section-heading">
            <span>THE ANIFOX DIFFERENCE</span>
            <h2>Everything you love.<br /><em>Nothing in your way.</em></h2>
          </div>
          <div className="landing-feature-grid">
            {features.map((feature) => (
              <article key={feature.number} className="landing-feature-card">
                <div className={`landing-feature-icon landing-feature-icon-${feature.kind}`} aria-hidden="true">
                  {feature.kind === "discover" ? <DiscoverIcon /> : null}
                  {feature.kind === "library" ? <LibraryIcon /> : null}
                  {feature.kind === "devices" ? <DevicesIcon /> : null}
                </div>
                <span className="landing-feature-number">{feature.number}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="platforms" className="landing-platforms">
          <div className="landing-platform-copy">
            <span className="landing-section-label">READY WHEN YOU ARE</span>
            <h2>One app.<br /><em>Your kind of screen.</em></h2>
            <p>Choose a platform build from the latest release, or start watching in your browser.</p>
            <div className="landing-platform-list" aria-label="Supported platforms">
              {[
                ["Android", "A"],
                ["iOS", "iOS"],
                ["Windows", "▦"],
                ["macOS", "⌘"],
                ["Linux", "⌁"],
              ].map(([name, mark]) => (
                <span className="landing-platform-chip" key={name}>
                  <b aria-hidden="true">{mark}</b>{name}
                </span>
              ))}
            </div>
            <p className="landing-platform-note">Available install files depend on the current release.</p>
          </div>
          <div className="landing-platform-actions">
            <a href={RELEASES} target="_blank" rel="noreferrer" className="landing-release-card">
              <span className="landing-release-icon"><DownloadIcon /></span>
              <span><b>Browse releases</b><small>Choose a build for your device</small></span>
              <ChevronRightIcon />
            </a>
            <Link href="/home" className="landing-web-card">
              <span className="landing-web-icon"><PlayIcon /></span>
              <span><b>Use the web app</b><small>No install. Start exploring.</small></span>
              <ChevronRightIcon />
            </Link>
            <a href={GITHUB} target="_blank" rel="noreferrer" className="landing-repo-link">
              <GithubIcon /> View source on GitHub
            </a>
          </div>
        </section>

        <section className="landing-downloads" aria-label="Download AniFox by platform">
          <div className="landing-section-heading">
            <span>DOWNLOAD ANIFOX</span>
            <h2>Pick your platform.<br /><em>Start in seconds.</em></h2>
          </div>
          <div className="landing-download-grid">
            {platforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.href}
                target={platform.href.startsWith("#") ? undefined : "_blank"}
                rel={platform.href.startsWith("#") ? undefined : "noreferrer"}
                className={`landing-download-card ${platform.featured ? "is-featured" : ""}`}
              >
                <span className="landing-download-mark" aria-hidden="true">{platform.mark}</span>
                <span className="landing-download-copy">
                  <b>{platform.name}</b>
                  <small>{platform.detail}</small>
                </span>
                <span className="landing-download-action">
                  {platform.featured ? "Recommended" : "Download"}
                  <ChevronRightIcon />
                </span>
              </a>
            ))}
          </div>
          <p className="landing-downloads-note">
            Every build is published on GitHub Releases. File availability depends on the latest release.
          </p>
        </section>

        <footer className="landing-footer">
          <Link href="/" className="landing-brand landing-brand-small">
            <Image src="/logo.png" width={30} height={30} alt="" />
            <span>AniFox</span>
          </Link>
          <p>A free, open-source project by <a href="https://github.com/ItzFallenMe" target="_blank" rel="noreferrer">ItzFallenMe</a> · <Link href="/credits">Credits</Link>.</p>
          <p className="landing-footer-license">GPL-3.0 · AniFox does not host media.</p>
        </footer>
      </div>
    </main>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
      <path d="M5 17v3h14v-3" />
    </svg>
  );
}

function DiscoverIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="m16 16 4 4M11 7v8M7 11h8" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5z" /><path d="M5 4.5v17M9 6h7M9 10h7" />
    </svg>
  );
}

function DevicesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="13" height="11" rx="2" /><path d="M7 20h5m-2.5-5v5m7-11h4v12h-4z" />
    </svg>
  );
}
