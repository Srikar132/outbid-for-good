import posthog, { type CaptureResult } from "posthog-js";

if (process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
  console.error(
    "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, " +
      "this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured"
  );
}

// A developer's `next dev` session runs the same client init as production, so
// its unhandled exceptions and events reach the project. Drop everything sent
// from a local host, so every captured event comes from a deployed site and
// error tracking stays trustworthy before launch.
function isLocalHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "[::1]" ||
    host.endsWith(".local")
  );
}

if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    // Include the defaults option as required by PostHog
    defaults: "2026-01-30",
    // Enables capturing unhandled exceptions via Error Tracking
    capture_exceptions: true,
    // Drop events from local development hosts so they never reach the project.
    before_send: (event: CaptureResult | null): CaptureResult | null =>
      isLocalHost() ? null : event,
    // Turn on debug in development mode
    debug: process.env.NODE_ENV === "development",
  });
}

// IMPORTANT: Never combine this approach with other client-side PostHog initialization approaches,
// especially components like a PostHogProvider. instrumentation-client.ts is the correct solution
// for initializing client-side PostHog in Next.js 15.3+ apps.
