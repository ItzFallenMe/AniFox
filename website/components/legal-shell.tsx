import type { ReactNode } from 'react';

import { SiteNav } from './site-nav';
import { SiteFooter } from './site-footer';
import { Reveal } from './motion';

export function LegalShell({
  kicker,
  title,
  updated,
  children,
}: {
  kicker: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-screen bg-background text-ink">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="silk-layer absolute inset-0" />
        <div className="absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,122,26,0.12),transparent_65%)] blur-2xl" />
      </div>

      <SiteNav />

      <article className="relative z-10 mx-auto max-w-3xl px-6 pb-28 pt-40">
        <Reveal>
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.35em] text-brand">
            — {kicker}
          </p>
          <h1 className="font-display text-4xl font-black uppercase leading-[0.9] tracking-tighter text-white sm:text-6xl">
            {title}
          </h1>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-faint">
            Last updated · {updated}
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-12 space-y-8 rounded-[1.8rem] border border-white/[0.06] bg-white/[0.02] p-7 sm:p-10">
            {children}
          </div>
        </Reveal>
      </article>

      <SiteFooter />
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold tracking-tight text-white">{title}</h2>
      <div className="mt-2.5 space-y-3 text-[13px] leading-relaxed text-muted sm:text-sm">
        {children}
      </div>
    </section>
  );
}
