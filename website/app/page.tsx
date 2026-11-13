import {
  Bell,
  Bookmark,
  BookOpenText,
  CheckCircle2,
  Download,
  History,
  Layers,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

import { GithubIcon } from '@/components/icons';
import { SiteNav } from '@/components/site-nav';
import { SiteFooter } from '@/components/site-footer';
import { FaqSection } from '@/components/faq';
import { HeroPhone, LibraryPhone, PlayerPhone } from '@/components/phones';
import { Counter, Reveal, Spotlight } from '@/components/motion';
import { DOWNLOAD_PAGE, GITHUB_URL, TMDB_URL } from '@/lib/links';

const FEATURES = [
  {
    icon: Bookmark,
    title: 'A watchlist that stays',
    body: 'Bookmark any film, series or anime. Titles are stored on-device, so the list opens instantly and works without a connection.',
    tone: 'brand',
  },
  {
    icon: History,
    title: 'Continue watching',
    body: 'The player records the exact season and episode. Home picks it up, Detail offers Continue — one tap and you are back.',
    tone: 'neutral',
  },
  {
    icon: Bell,
    title: 'Episode alerts',
    body: 'Tap the bell on a series and AniFox schedules a local notification for the next air date, even if the app is closed.',
    tone: 'neutral',
  },
  {
    icon: Search,
    title: 'Search that remembers',
    body: 'Recent searches are saved locally and offered the moment you open the tab. Deep search covers the whole TMDB catalogue.',
    tone: 'neutral',
  },
  {
    icon: BookOpenText,
    title: 'A reader for your next chapter',
    body: 'Browse Safe-rated MangaDex titles and read hosted chapters in AniFox, with every chapter labeled by language.',
    tone: 'brand',
  },
  {
    icon: Sparkles,
    title: 'Black-glass design',
    body: 'A warm glass palette, editorial artwork, fine borders, and a focused orange accent across the website and app.',
    tone: 'neutral',
  },
];

const STEPS = [
  {
    icon: Search,
    title: 'Find it',
    body: 'Browse trending films, series and anime, or search TMDB and AniList when you know what you want.',
  },
  {
    icon: Bookmark,
    title: 'Keep it',
    body: 'Save a title to the watchlist and, for series, set an alert for the next episode. Everything stays on your device.',
  },
  {
    icon: Play,
    title: 'Watch it',
    body: 'Open playback from a third-party provider, switch sources if one stalls, and return to the exact episode from Continue watching.',
  },
];

const STATS = [
  { value: 1000000, suffix: '+', label: 'TMDB titles' },
  { value: 5, suffix: '', label: 'Connected manga sources' },
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
                  AniFox is a black-glass home for anime, films, series, and manga.
                  Pick up where you left off, keep your library close, and use the
                  same web-hosted API from the site and Flutter clients.
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
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/12 bg-white/[0.04] px-8 text-sm font-bold text-white backdrop-blur-xl transition-colors hover:border-white/25 hover:bg-white/[0.08] sm:w-auto"
                  >
                    <GithubIcon className="h-4 w-4" />
                    View source
                  </a>
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
                No account is required. Browse the web catalog, or use the
                Flutter app for a local library and playback history.
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
                Press play.
                <br />
                <span className="text-muted">Skip the noise.</span>
              </h2>
              <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-muted">
                AniFox does not host or proxy video. Playback is provided by
                independent third-party players.
              </p>
            </Reveal>

            <div className="mt-9 space-y-5">
              {[
                {
                  icon: ShieldCheck,
                  title: 'External playback',
                  body: 'Playback comes from an independent player. AniFox does not host or proxy media.',
                },
                {
                  icon: Zap,
                  title: 'Instant recovery',
                  body: 'If a provider is unavailable, choose another source from the player without returning to the catalog.',
                },
                {
                  icon: Layers,
                  title: 'Autoplay as a choice',
                  body: 'Autoplay is a setting, not a surprise. Turn it off and the provider waits for you.',
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
                It remembers
                <br />
                <span className="text-muted">where you were.</span>
              </h2>
              <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-muted">
                A watchlist, resume history, recent searches and episode alerts —
                all stored on your device. No sign-in, no sync server, no
                attention tracking. Open AniFox and your library is already there.
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
