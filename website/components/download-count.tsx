"use client";

import { useEffect, useState } from "react";

export function DownloadCount() {
  const [count, setCount] = useState<number | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/download-count", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load release counts");
        return response.json() as Promise<{ totalDownloads: number }>;
      })
      .then((data) => {
        if (Number.isFinite(data.totalDownloads)) setCount(data.totalDownloads);
      })
      .catch(() => {
        if (!controller.signal.aborted) setUnavailable(true);
      });

    return () => controller.abort();
  }, []);

  return (
    <div
      className="flex min-h-[84px] items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4"
      aria-live="polite"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand/25 bg-brand/10 text-brand">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3" />
        </svg>
      </span>
      <span>
        <strong className="block text-xl font-black tracking-tight text-white">
          {unavailable
            ? "Unavailable"
            : count === null
              ? "Loading…"
              : new Intl.NumberFormat().format(count)}
        </strong>
        <span className="mt-0.5 block text-[11px] font-medium text-muted">
          Total app-package downloads from GitHub Releases · not install counts
        </span>
      </span>
    </div>
  );
}
