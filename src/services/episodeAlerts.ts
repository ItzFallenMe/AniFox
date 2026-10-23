import { getTitle, type MediaItem, type NextEpisodeToAir } from '../types';
import {
  cancelNotification,
  ensureNotificationPermission,
  notificationsAvailable,
  scheduleNotification,
} from './localNotifications';
import { createPersistedStore } from './persistedStore';

/**
 * "Tell me when the next episode airs" alerts.
 *
 * One alert per series. The notification is handed to Android's AlarmManager,
 * so it fires even when AniFox is closed. Alerts survive app restarts (the
 * store is persisted) but not device reboots — Android drops pending alarms on
 * boot and re-arming them would need a boot receiver.
 */

export interface EpisodeAlert {
  tvId: number;
  item: MediaItem;
  season: number;
  episode: number;
  episodeName?: string;
  /** TMDB air date, `YYYY-MM-DD`. */
  airDate: string;
  /** Epoch ms the local notification is set for. */
  scheduledAt: number;
}

export type AlertResult = 'scheduled' | 'denied' | 'unavailable';

/** Local hour the alert fires on the air date. */
export const ALERT_HOUR = 19;

/**
 * Turn a TMDB air date into the local notification time.
 *
 * Returns `null` for a missing/invalid date or a moment already in the past —
 * the caller should treat that as "nothing to schedule".
 */
export const alertTimeForAirDate = (
  airDate: string | null | undefined,
  now: number = Date.now(),
): Date | null => {
  if (!airDate || !/^\d{4}-\d{2}-\d{2}$/.test(airDate)) return null;
  const at = new Date(`${airDate}T00:00:00`);
  if (Number.isNaN(at.getTime())) return null;
  at.setHours(ALERT_HOUR, 0, 0, 0);
  if (at.getTime() <= now) return null;
  return at;
};

const notificationId = (tvId: number) => `episode-alert-${tvId}`;

const isAlert = (value: unknown): value is EpisodeAlert => {
  if (!value || typeof value !== 'object') return false;
  const alert = value as EpisodeAlert;
  return Boolean(alert.item) && typeof alert.tvId === 'number';
};

const store = createPersistedStore<EpisodeAlert[]>({
  key: 'anifox.alerts.v1',
  initial: [],
  sanitize: stored => (Array.isArray(stored) ? stored.filter(isAlert) : null),
});

export const episodeAlertStore = store;

export const hydrateEpisodeAlerts = store.hydrate;

export const getEpisodeAlert = (tvId: number): EpisodeAlert | undefined =>
  store.getSnapshot().find(alert => alert.tvId === tvId);

export const isAlertAvailable = notificationsAvailable;

/** Ask Android for permission, schedule the alarm and remember the alert. */
export const enableEpisodeAlert = async (
  item: MediaItem,
  next: NextEpisodeToAir,
): Promise<AlertResult> => {
  if (!notificationsAvailable) return 'unavailable';

  const at = alertTimeForAirDate(next.air_date);
  if (!at || next.season_number == null || next.episode_number == null) {
    return 'unavailable';
  }

  if (!(await ensureNotificationPermission())) return 'denied';

  const alert: EpisodeAlert = {
    tvId: item.id,
    item,
    season: next.season_number,
    episode: next.episode_number,
    episodeName: next.name,
    airDate: next.air_date as string,
    scheduledAt: at.getTime(),
  };

  const scheduled = await scheduleNotification({
    id: notificationId(item.id),
    title: `${getTitle(item)} · new episode`,
    body: `S${alert.season} · E${alert.episode}${
      alert.episodeName ? ` — ${alert.episodeName}` : ''
    } is out now.`,
    at,
  });
  if (!scheduled) return 'unavailable';

  store.update(current => [
    alert,
    ...current.filter(existing => existing.tvId !== item.id),
  ]);
  return 'scheduled';
};

export const disableEpisodeAlert = async (tvId: number): Promise<void> => {
  await cancelNotification(notificationId(tvId));
  store.update(current => current.filter(alert => alert.tvId !== tvId));
};

export const clearEpisodeAlerts = async (): Promise<void> => {
  await Promise.all(store.getSnapshot().map(alert => cancelNotification(notificationId(alert.tvId))));
  store.update(() => []);
};

/** Drop entries whose air date has passed, keeping the list honest. */
export const pruneEpisodeAlerts = (now: number = Date.now()): void => {
  store.update(current =>
    current.filter(alert => alert.scheduledAt > now),
  );
};
