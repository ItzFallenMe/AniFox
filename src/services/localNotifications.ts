import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

/**
 * Bridge to the small Android notification module
 * (`com.itzfallenme.anifox.notifications.LocalNotificationsModule`).
 *
 * Scheduling is done with `AlarmManager`, so an alert still arrives when the
 * app is closed. When the module is missing (e.g. a JS-only test run) every
 * call degrades to a no-op instead of throwing.
 */

interface NativeNotifications {
  schedule(
    id: string,
    title: string,
    body: string,
    atMillis: number,
  ): Promise<boolean>;
  cancel(id: string): Promise<boolean>;
  cancelAll(): Promise<void>;
  getScheduledIds(): Promise<string[]>;
}

const NativeModule = NativeModules.AnifoxNotifications as
  | NativeNotifications
  | undefined;

export const notificationsAvailable =
  Platform.OS === 'android' && Boolean(NativeModule);

/** Ask for POST_NOTIFICATIONS on Android 13+; older releases always allowed. */
export const ensureNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  if (Number(Platform.Version) < 33) return true;

  const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
  if (await PermissionsAndroid.check(permission)) return true;

  const result = await PermissionsAndroid.request(permission, {
    title: 'Episode alerts',
    message:
      'AniFox needs notification access to tell you when a saved series airs a new episode.',
    buttonPositive: 'Allow',
    buttonNegative: 'Not now',
  });
  return result === PermissionsAndroid.RESULTS.GRANTED;
};

export const scheduleNotification = async (params: {
  id: string;
  title: string;
  body: string;
  at: Date;
}): Promise<boolean> => {
  if (!NativeModule) return false;
  try {
    return await NativeModule.schedule(
      params.id,
      params.title,
      params.body,
      params.at.getTime(),
    );
  } catch {
    return false;
  }
};

export const cancelNotification = async (id: string): Promise<void> => {
  try {
    await NativeModule?.cancel(id);
  } catch {
    // Nothing to cancel.
  }
};

export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await NativeModule?.cancelAll();
  } catch {
    // Nothing to cancel.
  }
};
