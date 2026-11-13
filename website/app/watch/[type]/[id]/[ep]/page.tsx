"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type CSSProperties } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { CastButton } from "@/components/cast-button";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { ErrorNotice } from "@/components/notice";
import { useAsync } from "@/lib/hooks";
import { getAnimeDetails } from "@/lib/anilist";
import { findTmdbMatch, getMovieDetails, getTvDetails, getTvSeason } from "@/lib/tmdb";
import { buildEmbedUrl, DEFAULT_SERVER, serverById, SERVERS, type ServerId } from "@/lib/servers";
import { titleHref } from "@/lib/routes";
import type { EpisodeInfo, MediaDetails, MediaType } from "@/lib/types";

const SERVER_STORAGE = "anifox.server";

function parseType(value: string | string[] | undefined): MediaType | null {
  return value === "movie" || value === "tv" || value === "anime" ? value : null;
}

function WatchContent() {
  const params = useParams<{ type: string; id: string; ep: string }>();
  const searchParams = useSearchParams();
  const type = parseType(params.type);
  const id = Number(params.id);
  const episode = Math.max(1, Number(params.ep) || 1);
  const season = Math.max(1, Number(searchParams.get("season")) || 1);

  const [server, setServer] = useState<ServerId>(DEFAULT_SERVER);
  const [panel, setPanel] = useState<"servers" | "episodes" | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SERVER_STORAGE);
      if (stored && SERVERS.some((item) => item.id === stored)) {
        setServer(stored as ServerId);
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  function chooseServer(next: ServerId) {
    setServer(next);
    try {
      localStorage.setItem(SERVER_STORAGE, next);
    } catch {
      /* storage unavailable */
    }
    setPanel(null);
  }

  useEffect(() => {
    if (!panel) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setPanel(null);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [panel]);

  const { data, loading, error } = useAsync<MediaDetails | null>(async () => {
    if (!type || !Number.isFinite(id)) return null;
    if (type === "movie") return getMovieDetails(id);
    if (type === "tv") return getTvDetails(id);

    const details = await getAnimeDetails(id);
    if (!details.tmdbId) details.tmdbId = await findTmdbMatch(details.title, details.year);
    if (!details.anilistId) details.anilistId = id;
    return details;
  }, [type, id]);

  const seasonEpisodes = useAsync<EpisodeInfo[]>(async () => {
    if (type !== "tv") return [];
    return getTvSeason(id, season);
  }, [type, id, season]);

  const embedUrl = useMemo(() => {
    if (!data || !type) return null;
    return buildEmbedUrl(
      {
        type,
        tmdbId: data.tmdbId,
        anilistId: data.anilistId,
        malId: data.malId,
        episode,
        season,
      },
      server,
    );
  }, [data, type, server, episode, season]);

  if (loading) {
    return (
      <div className="watch-root" data-theme="aurora">
        <div className="vp-root vp-skeleton">
          <div className="vp-top">
            <div className="vp-titles">
              <div className="vp-title">Loading player…</div>
            </div>
          </div>
          <div className="vp-overlay">
            <div className="vp-spinner" />
          </div>
        </div>
      </div>
    );
  }
  if (error) return <ErrorNotice message={error.message} />;
  if (!data || !type) return <ErrorNotice message="This title could not be found." />;

  const watchBase = `/watch/${type}/${id}`;
  const episodeTitle =
    type === "tv"
      ? seasonEpisodes.data?.find((item) => item.number === episode)?.title
      : null;
  const subtitle =
    type === "movie"
      ? [data.year, data.runtime ? `${data.runtime} min` : null].filter(Boolean).join(" · ")
      : `E${episode}${type === "tv" ? ` · S${season}` : ""}${episodeTitle ? ` · ${episodeTitle}` : ""}`;

  const episodes: {
    number: number;
    label: string;
    overview?: string | null;
    still?: string | null;
    runtime?: number | null;
    airDate?: string | null;
  }[] =
    type === "tv"
      ? (seasonEpisodes.data ?? []).map((item) => ({
          number: item.number,
          label: item.title || `Episode ${item.number}`,
          overview: item.overview,
          still: item.still,
          runtime: item.runtime,
          airDate: item.airDate,
        }))
      : (data.episodeList ?? []).map((item) => ({
          number: item.number,
          label: item.title || `Episode ${item.number}`,
          overview: item.overview,
          still: item.still,
          runtime: item.runtime,
          airDate: item.airDate,
        }));
  const serverPanelOpen = panel === "servers";
  const episodesPanelOpen = panel === "episodes";

  return (
    <div
      className="watch-root"
      data-theme="aurora"
    >
      <div
        className={`vp-root ${episodes.length ? "has-episodes" : ""} ${panel ? "has-panel" : ""}`}
        onClick={() => {
          if (panel) setPanel(null);
        }}
      >
        {embedUrl ? (
          <iframe
            key={`${server}-${embedUrl}`}
            src={embedUrl}
            title={`${data.title} player`}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="no-referrer"
            className="vp-video vp-frame"
          />
        ) : (
          <div className="vp-overlay" style={{ opacity: 1, pointerEvents: "auto" }}>
            <div className="vp-note" style={{ maxWidth: 420, textAlign: "center" }}>
              {serverById(server).name} cannot address this title without a TMDB id.
              Try another server from the list.
            </div>
          </div>
        )}

        <div className="vp-top">
          <Link className="vp-btn vp-back" href={titleHref(type === "anime" ? { type, id: data.anilistId ?? id } : { type, id })} aria-label="Back to details">
            <ChevronLeftIcon />
          </Link>
          <div className="vp-titles">
            <div className="vp-title">{data.title}</div>
            <div className="vp-subtitle">{subtitle}</div>
          </div>
          <div className="vp-top-actions">
            {episodes.length > 1 ? (
              <div className="vp-step">
                <Link
                  className={`vp-step-btn ${episode <= 1 ? "is-disabled" : ""}`}
                  href={episode > 1 ? `${watchBase}/${episode - 1}${type === "tv" && season > 1 ? `?season=${season}` : ""}` : `${watchBase}/${episode}`}
                  aria-label="Previous episode"
                  aria-disabled={episode <= 1}
                  onClick={(event) => {
                    if (episode <= 1) event.preventDefault();
                    event.stopPropagation();
                  }}
                >
                  <ChevronLeftIcon />
                </Link>
                <Link
                  className={`vp-step-btn ${episode >= episodes.length ? "is-disabled" : ""}`}
                  href={episode < episodes.length ? `${watchBase}/${episode + 1}${type === "tv" && season > 1 ? `?season=${season}` : ""}` : `${watchBase}/${episode}`}
                  aria-label="Next episode"
                  aria-disabled={episode >= episodes.length}
                  onClick={(event) => {
                    if (episode >= episodes.length) event.preventDefault();
                    event.stopPropagation();
                  }}
                >
                  <ChevronRightIcon />
                </Link>
              </div>
            ) : null}
            <CastButton src={embedUrl} title={data.title} />
            <div className="vp-trigger-wrap" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                className={`vp-trigger ${serverPanelOpen ? "is-active" : ""}`}
                aria-label={`Streaming server: ${serverById(server).name}`}
                aria-haspopup="menu"
                aria-expanded={serverPanelOpen}
                onClick={() => setPanel(serverPanelOpen ? null : "servers")}
              >
                <ServerIcon />
                <span className="vp-trigger-label">Server</span>
                <span className="vp-trigger-value">{serverById(server).name}</span>
              </button>
              <div
                className={`vp-panel ${serverPanelOpen ? "is-open" : ""}`}
                aria-hidden={!serverPanelOpen}
                inert={!serverPanelOpen}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="vp-panel-box" role="menu" aria-label="Streaming servers">
                  <div className="vp-panel-head">
                    <span className="vp-panel-title">Streaming servers</span>
                    <button
                      type="button"
                      className="vp-panel-close"
                      onClick={() => setPanel(null)}
                      aria-label="Close server list"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                  <div className="vp-panel-cols">
                    <section className="vp-col">
                      <div className="vp-col-title">Sources</div>
                      <div className="vp-col-list" role="group" aria-label="Sources">
                        {SERVERS.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            role="menuitemradio"
                            aria-checked={item.id === server}
                            onClick={() => chooseServer(item.id)}
                            className={`vp-opt ${item.id === server ? "is-active" : ""}`}
                          >
                            <span className="vp-opt-check">
                              <CheckIcon />
                            </span>
                            <span className="vp-opt-text">
                              <span className="vp-opt-label">{item.name}</span>
                              <span className="vp-opt-detail">{item.tagline}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>
                  <div className="vp-panel-foot">
                    <span className="vp-note">Each source uses its own player and may show ads.</span>
                  </div>
                </div>
              </div>
            </div>
            {episodes.length ? (
              <button
                type="button"
                className={`vp-trigger ${episodesPanelOpen ? "is-active" : ""}`}
                aria-label={`Choose episode, currently episode ${episode}`}
                aria-haspopup="dialog"
                aria-expanded={episodesPanelOpen}
                onClick={(event) => {
                  event.stopPropagation();
                  setPanel(episodesPanelOpen ? null : "episodes");
                }}
              >
                <ListIcon />
                <span className="vp-trigger-label">Episodes</span>
                <span className="vp-trigger-value">Episode {episode}</span>
              </button>
            ) : null}
          </div>
        </div>

        <div
          className={`vp-eps ${episodesPanelOpen ? "is-open" : ""}`}
          role="dialog"
          aria-label="Episodes"
          aria-hidden={!episodesPanelOpen}
          aria-modal={episodesPanelOpen || undefined}
          inert={!episodesPanelOpen}
          onClick={(event) => event.stopPropagation()}
        >
          <header className="vp-eps-head">
            <div className="vp-eps-heading">
              <span className="vp-eps-show">{data.title}</span>
              <h2 className="vp-eps-title">Episodes</h2>
            </div>
            <div className="vp-eps-actions">
              {type === "tv" && (data.seasonList?.length ?? 0) > 1 ? (
                <label className="vp-season-picker">
                  <span className="sr-only">Season</span>
                  <select
                    value={season}
                    onChange={(event) => {
                      window.location.href = `${watchBase}/1?season=${event.target.value}`;
                    }}
                  >
                    {data.seasonList?.map((item) => (
                      <option key={item.number} value={item.number}>
                        {item.name} ({item.episodes})
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <span className="vp-note">{episodes.length} episodes</span>
              <button
                type="button"
                className="vp-eps-close"
                onClick={() => setPanel(null)}
                aria-label="Close episodes"
              >
                <CloseIcon />
              </button>
            </div>
          </header>
          <div className="vp-eps-body">
            <div className="vp-eps-scroll">
              <div className="vp-eps-list">
                {episodes.map((item, index) => {
                  const query = type === "tv" && season > 1 ? `?season=${season}` : "";
                  const current = item.number === episode;
                  return (
                    <Link
                      key={item.number}
                      href={`${watchBase}/${item.number}${query}`}
                      className={`vp-ep ${current ? "is-current" : ""}`}
                      style={{ "--i": Math.min(index, 12) } as CSSProperties}
                      aria-current={current ? "true" : undefined}
                    >
                      <span className="vp-ep-num">{String(item.number).padStart(2, "0")}</span>
                      <span className="vp-ep-thumb">
                        {item.still ? <img src={item.still} alt="" loading="lazy" /> : null}
                        <span className="vp-ep-thumb-overlay">
                          <span className="vp-ep-flag">{current ? "Now playing" : "Play episode"}</span>
                        </span>
                      </span>
                      <span className="vp-ep-info">
                        <span className="vp-ep-title">{item.label}</span>
                        <span className="vp-ep-facts">
                          {item.runtime ? <span>{item.runtime} min</span> : null}
                          {item.airDate ? <span>{item.airDate}</span> : null}
                        </span>
                        {item.overview ? <span className="vp-ep-overview">{item.overview}</span> : null}
                      </span>
                    </Link>
                  );
                })}
                {!episodes.length ? (
                  <div className="vp-eps-empty">Episode data is not available for this title.</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="watch-mobile-info" aria-label="Title details">
        <div className="watch-mobile-head">
          <div className="watch-mobile-copy">
            <p className="watch-mobile-kicker">
              {type === "movie" ? "MOVIE" : type === "tv" ? "TV SERIES" : "ANIME"}
              {data.year ? ` · ${data.year}` : null}
            </p>
            <h1>{data.title}</h1>
            <div className="watch-mobile-meta">
              {data.score != null && data.score > 0 ? (
                <span className="watch-mobile-score">★ {data.score.toFixed(1)}</span>
              ) : null}
              {data.runtime ? <span>{data.runtime} min</span> : null}
              {data.genres?.slice(0, 2).map((genre) => <span key={genre}>{genre}</span>)}
            </div>
          </div>
          <Link
            className="watch-mobile-details"
            href={titleHref(type === "anime" ? { type, id: data.anilistId ?? id } : { type, id })}
          >
            Details <span aria-hidden="true">›</span>
          </Link>
        </div>

        <div className="watch-mobile-actions">
          <button type="button" onClick={() => setPanel("servers")}>
            <ServerIcon /> {serverById(server).name}
          </button>
          {episodes.length > 1 ? (
            <button type="button" onClick={() => setPanel("episodes")}>
              <ListIcon /> Episodes
            </button>
          ) : null}
          <CastButton src={embedUrl} title={data.title} />
        </div>

        {data.overview ? <p className="watch-mobile-overview">{data.overview}</p> : null}

        {episodes.length > 1 ? (
          <div className="watch-mobile-chips" aria-label="Episodes">
            {episodes.slice(0, 40).map((item) => {
              const query = type === "tv" && season > 1 ? `?season=${season}` : "";
              const current = item.number === episode;
              return (
                <Link
                  key={item.number}
                  href={`${watchBase}/${item.number}${query}`}
                  aria-current={current ? "true" : undefined}
                  className={current ? "is-current" : ""}
                >
                  E{item.number}
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>

      <MobileTabBar />
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="watch-root" data-theme="aurora">
          <div className="vp-root vp-skeleton">
            <div className="vp-overlay">
              <div className="vp-spinner" />
            </div>
          </div>
        </div>
      }
    >
      <WatchContent />
    </Suspense>
  );
}

function ServerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <rect x="3" y="13" width="18" height="7" rx="2" />
      <circle cx="7" cy="7.5" r="1" />
      <circle cx="7" cy="16.5" r="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
