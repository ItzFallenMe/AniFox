"use client";

import { useEffect, useState } from "react";
import { CastIcon } from "./icons";
import {
  castEmbed,
  castReceiverId,
  currentCastSession,
  endCastSession,
  loadCast,
  onCastSessionChange,
} from "@/lib/cast";

interface CastButtonProps {
  /** Embed URL currently shown in the player. */
  src: string | null;
  title: string;
}

export function CastButton({ src, title }: CastButtonProps) {
  const [status, setStatus] = useState<"unconfigured" | "unavailable" | "idle" | "connecting" | "connected">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!castReceiverId()) {
      setStatus("unconfigured");
      return;
    }

    let cancelled = false;
    const sync = () => {
      if (!cancelled) setStatus(currentCastSession() ? "connected" : "idle");
    };

    loadCast().then((available) => {
      if (cancelled) return;
      if (!available) {
        setStatus("unavailable");
        return;
      }
      sync();
      onCastSessionChange(sync);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleClick() {
    setError(null);

    if (status === "connected") {
      endCastSession();
      setStatus("idle");
      return;
    }

    if (!src) {
      setError("This title has no playable source to cast.");
      return;
    }

    setStatus("connecting");
    try {
      await castEmbed({ src, title });
      setStatus("connected");
    } catch (cause) {
      setStatus(currentCastSession() ? "connected" : "idle");
      setError(cause instanceof Error ? cause.message : "Casting failed.");
    }
  }

  const disabled = status === "unconfigured" || status === "unavailable" || !src;
  const label =
    status === "connected"
      ? "Stop casting"
      : status === "connecting"
        ? "Connecting…"
        : status === "unconfigured"
          ? "Cast receiver not configured"
          : status === "unavailable"
            ? "Cast unavailable in this browser"
            : "Cast to TV";

  return (
    <div className="vp-trigger-wrap">
      <button
        type="button"
        className={`vp-trigger ${status === "connected" ? "is-live" : ""}`}
        onClick={handleClick}
        disabled={disabled}
        title={label}
        aria-label={label}
      >
        <CastIcon />
        <span className="vp-trigger-label">
          {status === "connected" ? "Casting" : "Cast"}
        </span>
      </button>
      {error ? (
        <div className="vp-cast-error" role="status">
          {error}
        </div>
      ) : null}
    </div>
  );
}
