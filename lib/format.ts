export const DAY_MS = 24 * 60 * 60 * 1000;

export function formatAmount(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function timeAgo(iso: string) {
  const hours = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 3600000));
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function isWithinLastDay(iso: string) {
  return Date.now() - new Date(iso).getTime() <= DAY_MS;
}

export function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
