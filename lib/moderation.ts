// Baseline profanity/impersonation filter, per AGENTS.md §10. Not
// exhaustive — a deny-list plus a few impersonation patterns, run before
// any leaderboard entry is created. Borderline names should ideally go to
// manual review, but no moderation queue exists yet (there's no "review"
// status separate from pending/confirmed/failed), so a hit here rejects
// the submission outright rather than silently allowing it.

// Whole-word matches only (\b...\b) — plain substring matching would
// reject innocuous names like "Grapevine" or "Shitake" for containing
// "rape"/"shit" as a substring (the Scunthorpe problem).
const DENY_PATTERNS = [
  /\bfuck\w*\b/i,
  /\bshit\w*\b/i,
  /\bbitch\w*\b/i,
  /\basshole\w*\b/i,
  /\bnigger\w*\b/i,
  /\bcunt\w*\b/i,
  /\brape\w*\b/i,
  /\bterrorist\w*\b/i,
];

const IMPERSONATION_PATTERNS = [
  /\bofficial\b/i,
  /\bverified\b/i,
  /\badmin(istrator)?\b/i,
  /\bgovernment\b/i,
  /\bgovt\b/i,
];

function containsDeniedWord(text: string) {
  return DENY_PATTERNS.some((pattern) => pattern.test(text));
}

function containsImpersonationPattern(text: string) {
  return IMPERSONATION_PATTERNS.some((pattern) => pattern.test(text));
}

function impersonatesCreator(text: string, creatorName?: string | null) {
  if (!creatorName) return false;
  const normalized = text.trim().toLowerCase();
  return normalized === creatorName.trim().toLowerCase();
}

export function moderateNames({
  displayName,
  companyName,
  creatorName,
}: {
  displayName: string;
  companyName?: string;
  creatorName?: string | null;
}): { ok: true } | { ok: false; reason: string } {
  const fields = [displayName, companyName].filter(
    (v): v is string => !!v && v.trim().length > 0
  );

  for (const field of fields) {
    if (containsDeniedWord(field)) {
      return { ok: false, reason: 'That name isn’t allowed. Try something else.' };
    }
    if (containsImpersonationPattern(field)) {
      return {
        ok: false,
        reason: 'That name looks like an impersonation claim. Try something else.',
      };
    }
    if (impersonatesCreator(field, creatorName)) {
      return {
        ok: false,
        reason: 'That name matches the cause’s creator. Try something else.',
      };
    }
  }

  return { ok: true };
}
