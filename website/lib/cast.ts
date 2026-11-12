"use client";

/**
 * Chromecast support for the AniFox web player.
 *
 * The player itself is a third-party iframe, so it cannot be handed to Google's
 * Default Media Receiver. Instead AniFox ships a custom Cast receiver
 * (`/cast`) that renders the active embed source full-screen on the TV. The
 * sender and the receiver talk over a custom Cast namespace.
 *
 * A Cast receiver application id is required. Create one at
 * https://cast.google.com/publish with the receiver URL
 * `${origin}/cast` and set NEXT_PUBLIC_CAST_RECEIVER_APP_ID.
 */

export const CAST_NAMESPACE = "urn:x-cast:fun.anifox.embed";
const SENDER_SDK = "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";

export type CastStatus = "unconfigured" | "unavailable" | "ready" | "connecting" | "connected";

export interface CastPayload {
  src: string;
  title?: string;
}

interface CastSessionLike {
  sendMessage(namespace: string, data: unknown): Promise<unknown> | void;
  endSession?(stopCasting: boolean): void;
}

interface CastContextLike {
  setOptions(options: Record<string, unknown>): void;
  requestSession(): Promise<void>;
  getCurrentSession(): CastSessionLike | null;
  addEventListener(type: string, handler: () => void): void;
  removeEventListener(type: string, handler: () => void): void;
}

interface CastFramework {
  CastContext: { getInstance(): CastContextLike };
}

interface CastGlobals {
  __onGCastApiAvailable?: (available: boolean) => void;
  cast?: { framework?: CastFramework };
  chrome?: { cast?: { AutoJoinPolicy?: { ORIGIN_SCOPED: string } } };
}

const castWindow = () => window as unknown as CastGlobals;

/** The receiver id configured for this deployment, or an empty string. */
export function castReceiverId(): string {
  return process.env.NEXT_PUBLIC_CAST_RECEIVER_APP_ID?.trim() ?? "";
}

let loadPromise: Promise<boolean> | null = null;

/** Loads and initialises the Cast sender SDK once per page. */
export function loadCast(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (!castReceiverId()) return Promise.resolve(false);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<boolean>((resolve) => {
    const win = castWindow();
    let settled = false;

    function finish(available: boolean) {
      if (settled) return;
      settled = true;
      if (!available || !win.cast?.framework) {
        resolve(false);
        return;
      }
      try {
        win.cast.framework.CastContext.getInstance().setOptions({
          receiverApplicationId: castReceiverId(),
          autoJoinPolicy: win.chrome?.cast?.AutoJoinPolicy?.ORIGIN_SCOPED ?? "origin_scoped",
        });
        resolve(true);
      } catch {
        resolve(false);
      }
    }

    win.__onGCastApiAvailable = finish;

    const existing = document.getElementById("anifox-cast-sender");
    if (existing) {
      // The SDK may have loaded before this module ran.
      if (win.cast?.framework) finish(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "anifox-cast-sender";
    script.src = SENDER_SDK;
    script.async = true;
    script.onerror = () => finish(false);
    document.head.appendChild(script);

    // The SDK fires __onGCastApiAvailable; guard against it never firing.
    window.setTimeout(() => finish(Boolean(win.cast?.framework)), 8000);
  });

  return loadPromise;
}

export function currentCastSession(): CastSessionLike | null {
  try {
    return castWindow().cast?.framework?.CastContext.getInstance().getCurrentSession() ?? null;
  } catch {
    return null;
  }
}

/**
 * Opens a Cast session (prompting for a device when needed) and tells the
 * receiver which embed to display.
 */
export async function castEmbed(payload: CastPayload): Promise<void> {
  const available = await loadCast();
  if (!available) throw new Error("Chromecast is not configured for this deployment.");

  const win = castWindow();
  const context = win.cast?.framework?.CastContext.getInstance();
  if (!context) throw new Error("Chromecast is unavailable in this browser.");

  const session = context.getCurrentSession() ?? (await context.requestSession(), context.getCurrentSession());
  if (!session) throw new Error("No Chromecast device was selected.");

  await session.sendMessage(CAST_NAMESPACE, payload);
}

export function endCastSession(): void {
  currentCastSession()?.endSession?.(true);
}

/** Subscribes to Cast session connect/disconnect events. */
export function onCastSessionChange(handler: () => void): () => void {
  const win = castWindow();
  const context = win.cast?.framework?.CastContext.getInstance();
  if (!context) return () => {};
  context.addEventListener("SESSION_STATE_CHANGED", handler);
  return () => context.removeEventListener("SESSION_STATE_CHANGED", handler);
}
