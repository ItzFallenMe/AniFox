import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

import { GithubIcon } from '@/components/icons';
import { SiteNav } from '@/components/site-nav';
import { SiteFooter } from '@/components/site-footer';
import { Reveal } from '@/components/motion';
import { DownloadCount } from '@/components/download-count';
import {
  formatBytes,
  formatDate,
  getReleases,
  type ApkAsset,
  type ReleasePackage,
  type ReleaseInfo,
} from '@/lib/releases';
import { GITHUB_URL } from '@/lib/links';

// Render per request so the release package list never depends on build-time GitHub access.
// The underlying fetch is still cached for ten minutes.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Download — AniFox',
  description:
    'Download AniFox for Android, Windows, macOS, and Linux from GitHub Releases.',
};

const preferred = (release: ReleaseInfo): ApkAsset | undefined =>
  release.apks.find(apk => apk.architecture === 'Universal') ??
  release.apks.find(apk => apk.architecture === 'ARM64') ??
  release.apks[0];

const ApkCard = ({ apk }: { apk: ApkAsset }) => (
  <a
    href={apk.downloadUrl}
    className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-brand/30 hover:bg-white/[0.045]"
  >
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white">
      <Smartphone className="h-5 w-5" strokeWidth={1.8} />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-bold text-white">{apk.architecture}</span>
      <span className="mt-0.5 block truncate text-[11px] text-faint">
        {apk.name} · {formatBytes(apk.size)}
      </span>
    </span>
    <Download className="h-4 w-4 shrink-0 text-brand transition-transform group-hover:translate-y-0.5" />
  </a>
);

const PackageCard = ({ file }: { file: ReleasePackage }) => (
  <a
    href={file.downloadUrl}
    className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-brand/30 hover:bg-white/[0.045]"
  >
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white">
      <Download className="h-5 w-5" strokeWidth={1.8} />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-bold text-white">{file.platform}</span>
      <span className="mt-0.5 block truncate text-[11px] text-faint">
        {file.name} · {formatBytes(file.size)}
      </span>
    </span>
    <Download className="h-4 w-4 shrink-0 text-brand transition-transform group-hover:translate-y-0.5" />
  </a>
);

const ReleaseBlock = ({ release, latest }: { release: ReleaseInfo; latest: boolean }) => (
  <div
    className={
      latest
        ? 'rounded-[2rem] border border-brand/25 bg-gradient-to-br from-brand/[0.08] via-white/[0.02] to-transparent p-6 sm:p-8'
        : 'rounded-[2rem] border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8'
    }
  >
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.26em] text-brand">
          {latest ? 'Latest release' : 'Previous release'}
        </p>
        <h2 className="mt-1 font-display text-2xl font-black tracking-tight text-white">
          AniFox {release.version}
        </h2>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-faint">
        {formatDate(release.publishedAt)}
      </span>
    </div>

    {release.apks.length > 0 ? (
      <>
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-faint">
          Android APKs
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {release.apks.map(apk => (
            <ApkCard key={apk.name} apk={apk} />
          ))}
        </div>
      </>
    ) : null}

    {release.packages.some(file => !file.name.toLowerCase().endsWith('.apk')) ? (
      <div className={release.apks.length > 0 ? 'mt-6' : ''}>
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-faint">
          Desktop and store packages
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {release.packages
            .filter(file => !file.name.toLowerCase().endsWith('.apk'))
            .map(file => (
              <PackageCard key={file.name} file={file} />
            ))}
        </div>
      </div>
    ) : null}

    {release.packages.length === 0 ? (
      <p className="text-sm text-muted">
        This release has no app packages yet — check the GitHub release page.
      </p>
    ) : null}

    <div className="mt-5 flex flex-wrap items-center gap-4 text-[11px] font-bold">
      <a
        href={release.htmlUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-white"
      >
        <GithubIcon className="h-3.5 w-3.5" />
        Release notes
      </a>
      {latest && release.apks.length > 1 ? (
        <span className="text-faint">Not sure? Install the Universal build.</span>
      ) : null}
    </div>
  </div>
);

