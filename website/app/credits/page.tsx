import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenText,
  Code2,
  Database,
  Languages,
  UserRound,
} from "lucide-react";
import { Reveal } from "@/components/motion";
import { GithubIcon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { CREATOR_URL, GITHUB_URL, TMDB_URL } from "@/lib/links";

export const metadata: Metadata = {
  title: "Credits",
  description:
    "Meet the people, open-source projects, data providers, and tools behind AniFox.",
};

const credits = [
  {
    role: "Creator & maintainer",
    name: "ItzFallenMe",
    detail: "Product design, the Flutter client, web app, and manga service.",
    href: CREATOR_URL,
    label: "GitHub profile",
    Icon: UserRound,
  },
  {
    role: "Open-source project",
    name: "ItzFallenMe / AniFox",
    detail: "The Flutter clients, website, and bundled manga API are maintained in public under GPL-3.0-only.",
    href: GITHUB_URL,
    label: "Browse the repository",
    Icon: Code2,
  },
  {
    role: "Manga adapter attribution",
    name: "MeManga",
    detail:
      "Some manga adapter parsing was adapted from MeManga at commit 4268b38. It is not a runtime dependency; attribution and the MIT notice are included in the repository.",
    href: "https://github.com/meellm/MeManga/tree/4268b38a7cab2ea7e5a5d0612a5c15d05befb8b8",
    label: "View the referenced commit",
    Icon: BookOpenText,
  },
  {
    role: "Manga providers",
    name: "MangaDex · MangaPill · Asura Scans · ComicK · TCB Scans",
    detail:
      "MangaDex provides the browse catalog; all five implemented adapters support search and chapter reading. Provider availability can change.",
    href: "https://mangadex.org",
    label: "Visit MangaDex",
    Icon: BookOpenText,
  },
  {
    role: "Metadata & tracking",
    name: "TMDB · AniList · MyAnimeList · Kitsu · Simkl",
    detail:
      "TMDB and AniList provide catalog metadata. Tracking integrations connect to AniList, MyAnimeList, Kitsu, and Simkl.",
    href: TMDB_URL,
    label: "Visit TMDB",
    Icon: Database,
  },
  {
    role: "Web typefaces",
    name: "Inter · Outfit",
    detail:
      "The website bundles Inter and Outfit under the SIL Open Font License 1.1. Full copyright notices and license terms are included in the repository.",
    href: `${GITHUB_URL}/blob/main/THIRD_PARTY_NOTICES.md`,
    label: "View third-party notices",
    Icon: Languages,
  },
];

const stack = [
  "Flutter",
  "Riverpod",
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Node.js",
  "Cloudflare Workers",
  "Cheerio",
  "media_kit",
  "Inter",
  "Outfit",
];

export default function CreditsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-ink">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="silk-layer absolute inset-0" />
        <div className="absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,122,26,0.12),transparent_65%)] blur-2xl" />
      </div>

      <SiteNav />

      <main className="credits-page relative z-10 mx-auto w-full max-w-7xl">
        <Reveal>
          <section className="credits-hero">
            <span className="credits-kicker">THE PEOPLE & PROJECTS BEHIND ANIFOX</span>
            <h1>
              Built in the open.
              <br />
              <em>Made for every next story.</em>
            </h1>
            <p>
              AniFox brings together open-source tools, metadata services, and
              independent content providers. Here&apos;s what makes the project work.
            </p>
            <div className="credits-actions">
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="credits-button">
                <GithubIcon aria-hidden="true" /> View the repository
              </a>
              <Link href="/home" className="credits-button credits-button-ghost">
                Explore the web app <ArrowUpRight aria-hidden="true" />
              </Link>
            </div>
          </section>
        </Reveal>

        <section className="credits-grid" aria-label="People, providers, and projects">
          {credits.map(({ role, name, detail, href, label, Icon }, index) => (
            <Reveal key={name} delay={index * 55}>
              <article className="credits-card h-full">
                <span className="credits-icon"><Icon aria-hidden="true" /></span>
                <span className="credits-role">{role}</span>
                <h2>{name}</h2>
                <p>{detail}</p>
                {href && label ? (
                  <a href={href} target="_blank" rel="noreferrer">
                    {label} <ArrowUpRight aria-hidden="true" />
                  </a>
                ) : null}
              </article>
            </Reveal>
          ))}
        </section>

        <Reveal>
          <section className="credits-stack">
            <span className="credits-kicker">BUILT WITH</span>
            <div className="credits-chips">
              {stack.map((item) => <span key={item}>{item}</span>)}
            </div>
          </section>
        </Reveal>

        <p className="credits-license">
          AniFox is free software under the GNU General Public License v3.0 only. It
          does not host, upload, or store media. Manga source availability and
          content are controlled by their respective providers.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
