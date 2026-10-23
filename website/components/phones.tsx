import Image from 'next/image';
import type { ReactNode } from 'react';
import {
  Bell,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Film,
  Play,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SkipForward,
  Sparkles,
  Tv,
  User,
} from 'lucide-react';

import { POSTERS } from '@/lib/links';

export function PhoneFrame({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`phone-shell relative w-[286px] rounded-[2.7rem] p-[9px] ${className}`}>
      <div className="relative overflow-hidden rounded-[2.3rem] border border-white/[0.06] bg-background">
        <div className="relative flex h-9 items-center justify-between px-5 pt-2 text-[8px] font-bold text-muted">
          <span>9:41</span>
          <span className="absolute left-1/2 top-2 h-[18px] w-[62px] -translate-x-1/2 rounded-full bg-black" />
          <span className="tracking-[0.2em]">●●●</span>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Home screen: spotlight billboard, trending rail and the floating tab bar. */
export function HeroPhone() {
  const hero = POSTERS[0];
  const rail = POSTERS.slice(1, 5);

  return (
    <PhoneFrame>
      <div className="relative h-[212px]">
        <Image
          src={hero.src}
          alt=""
          fill
          sizes="286px"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-background" />

        <div className="absolute inset-x-0 top-2 flex items-center justify-between px-4">
          <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.22em] text-white/80">
            <span className="h-3.5 w-3.5 overflow-hidden rounded-[4px] border border-white/20 bg-black">
              <Image src="/anifox-logo.png" alt="" width={14} height={14} />
            </span>
            AniFox
          </span>
          <Search className="h-3.5 w-3.5 text-white/70" />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <span className="rounded-full border border-brand/35 bg-brand-soft px-2 py-0.5 text-[6.5px] font-black uppercase tracking-[0.2em] text-brand">
            Today&apos;s spotlight
          </span>
          <h3 className="mt-2 font-display text-[22px] font-black leading-none tracking-tight text-white">
            Frieren
          </h3>
          <div className="mt-1.5 flex items-center gap-1.5 text-[7px] font-bold text-white/70">
            <span className="rounded bg-white/10 px-1 py-0.5 text-white">★ 8.9</span>
            <span>2023</span>
            <span className="h-0.5 w-0.5 rounded-full bg-white/40" />
            <span>Series</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="flex h-7 flex-1 items-center justify-center gap-1 rounded-full bg-white text-[8px] font-black uppercase tracking-[0.12em] text-black">
              <Play className="h-3 w-3" fill="currentColor" strokeWidth={0} />
              Watch now
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/10">
              <Plus className="h-3 w-3 text-white" />
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-16">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[8px] font-black uppercase tracking-[0.18em] text-white/85">
            Trending today
          </span>
          <span className="text-[6.5px] font-bold uppercase tracking-[0.14em] text-faint">
            Page 1 of 20
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {rail.map(poster => (
            <div key={poster.title}>
              <div className="relative aspect-[2/3] overflow-hidden rounded-[7px] border border-white/[0.08] bg-raised">
                <Image
                  src={poster.src}
                  alt={poster.title}
                  fill
                  sizes="60px"
                  className="object-cover"
                />
              </div>
              <p className="mt-1 truncate text-[6px] font-semibold text-white/80">
                {poster.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-x-4 bottom-3">
        <div className="flex items-center justify-between rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 backdrop-blur-xl">
          {[Sparkles, Search, Tv, Bookmark, User].map((Icon, index) => (
            <span
              key={index}
              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                index === 0 ? 'bg-white text-black' : 'text-white/50'
              }`}>
              <Icon className="h-3 w-3" />
            </span>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

/** Player screen: ad-free badge, embed stage and instant server switching. */
export function PlayerPhone() {
  return (
    <PhoneFrame>
      <div className="flex items-center gap-2 px-3 pb-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
          <ChevronLeft className="h-3.5 w-3.5 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-bold text-white">Frieren</p>
          <p className="truncate text-[7px] text-faint">Season 1 · Episode 3</p>
        </div>
        <span className="flex items-center gap-1 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-1.5 py-0.5 text-[6px] font-black tracking-[0.12em] text-emerald-300">
          <ShieldCheck className="h-2.5 w-2.5" />
          AD-FREE
        </span>
      </div>

      <div className="relative flex aspect-video items-center justify-center border-y border-white/[0.06] bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,122,26,0.16),transparent_65%)]" />
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand shadow-brand">
          <Play className="h-4 w-4 text-black" fill="currentColor" strokeWidth={0} />
        </span>
        <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[6px] font-bold uppercase tracking-[0.14em] text-white/70">
          Server 1 · 1080p
        </span>
      </div>

      <div className="space-y-3 p-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[6.5px] font-black uppercase tracking-[0.2em] text-faint">
              Server
            </span>
            <span className="flex items-center gap-1 text-[6.5px] font-bold text-emerald-300">
              <ShieldCheck className="h-2.5 w-2.5" />
              Ad-free on
            </span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
              <RefreshCw className="h-2.5 w-2.5 text-white/70" />
            </span>
          </div>
          <div className="flex gap-1">
            {['Server 1', 'Server 3', 'Server 4', 'Server 5'].map((label, index) => (
              <span
                key={label}
                className={`rounded-md px-1.5 py-1 text-[6px] font-bold ${
                  index === 0
                    ? 'bg-white text-black'
                    : 'border border-white/10 bg-white/[0.05] text-white/60'
                }`}>
                {label}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[6px] leading-relaxed text-faint">
            Streams come from third-party embed providers. AniFox hosts nothing.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="flex h-8 flex-1 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[7px] font-bold text-white">
            Episodes
          </span>
          <span className="flex h-8 flex-1 items-center justify-center gap-1 rounded-full bg-brand text-[7px] font-black text-black">
            <SkipForward className="h-2.5 w-2.5" />
            Next server
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[6.5px] text-faint">
          <Film className="h-2.5 w-2.5" />
          Episode 3 · The Journey Begins
        </div>
      </div>
    </PhoneFrame>
  );
}

/** Library screen: watchlist, resume history and episode alerts. */
export function LibraryPhone() {
  return (
    <PhoneFrame>
      <div className="px-3 pb-4">
        <p className="text-[6.5px] font-black uppercase tracking-[0.24em] text-faint">
          The project
        </p>
        <h3 className="font-display text-xl font-black tracking-tight text-white">You</h3>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5">
          <span className="h-8 w-8 overflow-hidden rounded-lg border border-white/10 bg-black">
            <Image src="/anifox-logo.png" alt="" width={32} height={32} />
          </span>
          <div className="flex-1">
            <p className="text-[9px] font-bold text-white">AniFox</p>
            <p className="text-[6.5px] text-faint">Anime &amp; movies, unified</p>
          </div>
          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[6px] font-bold uppercase tracking-[0.14em] text-muted">
            v2.1.1
          </span>
        </div>

        <p className="mb-2 mt-4 text-[7px] font-black uppercase tracking-[0.2em] text-white/85">
          Continue watching
        </p>
        <div className="grid grid-cols-2 gap-2">
          {POSTERS.slice(2, 4).map((poster, index) => (
            <div key={poster.title}>
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-white/[0.08] bg-raised">
                <Image
                  src={poster.src}
                  alt={poster.title}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
                <span className="absolute left-1 top-1 rounded bg-black/70 px-1 py-0.5 text-[5.5px] font-bold text-white/80">
                  {index === 0 ? 'S2 · E4' : 'Film'}
                </span>
              </div>
              <p className="mt-1 truncate text-[6.5px] font-semibold text-white/80">
                {poster.title}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-2">
            <Bookmark className="h-3 w-3 text-white" />
            <div className="flex-1">
              <p className="text-[7.5px] font-bold text-white">Watchlist</p>
              <p className="text-[6px] text-faint">12 titles saved</p>
            </div>
            <ChevronRight className="h-3 w-3 text-faint" />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-2">
            <Bell className="h-3 w-3 text-white" />
            <div className="flex-1">
              <p className="text-[7.5px] font-bold text-white">Episode alerts</p>
              <p className="text-[6px] text-faint">3 scheduled</p>
            </div>
            <ChevronRight className="h-3 w-3 text-faint" />
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
