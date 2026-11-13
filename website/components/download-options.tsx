"use client";

import { useEffect, useMemo, useState } from "react";
import { downloadUrl } from "@/lib/downloads";
import type { MediaDetails, MediaType } from "@/lib/types";

interface EpisodeChoice {
  number: number;
  label: string;
}

interface DownloadOptionsProps {
  type: MediaType;
  details: MediaDetails;
  season?: number;
  episodes?: EpisodeChoice[];
}

/**
 * Embeds the operator's download provider page.
 *
 * The provider renders its own quality list and authorises the site by domain,
 * so AniFox only supplies the route and lets the page run in an iframe.
 */
export function DownloadOptions({ type, details, season = 1, episodes = [] }: DownloadOptionsProps) {
  const [open, setOpen] = useState(false);
  const [episode, setEpisode] = useState(1);

  const firstEpisode = episodes[0]?.number ?? 1;

  useEffect(() => {
    setEpisode(firstEpisode);
  }, [firstEpisode, season]);

  const src = useMemo(
    () =>
      downloadUrl({
        type,
        tmdbId: details.tmdbId ?? null,
        anilistId: details.anilistId ?? null,
        season,
        episode: type === "movie" ? null : episode,
      }),
    [type, details.tmdbId, details.anilistId, season, episode],
  );

  if (!src) return null;

  return (
    <section className={`downloads ${open ? "is-open" : ""}`} aria-label="Downloads">
      <div className="downloads-head">
        <div className="downloads-copy">
          <span className="downloads-kicker">OFFLINE</span>
          <h2>Download {type === "movie" ? "this movie" : "this episode"}</h2>
          <p>Opens our download partner inside the page and keeps you on AniFox.</p>
        </div>
        <div className="downloads-controls">
          {open && episodes.length > 1 ? (
            <label className="downloads-episode">
              <span className="sr-only">Episode to download</span>
              <select value={episode} onChange={(event) => setEpisode(Number(event.target.value))}>
                {episodes.map((item) => (
                  <option key={item.number} value={item.number}>
                    E{item.number} · {item.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button
            type="button"
            className="downloads-toggle"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span>{open ? "Hide downloads" : "Choose a download"}</span>
            <span className="downloads-toggle-icon" aria-hidden="true">{open ? "−" : "↓"}</span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="downloads-frame">
          <iframe
            key={src}
            src={src}
            title={`Download options for ${details.title}`}
            loading="lazy"
            allow="autoplay; fullscreen; encrypted-media"
            referrerPolicy="origin"
          />
        </div>
      ) : null}
    </section>
  );
}
