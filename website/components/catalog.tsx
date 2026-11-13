"use client";

import { Hero } from "./hero";
import { Rail } from "./rail";
import { PageSkeleton } from "./notice";
import { useAsync } from "@/lib/hooks";
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
    { title: "New Movies", items: popular },
    { title: "Now Playing", items: nowPlaying },
    { title: "Top Rated Movies", items: top },
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
    { title: "Airing Today", items: airing },
    { title: "Top Rated TV Shows", items: top },
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

  const rails = data?.rails ?? [];
  const heroItems = rails
    .flatMap((rail) => rail.items)
    .filter((item, index, list) => item.backdrop && list.findIndex((entry) => entry.key === item.key) === index)
    .slice(0, 8);

  return (
    <div className={`catalog-page catalog-page-${kind} pb-10`}>
      {loading ? (
        <>
          <div className="skeleton h-[75vh] w-full opacity-30 md:aspect-video md:h-auto" />
          <PageSkeleton />
        </>
      ) : (
        <>
          <Hero items={heroItems} />
          <div className="catalog-rails">
            {rails.map((rail) => (
              <Rail key={rail.title} {...rail} />
            ))}
          </div>
          {!rails.length ? (
            <div className="px-6 py-24 text-center text-sm text-white/50">
              Nothing to show for {headers[kind].title.toLowerCase()} yet.
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
