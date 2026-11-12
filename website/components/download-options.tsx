"use client";

import { useMemo } from "react";
import { useAsync } from "@/lib/hooks";
import { getDownloads } from "@/lib/downloads";
import type { MediaDetails, MediaType } from "@/lib/types";

interface DownloadOptionsProps {
  type: MediaType;
  details: MediaDetails;
  season?: number;
}

/**
 * Renders download choices returned by the operator's download provider.
 * Renders nothing when no provider is configured or none are available.
 */
export function DownloadOptions({ type, details, season = 1 }: DownloadOptionsProps) {
  const query = useMemo(
    () => ({
      type,
      tmdbId: details.tmdbId ?? null,
      anilistId: details.anilistId ?? null,
      malId: details.malId ?? null,
      season: type === "tv" ? season : null,
    }),
    [type, details.tmdbId, details.anilistId, details.malId, season],
  );

  const { data, loading } = useAsync(() => getDownloads(query), [query.type, query.tmdbId, query.anilistId, query.malId, query.season]);

  if (loading || !data?.length) return null;

  return (
    <div className="download-options">
      <span className="download-options-label">Download</span>
      <div className="download-options-list">
        {data.map((option, index) => (
          <a
            key={`${option.url}-${index}`}
            href={option.url}
            target="_blank"
            rel="noreferrer"
            download
            className="download-option"
          >
            <span className="download-option-quality">{option.quality ?? option.label}</span>
            <span className="download-option-meta">
              {[option.format, option.size].filter(Boolean).join(" · ") || option.label}
            </span>
            <span className="download-option-icon" aria-hidden="true">↓</span>
          </a>
        ))}
      </div>
    </div>
  );
}
