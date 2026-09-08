// Best-effort, in-memory fixed-window rate limiter.
//
// NOT durable: this Map lives in a single serverless function instance.
// On Vercel, concurrent/regional instances each get their own counter, so a
// determined caller can exceed the nominal limit by hitting different
// instances. This is a stopgap per AGENTS.md §10 to blunt casual order-spam
// against Razorpay, not a real anti-abuse control — replace with a durable
// store (Upstash Redis via Vercel Marketplace, or Vercel Firewall rate
// limiting) before real-money launch. See prompts/donate-checkout-flow.md.
const hits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now >= entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= max) {
    return false;
  }

  entry.count += 1;
  return true;
}
