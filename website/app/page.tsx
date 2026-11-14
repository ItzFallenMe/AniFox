import {
  Bell,
  Bookmark,
  BookOpenText,
  CheckCircle2,
  Download,
  History,
  Layers,
  Monitor,
  Play,
  Search,
  Settings2,
  ShieldCheck,
  Star,
} from 'lucide-react';
import Link from 'next/link';

import { SiteNav } from '@/components/site-nav';
import { SiteFooter } from '@/components/site-footer';
import { FaqSection } from '@/components/faq';
import { HeroPhone, LibraryPhone, PlayerPhone } from '@/components/phones';
import { Counter, Reveal, Spotlight } from '@/components/motion';
import { DOWNLOAD_PAGE, TMDB_URL } from '@/lib/links';

const FEATURES = [
  {
    icon: Bookmark,
    title: 'A library kept on your device',
    body: 'Save titles and keep AniFox preferences locally. Connect AniList, MyAnimeList, Kitsu or Simkl if you want supported tracker progress synced.',
    tone: 'brand',
  },
  {
    icon: History,
    title: 'Return to your place',
    body: 'The app keeps anime episode and manga page progress locally. Embedded video hosts do not share playback timestamps, so a saved stream returns to its episode.',
    tone: 'neutral',
  },
  {
    icon: Bell,
    title: 'On-device episode alerts',
    body: 'Schedule local notifications for upcoming anime episodes. AniFox uses your device notifications rather than an AniFox push server.',
    tone: 'neutral',
  },
  {
    icon: Search,
    title: 'Search across catalogs',
    body: 'Find films and series through TMDB, anime through AniList, and Safe-rated manga through MangaDex. Recent searches stay on your device.',
    tone: 'neutral',
  },
  {
    icon: BookOpenText,
    title: 'A Safe-rated MangaDex reader',
    body: 'Browse titles MangaDex rates Safe and read only MangaDex-hosted chapters inside AniFox. Chapter languages are labeled with flags and names.',
    tone: 'brand',
  },
  {
    icon: Download,
    title: 'Offline downloads in the app',
    body: 'When a download provider is configured for the deployment, choose an available quality and manage saved media in the app’s Downloads screen.',
    tone: 'neutral',
  },
  {
    icon: Settings2,
    title: 'Customize the experience',
    body: 'Adjust themes, layout, player preferences, and manga reading direction, page scale, background, and controls.',
    tone: 'neutral',
  },
];

const STEPS = [
  {
    icon: Search,
    title: 'Find it',
    body: 'Explore movie and TV metadata from TMDB, anime from AniList, and Safe-rated manga from MangaDex.',
  },
  {
    icon: Bookmark,
    title: 'Keep it',
    body: 'Save titles locally, or connect a supported tracker to sync anime and manga progress outside the device.',
  },
  {
    icon: Play,
    title: 'Watch or read',
    body: 'Use a supported streaming host, read hosted manga chapters inside AniFox, or save provider downloads in the app when configured.',
  },
];

