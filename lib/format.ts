export const DAY_MS = 24 * 60 * 60 * 1000;

export function formatAmount(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function timeAgo(iso: string) {
  const hours = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 3600000));
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function timeAgoLong(iso: string) {
  const ms = Math.max(0, Date.now() - new Date(iso).getTime());
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

export function isWithinLastDay(iso: string) {
  return Date.now() - new Date(iso).getTime() <= DAY_MS;
}

/**
 * Daily boards are cut on India time, not UTC. The cause, the donors and the
 * currency are all Indian — a UTC boundary falls at 05:30 IST, so a donation
 * made at 2am Tuesday would land on Monday's board and read as a bug.
 *
 * This is only the calendar-day grouping. The rolling 24h "today" filter in
 * lib/filters.ts is a separate thing and is deliberately left alone.
 */
export const DAY_TIME_ZONE = "Asia/Kolkata";

/** "2026-09-10" for the IST calendar day the timestamp falls in. */
export function dayKey(iso: string | Date) {
  // en-CA formats as YYYY-MM-DD, which sorts lexicographically.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** The IST day currently in progress. */
export function currentDayKey() {
  return dayKey(new Date());
}

export function isValidDayKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

/** "10 September 2026". The key is already a calendar date, so format it as
 *  UTC to avoid shifting it a second time. */
export function formatDayKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/** "10 Sep" — for the compact past-days list. */
export function formatDayKeyShort(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
