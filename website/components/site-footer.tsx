import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

import { CREATOR_URL, DOWNLOAD_PAGE, GITHUB_URL, TMDB_URL } from '@/lib/links';

export function SiteFooter() {
  return (
    <footer className="relative z-20 border-t border-white/[0.05] bg-black pb-10 pt-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 grid grid-cols-2 gap-12 md:grid-cols-4">
          <div className="col-span-2 space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center drop-shadow-[0_0_18px_rgba(255,122,26,0.22)]">
                <Image
                  src="/anifox-logo-mark.png"
                  alt="AniFox"
                  width={40}
                  height={40}
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-white">
                AniFox
              </span>
            </div>
            <p className="max-w-xs text-sm font-medium leading-relaxed text-faint">
              A black-glass home for anime, films, series, and manga. A free,
              open-source project by ItzFallenMe.
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
                <Link href="/#features" className="transition-colors hover:text-white">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#servers" className="transition-colors hover:text-white">
                  Streaming servers
                </Link>
              </li>
              <li>
                <Link
                  href={DOWNLOAD_PAGE}
                  className="transition-colors hover:text-white">
                  Download APKs
                </Link>
              </li>
              <li>
                <Link href="/home" className="transition-colors hover:text-white">
                  Open the web app
                </Link>
              </li>
              <li>
                <Link href="/credits" className="transition-colors hover:text-white">
                  Credits
                </Link>
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
            © {new Date().getFullYear()} ItzFallenMe · AniFox
          </p>
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.24em] text-white">
            <span className="dot-live h-2 w-2 rounded-full bg-brand" />
            Free · open source
          </div>
        </div>
      </div>
    </footer>
  );
}
