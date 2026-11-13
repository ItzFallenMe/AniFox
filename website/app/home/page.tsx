"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Hero } from "@/components/hero";
import { HomeSpotlight } from "@/components/home-spotlight";
import { Rail } from "@/components/rail";
import { PageSkeleton } from "@/components/notice";
import {
  AnimeIcon,
  ChevronRightIcon,
  MangaIcon,
  MovieIcon,
  SearchIcon,
  TvIcon,
} from "@/components/icons";
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

  const spotlight = useMemo(() => {
    if (!data) return null;
    const pool = [
      ...data.upcoming,
      ...data.topMovies,
      ...data.movies,
      ...data.tv,
      ...data.animeTrending,
    ];
    return (
      pool.find((item) => item.backdrop && item.overview) ??
      pool.find((item) => item.backdrop) ??
      null
    );
  }, [data]);

  const categories = [
    { href: "/movies", label: "Movies", Icon: MovieIcon },
    { href: "/tv", label: "TV Shows", Icon: TvIcon },
    { href: "/anime", label: "Anime", Icon: AnimeIcon },
    { href: "/manga", label: "Manga", Icon: MangaIcon },
    { href: "/explore", label: "All titles", Icon: SearchIcon },
  ];

  if (loading) {
    return (
      <div className="streaming-home">
        <div className="stream-hero-skeleton skeleton" />
        <PageSkeleton />
      </div>
    );
  }

  const topTen = (data?.trending.length ? data.trending : data?.animeTrending ?? [])
    .filter((item) => item.backdrop || item.poster)
    .slice(0, 10);

  return (
    <div className="streaming-home pb-10">
      <Hero items={heroItems} />
      <div className="home-quicklinks" aria-label="Browse categories">
        {categories.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className="home-quicklink">
            <Icon className="home-quicklink-icon" />
            <span>{label}</span>
            <ChevronRightIcon className="home-quicklink-arrow" />
          </Link>
        ))}
      </div>
      <div className="home-rails">
        <div className="home-rails-intro"><span>CURATED COLLECTIONS</span><i /></div>
        {topTen.length ? (
          <Rail title="Top 10 on AniFox today" items={topTen} ranked index={1} href="/explore" />
        ) : null}
        {spotlight ? <HomeSpotlight media={spotlight} /> : null}
        {rails.map((rail, railIndex) => (
          <Rail key={rail.title} {...rail} index={railIndex + 2} />
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
