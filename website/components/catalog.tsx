"use client";

import { Rail } from "./rail";
import { PageSkeleton } from "./notice";
import Link from "next/link";
import { PlayIcon, StarIcon } from "./icons";
import { useAsync } from "@/lib/hooks";
import { titleHref, watchHref } from "@/lib/routes";
import { getMovieList, getTvList } from "@/lib/tmdb";
import { getPopularAnime, getTopRatedAnime, getTrendingAnime } from "@/lib/anilist";
import type { Media, RailData } from "@/lib/types";

type Kind = "movie" | "tv" | "anime";

const headers: Record<Kind, { title: string; subtitle: string }> = {
  movie: {
    title: "Movies",
    subtitle: "Blockbusters, classics and everything in between.",
  },
  tv: {
    title: "TV Shows",
    subtitle: "Currently airing, all-time favourites and hidden gems.",
  },
  anime: {
    title: "Anime",
    subtitle: "Trending, popular and top rated series — powered by AniList.",
  },
};

async function movieRails(): Promise<RailData[]> {
  const [popular, top, nowPlaying, upcoming] = await Promise.all([
    getMovieList("popular").catch((): Media[] => []),
    getMovieList("top_rated").catch((): Media[] => []),
    getMovieList("now_playing").catch((): Media[] => []),
    getMovieList("upcoming").catch((): Media[] => []),
  ]);
  return [
    { title: "Popular Movies", items: popular },
    { title: "Top Rated Movies", items: top },
    { title: "Now Playing", items: nowPlaying },
    { title: "Upcoming", items: upcoming },
  ].filter((rail) => rail.items.length > 0);
}

async function tvRails(): Promise<RailData[]> {
  const [popular, top, airing, onAir] = await Promise.all([
    getTvList("popular").catch((): Media[] => []),
    getTvList("top_rated").catch((): Media[] => []),
    getTvList("airing_today").catch((): Media[] => []),
    getTvList("on_the_air").catch((): Media[] => []),
  ]);
  return [
    { title: "Popular TV Shows", items: popular },
    { title: "Top Rated TV Shows", items: top },
    { title: "Airing Today", items: airing },
    { title: "On The Air", items: onAir },
  ].filter((rail) => rail.items.length > 0);
}

async function animeRails(): Promise<RailData[]> {
  const [trending, popular, top] = await Promise.all([
    getTrendingAnime(1).catch((): Media[] => []),
    getPopularAnime(1).catch((): Media[] => []),
    getTopRatedAnime(1).catch((): Media[] => []),
  ]);
  return [
    { title: "Trending Anime", items: trending },
    { title: "Popular Anime", items: popular },
    { title: "Top Rated Anime", items: top },
  ].filter((rail) => rail.items.length > 0);
}

export function Catalog({ kind }: { kind: Kind }) {
  const { data, loading } = useAsync<{ rails: RailData[] }>(async () => {
    if (kind === "anime") {
      return { rails: await animeRails() };
    }
    return {
      rails: kind === "movie" ? await movieRails() : await tvRails(),
    };
  }, [kind]);

  const header = headers[kind];
  const featured = data?.rails.flatMap((rail) => rail.items).find((item) => item.backdrop);

  return (
    <div className={`catalog-page catalog-page-${kind} pb-10`}>
      {loading ? (
        <>
          <div className="catalog-spotlight-skeleton skeleton" />
          <PageSkeleton />
        </>
      ) : (
        <>
          <section className="catalog-spotlight">
            {featured?.backdrop ? <img src={featured.backdrop} alt="" className="catalog-spotlight-art" /> : null}
            <div className="catalog-spotlight-shade" />
            <div className="catalog-spotlight-copy">
              <span className="catalog-spotlight-kicker">ANI FOX COLLECTION · {kind.toUpperCase()}</span>
              <h1>{header.title}</h1>
              <p className="catalog-spotlight-subtitle">{header.subtitle}</p>
              {featured ? (
                <div className="catalog-featured-copy">
                  <span className="catalog-featured-label">FEATURED PICK</span>
                  <h2>{featured.title}</h2>
                  <div className="catalog-featured-meta">
                    {featured.score != null ? <span><StarIcon /> {featured.score.toFixed(1)}</span> : null}
                    {featured.year ? <span>{featured.year}</span> : null}
                    {featured.genres?.slice(0, 2).map((genre) => <span key={genre}>{genre}</span>)}
                  </div>
                  {featured.overview ? <p>{featured.overview}</p> : null}
                  <div className="catalog-spotlight-actions">
                    <Link href={watchHref(featured.type, featured.id, 1, 1)}><PlayIcon /> Watch now</Link>
                    <Link href={titleHref(featured)}>More info <span>↗</span></Link>
                  </div>
                </div>
              ) : null}
            </div>
            <span className="catalog-spotlight-index">DISCOVER <i /> {kind === "movie" ? "01" : kind === "tv" ? "02" : "03"}</span>
          </section>

          <div className="catalog-rails">
            {(data?.rails ?? []).map((rail) => <Rail key={rail.title} {...rail} />)}
          </div>
        </>
      )}
    </div>
  );
}
