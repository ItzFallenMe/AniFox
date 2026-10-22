import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Tiny JSON persistence helper for user settings.
 *
 * Storage failures are swallowed on purpose: a device with a full or broken
 * key-value store should still leave the app fully usable for the session.
 */

export const readStoredJson = async <T>(key: string): Promise<T | null> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

export const writeStoredJson = async (
  key: string,
  value: unknown,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore — settings simply will not persist on this device.
  }
};

export const clearStoredJson = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Ignore.
  }
};