const STATS = [
  { value: 4, suffix: '', label: 'Built-in stream hosts' },
  { value: 1, suffix: '', label: 'Safe-rated manga catalog' },
  { value: 0, suffix: '', label: 'Accounts required' },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background text-ink">
      {/* Ambient backdrop */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="silk-layer absolute inset-0" />
        <div className="aurora-a absolute -top-48 left-1/2 h-[560px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,122,26,0.18),transparent_65%)] blur-2xl" />
        <div className="aurora-b absolute -right-40 top-[26%] h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06),transparent_65%)] blur-2xl" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black to-transparent" />
      </div>

      <SiteNav />

      {/* ── Hero ─────────────────────────────────────────── */}
      <header className="relative z-10 px-6 pb-20 pt-36 sm:pt-44">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-16 lg:grid-cols-[1.04fr_0.96fr]">
            <div className="text-center lg:text-left">
              <Reveal>
                <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-brand/25 bg-brand-soft px-4 py-2 text-[9px] font-black uppercase tracking-[0.28em] text-brand backdrop-blur-md">
                  <span className="dot-live h-1.5 w-1.5 rounded-full bg-brand" />
                  Flutter · Web · Free · No accounts
                </div>
              </Reveal>

              <Reveal delay={100}>
                <h1 className="font-display text-[3.4rem] font-black uppercase leading-[0.85] tracking-[-0.05em] text-white sm:text-7xl xl:text-[6.4rem]">
                  Every story.
                  <br />
                  <span className="text-brand-shimmer italic">One screen.</span>
                </h1>
              </Reveal>

              <Reveal delay={200}>
                <p className="mx-auto mt-7 max-w-xl text-base font-medium leading-relaxed text-muted sm:text-lg lg:mx-0">
                  AniFox brings anime, films, series, and Safe-rated MangaDex
                  reading together. The Flutter app adds a local library,
                  customizable reader, and provider-backed downloads; the web
                  app lets you browse, stream, and read in your browser.
                </p>
              </Reveal>

              <Reveal delay={300}>
                <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                  <Link
                    href={DOWNLOAD_PAGE}
                    className="btn-shine inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-brand px-9 text-sm font-black uppercase tracking-[0.08em] text-black shadow-[0_18px_50px_rgba(255,122,26,0.28)] transition-transform hover:scale-[1.02] active:scale-95 sm:w-auto"
                  >
                    <Download className="h-5 w-5" />
                    All downloads
                  </Link>
                  <Link
                    href="/home"
                    className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/12 bg-white/[0.04] px-8 text-sm font-bold text-white backdrop-blur-xl transition-colors hover:border-white/25 hover:bg-white/[0.08] sm:w-auto"
                  >
                    <Monitor className="h-4 w-4" />
                    Open Web App
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={380}>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-[0.18em] text-faint lg:justify-start">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
                    No account
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
                    Metadata by TMDB
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
                    Open source
                  </span>
                </div>
              </Reveal>
            </div>

            <Reveal delay={260} className="relative flex justify-center">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-[380px] w-[380px] rounded-full border border-white/[0.05]" />
                <div className="absolute h-[300px] w-[300px] rounded-full border border-brand/10" />
                {[0, 1, 2].map(index => (
                  <span
                    key={index}
                    className="ping-ring absolute h-52 w-52 rounded-full border border-brand/25"
                    style={{ animationDelay: `${index * 1.1}s` }}
                  />
                ))}
              </div>

              <div className="float-y-slow relative">
                <HeroPhone />
              </div>

              <div className="float-y absolute -left-2 top-16 hidden rounded-2xl border border-white/10 bg-black/60 px-3.5 py-2.5 backdrop-blur-xl sm:block">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-brand">
                  Library
                </p>
                <p className="mt-0.5 text-[11px] font-bold text-white">
                  12 titles saved
                </p>
              </div>

              <div className="float-y absolute -right-1 top-6 hidden rounded-2xl border border-white/10 bg-black/60 px-3.5 py-2.5 backdrop-blur-xl sm:block">
                <p className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-brand">
                  <ShieldCheck className="h-3 w-3" />
                  Playback
                </p>
                <p className="mt-0.5 text-[11px] font-bold text-white">
                  Player ready
                </p>
              </div>

              <div className="float-y absolute -bottom-2 right-2 hidden rounded-2xl border border-white/10 bg-black/60 px-3.5 py-2.5 backdrop-blur-xl sm:block">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-faint">
                  Resume
                </p>
                <p className="mt-0.5 text-[11px] font-bold text-white">
                  Frieren · S1 E3
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </header>

      {/* ── Features ─────────────────────────────────────── */}
      <section id="features" className="relative z-10 px-6 py-28 sm:py-36">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="mb-14 max-w-2xl">
              <p className="mb-5 text-[10px] font-black uppercase tracking-[0.35em] text-brand">
                — The app
              </p>
              <h2 className="font-display text-4xl font-black uppercase leading-[0.9] tracking-tighter text-white sm:text-6xl">
                Everything you need.
                <br />
                <span className="text-muted">Nothing you don&apos;t.</span>
              </h2>
              <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-muted">
                No AniFox account is required. Use the website for browser-based
                browsing, playback and manga reading, or install the Flutter app
                for local history, reader settings and download management.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, index) => (
              <Reveal
                key={feature.title}
                delay={(index % 4) * 70}
                className={index === 0 ? 'lg:col-span-2' : ''}
              >
                <Spotlight className="group h-full rounded-[1.6rem] border border-white/[0.06] bg-white/[0.02] p-6 transition-colors hover:border-white/15">
                  <div
                    className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl border ${
                      feature.tone === 'brand'
                        ? 'border-brand/30 bg-brand-soft text-brand'
                        : 'border-white/10 bg-white/[0.05] text-white'
                    }`}
                  >
                    <feature.icon className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <h3 className="font-display text-lg font-bold tracking-tight text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-[13px] font-medium leading-relaxed text-muted">
                    {feature.body}
                  </p>
                </Spotlight>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Experience: player ───────────────────────────── */}
      <section id="experience" className="relative z-10 px-6 py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal className="order-2 flex justify-center lg:order-1">
            <div className="relative">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_40%,rgba(255,122,26,0.16),transparent_65%)] blur-2xl" />
              <PlayerPhone />
            </div>
          </Reveal>

          <div className="order-1 lg:order-2">
            <Reveal>
              <p className="mb-5 text-[10px] font-black uppercase tracking-[0.35em] text-brand">
                — The player
              </p>
              <h2 className="font-display text-4xl font-black uppercase leading-[0.9] tracking-tighter text-white sm:text-6xl">
                Choose a host.
                <br />
                <span className="text-muted">Stay in AniFox.</span>
              </h2>
              <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-muted">
                AniFox sends validated title IDs to third-party streaming hosts.
                The app displays their player in a WebView; the website uses an
                iframe. Stream availability and playback controls belong to each
                host.
              </p>
            </Reveal>

            <div className="mt-9 space-y-5">
              {[
                {
                  icon: Layers,
                  title: 'Four built-in hosts',
                  body: 'Choose Vidly, VidBolt, Vidy or EmbedWave where that host supports the title and its available IDs.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Third-party playback',
                  body: 'The provider supplies the player and video. AniFox does not host or proxy video bytes.',
                },
                {
                  icon: Download,
                  title: 'Downloads when configured',
                  body: 'The app can save supported provider links for offline playback. The website presents provider links but does not manage local downloads.',
                },
              ].map((item, index) => (
                <Reveal key={item.title} delay={index * 80}>
                  <div className="flex gap-4">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white">
                      <item.icon className="h-4 w-4" strokeWidth={1.8} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{item.title}</h3>
                      <p className="mt-1 max-w-md text-[13px] leading-relaxed text-muted">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Experience: library ──────────────────────────── */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Reveal>
              <p className="mb-5 text-[10px] font-black uppercase tracking-[0.35em] text-brand">
                — Your library
              </p>
              <h2 className="font-display text-4xl font-black uppercase leading-[0.9] tracking-tighter text-white sm:text-6xl">
                Your library
                <br />
                <span className="text-muted">stays yours.</span>
              </h2>
              <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-muted">
                The Flutter app stores its library, reading and episode history,
                and preferences on your device. This data does not automatically
                sync to the website; optional tracker connections can sync the
                progress they support.
              </p>
            </Reveal>

            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <Reveal key={step.title} delay={index * 90}>
                  <div className="h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand">
                        0{index + 1}
                      </span>
                      <step.icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-white">{step.title}</h3>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
                      {step.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={120} className="flex justify-center">
            <div className="float-y-slow relative">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.06),transparent_65%)] blur-2xl" />
              <LibraryPhone />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="grid gap-px overflow-hidden rounded-[2rem] border border-white/[0.06] bg-white/[0.04] sm:grid-cols-2 lg:grid-cols-3">
              {STATS.map(stat => (
                <div
                  key={stat.label}
                  className="bg-background/90 px-7 py-9 text-center backdrop-blur-xl"
                >
                  <p className="font-display text-4xl font-black tracking-tighter text-white sm:text-5xl">
                    <Counter to={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-2 text-[9px] font-black uppercase tracking-[0.26em] text-faint">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <FaqSection />

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="conic-border relative overflow-hidden rounded-[2.6rem] bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-transparent p-10 text-center shadow-[0_40px_100px_rgba(0,0,0,0.6)] sm:p-16 md:p-20">
              <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,122,26,0.22),transparent_70%)] blur-2xl" />
              <div className="relative z-10">
                <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand-soft px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.28em] text-brand">
                  <Star className="h-3 w-3" fill="currentColor" strokeWidth={0} />
                    Anime · Films · Series · Manga
                </span>
                <h2 className="font-display text-5xl font-black uppercase leading-[0.85] tracking-tighter text-white sm:text-7xl md:text-[6rem]">
                  Your next
                  <br />
                  <span className="text-brand-shimmer not-italic">episode.</span>
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-base font-medium leading-relaxed text-muted">
                  Install AniFox, save a title, and let the library do the rest.
                  Free, open source, and built for one screen at a time.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <a
                    href={DOWNLOAD_PAGE}
                    className="btn-shine inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white px-10 text-sm font-black uppercase tracking-[0.08em] text-black shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-transform hover:scale-[1.03] active:scale-95 sm:w-auto"
                  >
                    <Download className="h-5 w-5" />
                    Get AniFox
                  </a>
                  <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.22em] text-muted">
                    <span className="h-2 w-2 rounded-full bg-brand" />
                    Metadata by TMDB
                  </div>
                </div>

                <p className="mt-8 text-[10px] uppercase tracking-[0.2em] text-faint">
                  Android 7+ · No account ·{' '}
                  <a
                    href={TMDB_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted underline-offset-4 hover:text-white hover:underline"
                  >
                    TMDB
                  </a>
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
