"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, X } from "lucide-react";
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

interface ProviderLink {
  quality: string;
  source: string;
  details: string;
  size: string;
  href: string;
}

/**
 * Loads provider links through AniFox's server route and renders the choices
 * in the site's own UI, without embedding the provider's branded page.
 */
export function DownloadOptions({ type, details, season = 1, episodes = [] }: DownloadOptionsProps) {
  const [open, setOpen] = useState(false);
  const [episode, setEpisode] = useState(1);
  const [links, setLinks] = useState<ProviderLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const dialogId = useId();
  const dialogTitleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogWasOpen = useRef(false);

  const firstEpisode = episodes[0]?.number ?? 1;

  useEffect(() => {
    setEpisode(firstEpisode);
  }, [firstEpisode, season]);

  useEffect(() => {
    setPortalHost(document.body);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
      dialogWasOpen.current = true;
      closeButtonRef.current?.focus();
      return;
    }

    if (dialog.open) dialog.close();
    if (dialogWasOpen.current) {
      dialogWasOpen.current = false;
      triggerRef.current?.focus();
    }
  }, [open, portalHost]);

  const linksUrl = useMemo(
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

  useEffect(() => {
    if (!open || !linksUrl) return;

    const controller = new AbortController();
    let active = true;
    setLinks([]);
    setError(null);
    setLoading(true);

    fetch(linksUrl, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = (await response.json()) as {
          links?: ProviderLink[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(result.error || "Download links could not be loaded.");
        }
        return result.links ?? [];
      })
      .then((result) => {
        if (active) setLinks(result);
      })
      .catch((cause: unknown) => {
        if (!active || controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "Download links could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [open, linksUrl, retryKey]);

  if (!linksUrl) return null;

  return (
    <>
    <section className="downloads" aria-label="Downloads">
      <div className="downloads-head">
        <div className="downloads-copy">
          <span className="downloads-kicker">OFFLINE</span>
          <h2>Download {type === "movie" ? "this movie" : "this episode"}</h2>
          <p>Choose a quality and download source without leaving AniFox.</p>
        </div>
        <div className="downloads-controls">
          <button
            type="button"
            className="downloads-toggle"
            ref={triggerRef}
            aria-expanded={open}
            aria-controls={dialogId}
            onClick={() => setOpen((value) => !value)}
          >
            <span>{open ? "Hide downloads" : "Choose a download"}</span>
            <span className="downloads-toggle-icon" aria-hidden="true">{open ? "−" : "↓"}</span>
          </button>
        </div>
      </div>

      {open && portalHost
        ? createPortal(
            <dialog
              ref={dialogRef}
              id={dialogId}
              className="downloads-dialog"
              aria-labelledby={dialogTitleId}
              onCancel={(event) => {
                event.preventDefault();
                setOpen(false);
              }}
              onClick={(event) => {
                if (event.target === event.currentTarget) setOpen(false);
              }}
            >
              <div className="downloads-frame">
                <div className="downloads-frame-toolbar">
                  <span id={dialogTitleId}>Available download links</span>
                  <div className="downloads-frame-actions">
                    {episodes.length > 1 ? (
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
                      className="downloads-frame-close"
                      ref={closeButtonRef}
                      aria-label="Close download links"
                      title="Close download links"
                      onClick={() => setOpen(false)}
                    >
                      <X aria-hidden="true" />
                    </button>
                  </div>
                </div>
                {loading ? (
                  <p className="downloads-link-message" role="status">Finding available download links…</p>
                ) : error ? (
                  <div className="downloads-link-message" role="alert">
                    <span>{error}</span>
                    <button type="button" onClick={() => setRetryKey((key) => key + 1)}>
                      Try again
                    </button>
                  </div>
                ) : links.length ? (
                  <div className="downloads-link-grid">
                    {links.map((link) => (
                      <a
                        key={link.href}
                        className="downloads-link-card"
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${link.quality} ${link.source} download${link.size ? `, ${link.size}` : ""}`}
                      >
                        <span className="downloads-link-quality">{link.quality}</span>
                        <span className="downloads-link-copy">
                          <span className="downloads-link-source">{link.source}</span>
                          {link.details ? <span className="downloads-link-details">{link.details}</span> : null}
                          {link.size ? <span className="downloads-link-size">{link.size}</span> : null}
                        </span>
                        <span className="downloads-link-icon"><Download aria-hidden="true" /></span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="downloads-link-message" role="status">
                    No download links were found for this title.
                  </p>
                )}
              </div>
            </dialog>,
            portalHost,
          )
        : null}
    </section>
    </>
  );
}
