export type Identity = { url: string; kind: "url" | "handle" };

export function parseIdentity(input: string): Identity | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("@")) {
    const handle = trimmed.slice(1).trim();
    if (!handle) return null;
    return { url: `https://instagram.com/${handle}`, kind: "handle" };
  }

  if (!trimmed.includes(".") || trimmed.includes(" ")) return null;

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withScheme);
    if (!parsed.hostname.includes(".")) return null;
    return { url: parsed.toString(), kind: "url" };
  } catch {
    return null;
  }
}

export function normalizeIdentityUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${host}${path}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export function faviconUrlFor(url: string): string {
  return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`;
}

// A stored entry URL that resolved from an @handle (see parseIdentity) always
// lands on instagram.com — Instagram's own favicon is identical for every
// handle, so callers show a generic @ icon instead of a real favicon there,
// same as the pre-submission preview in ClaimBand/ConfirmClaim.
export function isHandleStyleUrl(url: string): boolean {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase() === "instagram.com";
  } catch {
    return false;
  }
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
