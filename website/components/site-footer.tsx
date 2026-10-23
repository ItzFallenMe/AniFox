import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

import { CREATOR_URL, GITHUB_URL, RELEASES_URL, TMDB_URL } from '@/lib/links';

export function SiteFooter() {
  return (
    <footer className="relative z-20 border-t border-white/[0.05] bg-black pb-10 pt-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 grid grid-cols-2 gap-12 md:grid-cols-4">
          <div className="col-span-2 space-y-5">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 overflow-hidden rounded-xl border border-white/15 bg-black">
                <Image
                  src="/anifox-logo.png"
                  alt="AniFox"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-white">
                AniFox
              </span>
            </div>
            <p className="max-w-xs text-sm font-medium leading-relaxed text-faint">
              One black-glass Android client for anime, films and series. A
              personal project by ItzFallenMe.
            </p>
            <p className="max-w-xs text-[11px] leading-relaxed text-faint/70">
              AniFox hosts no media. Metadata and artwork belong to TMDB and the
              respective studios; streams come from third-party providers.
            </p>
          </div>

          <div className="space-y-5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-faint/70">
              Product
            </h4>
            <ul className="space-y-3 text-sm font-medium text-muted">
              <li>
                <a href="/#features" className="transition-colors hover:text-white">
                  Features
                </a>
              </li>
              <li>
                <a href="/#servers" className="transition-colors hover:text-white">
                  Streaming servers
                </a>
              </li>
              <li>
                <a
                  href={RELEASES_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-white">
                  Download
                </a>
              </li>
              <li>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-white">
                  GitHub
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-faint/70">
              Legal
            </h4>
            <ul className="space-y-3 text-sm font-medium text-muted">
              <li>
                <Link href="/privacy" className="transition-colors hover:text-white">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-white">
                  Terms
                </Link>
              </li>
              <li>
                <a
                  href={TMDB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-white">
                  TMDB
                </a>
              </li>
              <li>
                <a
                  href={CREATOR_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-white">
                  ItzFallenMe
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-faint/70">
            © 2026 ItzFallenMe · AniFox
          </p>
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.24em] text-white">
            <span className="dot-live h-2 w-2 rounded-full bg-brand" />
            Seven servers online
          </div>
        </div>
      </div>
    </footer>
  );
}
