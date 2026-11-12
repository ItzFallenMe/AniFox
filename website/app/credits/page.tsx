import type { Metadata } from "next";
import Link from "next/link";
import { GithubIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Credits",
  description: "AniFox is built and maintained by ItzFallenMe. Meet the people and services behind it.",
};

const credits = [
  {
    role: "Creator & maintainer",
    name: "ItzFallenMe",
    detail: "Design, Flutter client, web client and the manga API.",
    href: "https://github.com/ItzFallenMe",
    linkLabel: "github.com/ItzFallenMe",
  },
  {
    role: "Source code",
    name: "ItzFallenMe/AniFox",
    detail: "The full AniFox client and website, licensed under GPL-3.0.",
    href: "https://github.com/ItzFallenMe/AniFox",
    linkLabel: "github.com/ItzFallenMe/AniFox",
  },
  {
    role: "Metadata",
    name: "TMDB · AniList · MyAnimeList",
    detail: "Movie and TV metadata from TMDB; anime metadata and artwork from AniList and MyAnimeList.",
    href: "https://www.themoviedb.org/",
    linkLabel: "themoviedb.org",
  },
  {
    role: "Playback",
    name: "Third-party embed hosts",
    detail: "AniFox does not host or store media. Video is delivered by independent embed providers.",
    href: "",
    linkLabel: "",
  },
];

const stack = [
  "Flutter",
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "AniList GraphQL",
  "TMDB API",
  "media_kit",
];

export default function CreditsPage() {
  return (
    <div className="credits-page">
      <section className="credits-hero">
        <span className="credits-kicker">THE PEOPLE BEHIND ANIFOX</span>
        <h1>
          Built in the open.
          <br />
          <em>Kept free for everyone.</em>
        </h1>
        <p>
          AniFox is an open-source project. Metadata, hosting and the tools it is
          built on all deserve credit too.
        </p>
        <div className="credits-actions">
          <a href="https://github.com/ItzFallenMe/AniFox" target="_blank" rel="noreferrer" className="credits-button">
            <GithubIcon /> View the repository
          </a>
          <Link href="/home" className="credits-button credits-button-ghost">
            Explore the web app
          </Link>
        </div>
      </section>

      <section className="credits-grid" aria-label="Credits">
        {credits.map((credit) => (
          <article key={credit.name} className="credits-card">
            <span className="credits-role">{credit.role}</span>
            <h2>{credit.name}</h2>
            <p>{credit.detail}</p>
            {credit.href ? (
              <a href={credit.href} target="_blank" rel="noreferrer">
                {credit.linkLabel} ↗
              </a>
            ) : null}
          </article>
        ))}
      </section>

      <section className="credits-stack">
        <span className="credits-kicker">BUILT WITH</span>
        <div className="credits-chips">
          {stack.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <p className="credits-license">
        AniFox is free software under the GNU General Public License v3.0.
        It does not host, upload or store any media.
      </p>
    </div>
  );
}
