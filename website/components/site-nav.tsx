import Link from 'next/link';
import Image from 'next/image';
import { Download } from 'lucide-react';

import { DOWNLOAD_PAGE, NAV_LINKS } from '@/lib/links';

export function SiteNav() {
  return (
    <nav className="fixed inset-x-0 top-4 z-50 px-4">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between rounded-full border border-white/10 bg-white/[0.05] px-4 shadow-glass backdrop-blur-2xl backdrop-saturate-150 sm:px-5">
        <Link href="/" className="group flex items-center gap-3 pl-1" aria-label="AniFox home">
          <span className="h-9 w-9 overflow-hidden rounded-xl border border-white/15 bg-black shadow-[0_0_24px_rgba(255,122,26,0.25)]">
            <Image
              src="/anifox-logo.png"
              alt=""
              width={36}
              height={36}
              className="h-full w-full object-cover"
              priority
            />
          </span>
          <span className="flex flex-col">
            <span className="font-display text-base font-bold leading-none tracking-tight text-white">
              AniFox
            </span>
            <span className="mt-0.5 text-[8px] font-black uppercase tracking-[0.28em] text-brand">
              Anime · Movies
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted lg:flex">
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href={DOWNLOAD_PAGE}
          className="btn-shine inline-flex h-10 items-center gap-2 rounded-full border border-brand/40 bg-gradient-to-r from-brand to-brand-deep px-5 text-[10px] font-black uppercase tracking-[0.18em] text-black shadow-[0_10px_28px_rgba(255,122,26,0.3)] transition-transform hover:scale-[1.03] active:scale-95"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
      </div>
    </nav>
  );
}
