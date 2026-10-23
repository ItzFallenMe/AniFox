import { NativeModules, Platform } from 'react-native';

/**
 * Orientation control for the player.
 *
 * `NativeModules.AnifoxOrientation` is an in-repo Kotlin module (see
 * `android/.../orientation/`). Every call is optional: on a build without the
 * module, or on another platform, rotation simply stays with the system.
 */

interface OrientationNativeModule {
  lockLandscape: () => void;
  lockPortrait: () => void;
  unlock: () => void;
}

const nativeModule: OrientationNativeModule | undefined =
  Platform.OS === 'android'
    ? (NativeModules.AnifoxOrientation as OrientationNativeModule | undefined)
    : undefined;

export const orientationSupported = nativeModule != null;

const call = (method: keyof OrientationNativeModule): void => {
  try {
    nativeModule?.[method]();
  } catch {
    // Rotation is presentation only — never let it interrupt playback.
  }
};

/** Sensor landscape: both left and right rotations are accepted. */
export const lockLandscape = (): void => call('lockLandscape');

/** Sensor portrait, used when fullscreen is dismissed. */
export const lockPortrait = (): void => call('lockPortrait');

/** Back to the device default; called whenever the player unmounts. */
export const unlockOrientation = (): void => call('unlock');
