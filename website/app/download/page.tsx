import type { Metadata } from 'next';
import {
  Download,
  Laptop,
  Monitor,
  Smartphone,
  Terminal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { GithubIcon } from '@/components/icons';
import { SiteNav } from '@/components/site-nav';
import { SiteFooter } from '@/components/site-footer';
import { Reveal } from '@/components/motion';
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

type PlatformAsset = {
  name: string;
  size: number;
  downloadUrl: string;
  label: string;
};

type PlatformDownload = {
  name: string;
  description: string;
  Icon: LucideIcon;
  assets: PlatformAsset[];
};

function platformDownloads(release?: ReleaseInfo): PlatformDownload[] {
  const packages = release?.packages ?? [];
  const apk = release ? preferred(release) : undefined;

  return [
    {
      name: 'Android',
      description: 'Universal APK · recommended for most devices',
      Icon: Smartphone,
      assets: apk
        ? [{
            ...apk,
            label: apk.architecture === 'Universal'
              ? 'Download Universal APK'
              : `Download ${apk.architecture} APK`,
          }]
        : [],
    },
    {
      name: 'Windows',
      description: '64-bit Windows',
      Icon: Monitor,
      assets: packages
        .filter(file => /windows-x64\.zip$/i.test(file.name))
        .map(file => ({ ...file, label: 'Download for Windows' })),
    },
    {
      name: 'macOS',
      description: 'Choose Apple Silicon or Intel',
      Icon: Laptop,
      assets: packages
        .filter(file => /macos-(?:arm64|x64)\.zip$/i.test(file.name))
        .map(file => ({
          ...file,
          label: /arm64/i.test(file.name) ? 'Apple Silicon' : 'Intel',
        })),
    },
    {
      name: 'Linux',
      description: '64-bit Linux',
      Icon: Terminal,
      assets: packages
        .filter(file => /linux-x64\.(?:tar\.gz|zip)$/i.test(file.name))
        .map(file => ({ ...file, label: 'Download for Linux' })),
    },
  ];
}

const PlatformCard = ({
  platform,
  hasRelease,
}: {
  platform: PlatformDownload;
  hasRelease: boolean;
}) => (
  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition-colors hover:border-brand/25 hover:bg-white/[0.04]">
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/[0.08] text-brand">
        <platform.Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <div>
        <h2 className="text-base font-bold text-white">{platform.name}</h2>
        <p className="mt-0.5 text-[11px] text-faint">{platform.description}</p>
      </div>
    </div>
    <div className="mt-5 flex flex-col gap-2">
      {platform.assets.length ? (
        platform.assets.map(asset => (
          <a
            key={asset.name}
            href={asset.downloadUrl}
            className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-brand px-3.5 py-2.5 text-xs font-bold text-black transition hover:brightness-110"
          >
            <span>{asset.label}</span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="text-[10px] font-semibold text-black/65">
                {formatBytes(asset.size)}
              </span>
              <Download className="h-4 w-4" />
            </span>
          </a>
        ))
      ) : (
        <a
          href={`${GITHUB_URL}/releases`}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-white/[0.08]"
        >
          {hasRelease ? 'Not in the latest release' : 'Check releases'}
          <GithubIcon className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  </div>
);

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
  const platforms = platformDownloads(latest);

  return (
    <main className="relative min-h-screen bg-background text-ink">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="silk-layer absolute inset-0" />
        <div className="aurora-a absolute -top-40 left-1/2 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,122,26,0.16),transparent_65%)] blur-2xl" />
      </div>

      <SiteNav />

      <header className="relative z-10 px-6 pb-12 pt-36 sm:pt-44">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.35em] text-brand">
              {latest ? `Latest release · AniFox ${latest.version}` : 'Android · Windows · macOS · Linux'}
            </p>
            <h1 className="font-display text-5xl font-black uppercase leading-[0.9] tracking-tighter text-white sm:text-7xl">
              Download AniFox.
            </h1>
            <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-muted">
              Choose your platform for a direct download of the latest release.
            </p>
          </Reveal>
        </div>
      </header>

      <section id="platforms" className="relative z-10 px-6 pb-16">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-brand">
                  Choose your platform
                </p>
                <h2 className="mt-1 font-display text-2xl font-black tracking-tight text-white">
                  {latest ? `AniFox ${latest.version}` : 'Latest downloads'}
                </h2>
              </div>
              {latest?.publishedAt ? (
                <span className="text-[11px] font-medium text-faint">
                  Released {formatDate(latest.publishedAt)}
                </span>
              ) : null}
            </div>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {platforms.map((platform, index) => (
              <Reveal key={platform.name} delay={index * 55}>
                <PlatformCard platform={platform} hasRelease={Boolean(latest)} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 pb-24">
        <div className="mx-auto max-w-5xl space-y-6">
          {releases.length > 0 ? (
            <>
              <h2 className="font-display text-2xl font-black text-white">
                All release files
              </h2>
              {releases.map((release, index) => (
                <Reveal key={release.tag} delay={index * 60}>
                  <ReleaseBlock release={release} latest={index === 0} />
                </Reveal>
              ))}
            </>
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
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
