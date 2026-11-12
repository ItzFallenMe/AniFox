"use client";

import { useEffect, useRef, useState } from "react";

const RECEIVER_SDK = "https://www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js";
const NAMESPACE = "urn:x-cast:fun.anifox.embed";

interface CustomMessageEvent {
  data?: { src?: string; title?: string } | string;
}

interface ReceiverContext {
  addCustomMessageListener(namespace: string, handler: (event: CustomMessageEvent) => void): void;
  start(options?: Record<string, unknown>): void;
}

interface ReceiverGlobals {
  cast?: {
    framework?: {
      CastReceiverContext?: { getInstance(): ReceiverContext };
    };
  };
}

/**
 * Custom Cast receiver: draws whatever embed source the sender is playing on
 * the TV. Register this page (served at `/cast`) as the receiver URL in the
 * Cast developer console and set NEXT_PUBLIC_CAST_RECEIVER_APP_ID.
 */
export default function CastReceiverPage() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [title, setTitle] = useState("AniFox");

  useEffect(() => {
    const win = window as unknown as ReceiverGlobals;
    let cancelled = false;
    let started = false;

    function startReceiver() {
      if (started || cancelled) return;
      const context = win.cast?.framework?.CastReceiverContext?.getInstance();
      if (!context) return;
      started = true;

      context.addCustomMessageListener(NAMESPACE, (event) => {
        const payload = typeof event.data === "string" ? safeParse(event.data) : event.data;
        if (payload?.src) {
          setSrc(payload.src);
          if (payload.title) setTitle(payload.title);
        }
      });

      context.start({ disableIdleTimeout: true });
    }

    if (win.cast?.framework?.CastReceiverContext) {
      startReceiver();
      return;
    }

    const script = document.createElement("script");
    script.src = RECEIVER_SDK;
    script.async = true;
    script.onload = startReceiver;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="cast-receiver">
      {src ? (
        <iframe
          ref={frame}
          src={src}
          title={title}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="cast-receiver-idle">
          <p>AniFox</p>
          <span>Cast a title from the AniFox player.</span>
        </div>
      )}
    </main>
  );
}

function safeParse(value: string) {
  try {
    return JSON.parse(value) as { src?: string; title?: string };
  } catch {
    return null;
  }
}
