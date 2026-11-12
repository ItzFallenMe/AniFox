"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PlayIcon, StarIcon } from "@/components/icons";
import { ErrorNotice, PageSkeleton } from "@/components/notice";
import { useAsync } from "@/lib/hooks";
import { getAnimeDetails } from "@/lib/anilist";
import {
  findTmdbMatch,
  getMovieDetails,
  getTvDetails,
  getTvSeason,
} from "@/lib/tmdb";
import { watchHref } from "@/lib/routes";
import type { EpisodeInfo, MediaDetails, MediaType } from "@/lib/types";

function parseType(value: string | string[] | undefined): MediaType | null {
  return value === "movie" || value === "tv" || value === "anime" ? value : null;
}

export default function TitlePage() {
  const params = useParams<{ type: string; id: string }>();
  const type = parseType(params.type);
  const id = Number(params.id);

  const { data, loading, error } = useAsync<MediaDetails | null>(async () => {
    if (!type || !Number.isFinite(id)) return null;

    if (type === "movie") return getMovieDetails(id);
    if (type === "tv") return getTvDetails(id);

    const details = await getAnimeDetails(id);
    if (!details.tmdbId) {
      const tmdbId = await findTmdbMatch(details.title, details.year);
      if (tmdbId) details.tmdbId = tmdbId;
    }
    return details;
  }, [type, id]);

  const [season, setSeason] = useState(1);
  const seasonEpisodes = useAsync<EpisodeInfo[]>(async () => {
    if (type !== "tv" || !data) return [];
    return getTvSeason(id, season);
  }, [type, id, season, data]);

  useEffect(() => {
    setSeason(data?.seasonList?.[0]?.number ?? 1);
  }, [data]);

  if (loading) {
    return (
      <div>
        <div className="skeleton h-[46vh] w-full opacity-30" />
        <PageSkeleton />
      </div>
    );
  }

  if (error) return <ErrorNotice message={error.message} />;
  if (!data || !type) {
    return <ErrorNotice message="This title could not be found." />;
  }

  const episodes =
    type === "tv" ? seasonEpisodes.data ?? [] : data.episodeList ?? [];
  const totalEpisodes = type === "tv" ? null : data.episodes;
  const formatMoney = (amount: number | null | undefined) =>
    amount ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount) : null;

  return (
    <div className="title-page">
      <section className="title-backdrop">
        {data.backdrop ? <img src={data.backdrop} alt="" className="title-backdrop-image" /> : null}
        <div className="title-backdrop-shade" />
        <Link className="title-back-link" href="/home">‹ <span>Back to browse</span></Link>

        <div className="title-hero-content">
          {data.poster ? <img src={data.poster} alt={data.title} className="title-poster" /> : null}
          <div className="title-summary">
            <div className="title-meta-line">
              <span className="title-type-pill">{type === "tv" ? "TV SERIES" : type.toUpperCase()}</span>
              {data.year ? <span>{data.year}</span> : null}
              {data.score != null ? (
                <span className="title-rating"><StarIcon /> {data.score.toFixed(1)}</span>
              ) : null}
              {data.runtime ? <span>{data.runtime} min</span> : null}
              {data.format ? <span>{data.format.replaceAll("_", " ")}</span> : null}
            </div>
            <h1>{data.title}</h1>
            {data.tagline ? <p className="title-tagline">{data.tagline}</p> : null}
            {data.genres?.length ? (
              <div className="title-genres">
                {data.genres.slice(0, 5).map((genre) => <span key={genre}>{genre}</span>)}
              </div>
            ) : null}
            <div className="title-actions">
              <Link href={watchHref(type, id, 1, type === "tv" ? season : 1)} className="title-play-button">
                <PlayIcon /> Play {type === "movie" ? "movie" : "now"}
              </Link>
              {data.malId ? (
                <a href={`https://myanimelist.net/anime/${data.malId}`} target="_blank" rel="noreferrer" className="title-outbound-link">MyAnimeList ↗</a>
              ) : null}
              {data.anilistId ? (
                <a href={`https://anilist.co/anime/${data.anilistId}`} target="_blank" rel="noreferrer" className="title-outbound-link">AniList ↗</a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <main className="title-detail-content">
        <div className="title-detail-grid">
          <div className="title-detail-main">
            <section className="title-overview">
              <div className="title-section-heading">
                <span>THE STORY</span>
                <h2>Overview</h2>
              </div>
              <p>{data.overview || "No overview available for this title yet."}</p>
            </section>

            {type === "tv" && (data.seasonList?.length ?? 0) > 0 ? (
              <section className="title-episodes">
                <div className="title-section-heading title-episodes-heading">
                  <div><span>KEEP WATCHING</span><h2>Episodes</h2></div>
                  <label className="title-season-picker">
                    <span className="sr-only">Select season</span>
                    <select value={season} onChange={(event) => setSeason(Number(event.target.value))}>
                      {data.seasonList?.map((item) => <option key={item.number} value={item.number}>{item.name}</option>)}
                    </select>
                  </label>
                </div>
                {seasonEpisodes.loading ? (
                  <p className="title-muted-note">Loading episodes…</p>
                ) : (
                  <div className="title-episode-grid">
                    {(seasonEpisodes.data ?? []).map((episode) => (
                      <Link key={episode.number} href={watchHref("tv", id, episode.number, season)} className="title-episode-card">
                        <div className="title-episode-still">
                          {episode.still ? <img src={episode.still} alt="" /> : <span>EP {episode.number}</span>}
                          <i><PlayIcon /></i>
                        </div>
                        <div className="title-episode-copy">
                          <strong>{episode.number}. {episode.title || "Episode"}</strong>
                          <span>{episode.runtime ? `${episode.runtime} min` : episode.airDate || "Play episode"}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            ) : null}

            {type !== "tv" && episodes.length > 0 ? (
              <section className="title-episodes">
                <div className="title-section-heading"><span>AVAILABLE TO WATCH</span><h2>Episodes</h2></div>
                <div className="title-episode-number-list">
                  {episodes.map((episode) => (
                    <Link key={episode.number} href={watchHref(type, id, episode.number, 1)}>
                      <PlayIcon /> <span>{episode.number}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {data.cast?.length ? (
              <section className="title-cast-section">
                <div className="title-section-heading"><span>THE PEOPLE BEHIND IT</span><h2>Cast</h2></div>
                <div className="title-cast-row">
                  {data.cast.map((person) => (
                    <a key={person.id} href={`https://www.themoviedb.org/person/${person.id}`} target="_blank" rel="noreferrer" className="title-cast-card">
                      <div className="title-cast-image">
                        {person.profile ? <img src={person.profile} alt="" loading="lazy" /> : <span>{person.name.slice(0, 1)}</span>}
                      </div>
                      <strong>{person.name}</strong>
                      <span>{person.character || "Cast"}</span>
                    </a>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="title-facts">
            <div className="title-section-heading"><span>AT A GLANCE</span><h2>Details</h2></div>
            <InfoRow label="Type" value={type === "tv" ? "TV show" : type === "anime" ? "Anime" : "Movie"} />
            {data.year ? <InfoRow label="Year" value={data.year} /> : null}
            {data.certification ? <InfoRow label="Rated" value={data.certification} /> : null}
            {totalEpisodes ? <InfoRow label="Episodes" value={String(totalEpisodes)} /> : null}
            {data.seasons ? <InfoRow label="Seasons" value={String(data.seasons)} /> : null}
            {data.runtime ? <InfoRow label="Runtime" value={`${data.runtime} min`} /> : null}
            {data.director ? <InfoRow label="Director" value={data.director} /> : null}
            {data.creators?.length ? <InfoRow label="Created by" value={data.creators.join(", ")} /> : null}
            {data.studios?.length ? <InfoRow label="Studios" value={data.studios.join(", ")} /> : null}
            {data.countries?.length ? <InfoRow label="Country" value={data.countries.slice(0, 3).join(", ")} /> : null}
            {data.language ? <InfoRow label="Language" value={data.language} /> : null}
            {data.originalTitle && data.originalTitle !== data.title ? <InfoRow label="Original title" value={data.originalTitle} /> : null}
            {formatMoney(data.budget) ? <InfoRow label="Budget" value={formatMoney(data.budget)!} /> : null}
            {formatMoney(data.revenue) ? <InfoRow label="Box office" value={formatMoney(data.revenue)!} /> : null}
            {data.status ? <InfoRow label="Status" value={data.status.replaceAll("_", " ")} /> : null}
            {data.score != null ? <InfoRow label="Rating" value={`${data.score.toFixed(1)} / 10`} /> : null}
          </aside>
        </div>
      </main>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="title-fact-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
