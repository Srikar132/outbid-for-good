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

export function utcDateKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

export function formatUtcDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T00:00:00Z`));
}

export function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
