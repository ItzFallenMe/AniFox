import Link from "next/link";
import { PlayIcon, StarIcon } from "./icons";
import { titleHref, typeLabel, watchHref } from "@/lib/routes";
import type { Media } from "@/lib/types";

export function HomeSpotlight({ media }: { media: Media }) {
  const art = media.backdrop ?? media.poster;
  const genres = media.genres?.length ? media.genres.slice(0, 3) : [typeLabel(media.type)];

  return (
    <section className="home-spotlight" aria-label={`Editor's pick: ${media.title}`}>
      <div className="home-spotlight-art">
        {art ? <img src={art} alt="" loading="lazy" /> : null}
        <span className="home-spotlight-frame" aria-hidden="true" />
        <span className="home-spotlight-stamp" aria-hidden="true">01</span>
      </div>

      <div className="home-spotlight-copy">
        <span className="home-spotlight-kicker">
          <i aria-hidden="true" /> EDITOR&apos;S PICK
        </span>
        <h2>{media.title}</h2>
        <div className="home-spotlight-meta">
          {media.score != null && media.score > 0 ? (
            <span className="home-spotlight-score"><StarIcon /> {media.score.toFixed(1)}</span>
          ) : null}
          {media.year ? <span>{media.year}</span> : null}
          {genres.map((genre) => <span key={genre}>{genre}</span>)}
        </div>
        {media.overview ? <p>{media.overview}</p> : null}
        <div className="home-spotlight-actions">
          <Link className="home-spotlight-play" href={watchHref(media.type, media.id, 1, 1)}>
            <PlayIcon /> Play now
          </Link>
          <Link className="home-spotlight-more" href={titleHref(media)}>
            More details <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
