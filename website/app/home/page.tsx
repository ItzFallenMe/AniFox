"use client";

import { useMemo } from "react";
import { Hero } from "@/components/hero";
import { Rail } from "@/components/rail";
import { PageSkeleton } from "@/components/notice";
import { useAsync } from "@/lib/hooks";
import { getMovieList, getTrending, getTvList } from "@/lib/tmdb";
import { getPopularAnime, getTopRatedAnime, getTrendingAnime } from "@/lib/anilist";
import type { Media, RailData } from "@/lib/types";

interface HomeData {
  trending: Media[];
  animeTrending: Media[];
  animePopular: Media[];
  animeTop: Media[];
  movies: Media[];
  tv: Media[];
  topMovies: Media[];
  upcoming: Media[];
}

export default function StreamingHomePage() {
  const { data, loading } = useAsync<HomeData>(async () => {
    const [animeTrending, animePopular, animeTop] = await Promise.all([
      getTrendingAnime().catch(() => []),
      getPopularAnime().catch(() => []),
      getTopRatedAnime().catch(() => []),
    ]);

    try {
      const [trending, movies, tv, topMovies, upcoming] = await Promise.all([
        getTrending(),
        getMovieList("popular"),
        getTvList("popular"),
        getMovieList("top_rated"),
        getMovieList("upcoming"),
      ]);
      return { trending, animeTrending, animePopular, animeTop, movies, tv, topMovies, upcoming };
    } catch {
      return {
        trending: [],
        animeTrending,
        animePopular,
        animeTop,
        movies: [],
        tv: [],
        topMovies: [],
        upcoming: [],
      };
    }
  }, []);

  const rails = useMemo<RailData[]>(() => {
    if (!data) return [];
    const list: RailData[] = [];
    if (data.animeTrending.length) list.push({ title: "Trending Anime", items: data.animeTrending });
    if (data.movies.length) list.push({ title: "Popular Movies", items: data.movies });
    if (data.animePopular.length) list.push({ title: "Popular Anime", items: data.animePopular });
    if (data.tv.length) list.push({ title: "Popular TV Shows", items: data.tv });
    if (data.topMovies.length) list.push({ title: "Top Rated Movies", items: data.topMovies });
    if (data.animeTop.length) list.push({ title: "Top Rated Anime", items: data.animeTop });
    if (data.upcoming.length) list.push({ title: "Upcoming Movies", items: data.upcoming });
    return list;
  }, [data]);

  const heroItems = data?.trending.length ? data.trending : data?.animeTrending ?? [];

  if (loading) {
    return (
      <div className="streaming-home">
        <div className="stream-hero-skeleton skeleton" />
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="streaming-home pb-10">
      <Hero items={heroItems} />
      <div className="home-rails">
        <div className="home-rails-intro"><span>YOUR WATCHLIST STARTS HERE</span><i /></div>
        {rails.map((rail) => (
          <Rail key={rail.title} {...rail} />
        ))}
      </div>
      {!rails.length ? (
        <p className="animate-fade-in px-6 py-20 text-center text-sm text-white/50">
          Nothing to show yet. Check your connection and try again.
        </p>
      ) : null}
    </div>
  );
}