export default async function DownloadPage() {
  const releases = await getReleases();
  const latest = releases[0];
  const primary = latest ? preferred(latest) : undefined;

  return (
    <main className="relative min-h-screen bg-background text-ink">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="silk-layer absolute inset-0" />
        <div className="aurora-a absolute -top-40 left-1/2 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,122,26,0.16),transparent_65%)] blur-2xl" />
      </div>

      <SiteNav />

      <header className="relative z-10 px-6 pb-16 pt-36 sm:pt-44">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.35em] text-brand">
              — Android · Windows · macOS · Linux
            </p>
            <h1 className="font-display text-5xl font-black uppercase leading-[0.85] tracking-tighter text-white sm:text-7xl">
              Install AniFox.
            </h1>
            <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-muted">
              Download Android, Windows, macOS, and Linux builds from GitHub
              Releases. iOS builds are not installable until Apple signing is
              configured.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              {primary ? (
                <a
                  href={primary.downloadUrl}
                  className="btn-shine inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-brand px-9 text-sm font-black uppercase tracking-[0.06em] text-black shadow-[0_18px_50px_rgba(255,122,26,0.28)] transition-transform hover:scale-[1.02] active:scale-95"
                >
                  <Download className="h-5 w-5" />
                  {latest ? `Download Android ${latest.version}` : 'Download APK'}
                </a>
              ) : (
                <a
                  href={`${GITHUB_URL}/releases`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-brand px-9 text-sm font-black uppercase text-black"
                >
                  <GithubIcon className="h-5 w-5" />
                  View releases
                </a>
              )}
              <Link
                href="/"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] px-6 text-sm font-bold text-white transition-colors hover:border-white/25 hover:bg-white/[0.08]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </Link>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-10 grid gap-3 text-[11px] font-bold text-muted sm:grid-cols-3">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
                Android · Windows · macOS · Linux
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                Open source · release checksums
              </p>
              <p className="flex items-center gap-2">
                <Smartphone className="h-3.5 w-3.5 text-brand" />
                Android 7+ · ARM64 recommended
              </p>
            </div>
          </Reveal>

          <Reveal delay={260}>
            <div className="mt-8 max-w-xl">
              <DownloadCount />
            </div>
          </Reveal>
        </div>
      </header>

      <section className="relative z-10 px-6 pb-24">
        <div className="mx-auto max-w-5xl space-y-6">
          {releases.length > 0 ? (
            releases.map((release, index) => (
              <Reveal key={release.tag} delay={index * 60}>
                <ReleaseBlock release={release} latest={index === 0} />
              </Reveal>
            ))
          ) : (
            <Reveal>
              <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                <p className="text-sm font-medium text-muted">
                  Releases could not be loaded right now. The GitHub release page
                  always has the current builds.
                </p>
                <a
                  href={`${GITHUB_URL}/releases`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.05] px-5 py-3 text-xs font-bold text-white hover:bg-white/[0.09]"
                >
                  <GithubIcon className="h-4 w-4" />
                  Open GitHub releases
                </a>
              </div>
            </Reveal>
          )}

          <Reveal>
            <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-brand">
                Install notes
              </p>
              <ul className="mt-4 space-y-3 text-[13px] leading-relaxed text-muted">
                <li>
                  Android: allow installs from your browser or file manager when
                  prompted, then open the downloaded APK.
                </li>
                <li>
                  Windows and Linux: extract the archive, then run the included
                  AniFox application. macOS: open the app from the archive; its
                  build is unsigned and may require Gatekeeper approval.
                </li>
                <li>
                  APK updates preserve your library when installed over the
                  existing app. Local debug builds use a different signing key
                  and may require uninstalling the release first.
                </li>
                <li>
                  The Play Store AAB is for store upload, not direct installation.
                  iOS requires signing and is not available yet.
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
