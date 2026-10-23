import { NativeModules } from 'react-native';

import { DISCORD_CONFIG, isDiscordConfigured } from '../config/env';

/**
 * Discord Rich Presence bridge.
 *
 * Discord's mobile presence lives in the Discord Social SDK, which is not on
 * Maven and has no React Native binding. The native module
 * (`com.itzfallenme.anifox.discord.DiscordPresenceModule`) therefore talks to a
 * thin `DiscordSdkAdapter` that is discovered at runtime; dropping in an
 * adapter implementation turns presence on without touching JS.
 *
 * Every function is a safe no-op when the adapter or module is missing, so the
 * app behaves exactly as before in builds without the SDK.
 */

export interface DiscordStatus {
  /** True when the native module found a Discord SDK adapter. */
  sdkInstalled: boolean;
  /** True when Discord accepted the client id and presence is live. */
  connected: boolean;
  /** Human-readable detail for the settings screen. */
  reason?: string;
}

export interface DiscordActivity {
  details: string;
  state?: string;
  /** Epoch ms; Discord renders it as an elapsed timer. */
  startTimestamp?: number;
  largeImage?: string;
  largeText?: string;
  smallImage?: string;
  smallText?: string;
}

interface NativeDiscordPresence {
  getStatus(): Promise<DiscordStatus>;
  connect(clientId: string): Promise<DiscordStatus>;
  setActivity(activity: DiscordActivity): Promise<boolean>;
  clearActivity(): Promise<boolean>;
  disconnect(): Promise<boolean>;
}

const Native = NativeModules.AnifoxDiscord as NativeDiscordPresence | undefined;

export const discordPresenceSupported = Boolean(Native);
export const discordConfigured = isDiscordConfigured;

const offline: DiscordStatus = {
  sdkInstalled: false,
  connected: false,
  reason: 'Discord SDK is not linked in this build.',
};

export const getDiscordStatus = async (): Promise<DiscordStatus> => {
  if (!Native) return offline;
  try {
    return await Native.getStatus();
  } catch {
    return offline;
  }
};

export const connectDiscord = async (): Promise<DiscordStatus> => {
  if (!Native || !isDiscordConfigured) {
    return {
      sdkInstalled: false,
      connected: false,
      reason: isDiscordConfigured
        ? offline.reason
        : 'Add a Discord client ID in src/config/env.ts.',
    };
  }
  try {
    return await Native.connect(DISCORD_CONFIG.CLIENT_ID);
  } catch {
    return offline;
  }
};

export const disconnectDiscord = async (): Promise<void> => {
  try {
    await Native?.disconnect();
  } catch {
    // Already disconnected.
  }
};

export const setDiscordActivity = async (
  activity: DiscordActivity | null,
): Promise<void> => {
  if (!Native) return;
  try {
    if (activity) await Native.setActivity(activity);
    else await Native.clearActivity();
  } catch {
    // Presence is cosmetic; never interrupt playback for it.
  }
};
