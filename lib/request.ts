// Accepts anything Headers-shaped so both Route Handlers (`req.headers`)
// and Server Actions (`await headers()` from `next/headers`) can share this.
export function getClientIp(headers: { get(name: string): string | null }): string {
  const forwardedFor = headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? "unknown";
}
