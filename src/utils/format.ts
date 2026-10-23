export const formatRating = (value?: number): string =>
  value && value > 0 ? value.toFixed(1) : 'NR';

export const formatRuntime = (minutes?: number): string => {
  if (!minutes || minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
};

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** `2026-11-12` → `Nov 12, 2026`; returns the input when it is not an ISO date. */
export const formatAirDate = (iso?: string): string => {
  if (!iso) return 'TBA';
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day || month > 12) return iso;
  return `${MONTHS[month - 1]} ${day}, ${year}`;
};

/** Air date plus the local hour the alert fires, e.g. `Nov 12 · 19:00`. */
export const formatAlertTime = (scheduledAt: number): string => {
  const at = new Date(scheduledAt);
  if (Number.isNaN(at.getTime())) return 'TBA';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${MONTHS[at.getMonth()]} ${at.getDate()} · ${pad(at.getHours())}:${pad(
    at.getMinutes(),
  )}`;
};

export const formatClock = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${mins}:${pad(secs)}`;
};
