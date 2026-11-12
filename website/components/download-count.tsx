"use client";

import { useEffect, useState } from "react";

export function DownloadCount() {
  const [count, setCount] = useState<number | null>(null);

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
        // Keep the page useful if GitHub's public API is temporarily unavailable.
      });

    return () => controller.abort();
  }, []);

  return (
    <span className="landing-download-stat" aria-live="polite">
      <span className="landing-download-stat-dot" aria-hidden="true" />
      <strong>{count === null ? "—" : new Intl.NumberFormat().format(count)}</strong>
      <span>release downloads</span>
    </span>
  );
}
