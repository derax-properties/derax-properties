/**
 * Turns a spoken (transcribed) phrase into a CRM navigation. Deliberately
 * pattern-matching rather than calling an AI model to interpret it: the set
 * of things Eric actually asked for (today's follow-ups, overdue follow-ups,
 * new/qualified/hot leads, or "look up this name/address") is small and
 * fixed, so matching known phrasings is instant, free, and predictable —
 * it never invents a filter that doesn't exist. Anything that isn't one of
 * those known phrasings is treated as a name or address to look up, which
 * is exactly what was asked for ("I give you a name, you look for it").
 *
 * Every result reuses the Seller Leads page's existing URL filters
 * (?followup=, ?status=, ?motivation=, ?search=) — see
 * app/admin/(dashboard)/leads/page.tsx — rather than introducing a new,
 * separate data path.
 */

export type VoiceCommandResult =
  | { type: "navigate"; url: string }
  | { type: "unrecognized" };

const FOLLOWUP_NONE = /\bno\s+follow[\s-]?up\b/i;
const FOLLOWUP_OVERDUE = /\boverdue\b/i;
const FOLLOWUP_UPCOMING = /\bupcoming\b.*\bfollow/i;
const FOLLOWUP_TODAY_RE = /\btoday\b.*\b(?:follow[\s-]?up|call)|\b(?:follow[\s-]?up|call)\b.*\btoday\b/i;

const STATUS_NEW = /\bnew\b.*\blead/i;
const STATUS_QUALIFIED = /\bqualif(?:y|ied)\b.*\blead/i;
const MOTIVATION_HOT = /\bhot\b.*\blead/i;
const MOTIVATION_WARM = /\bwarm\b.*\blead/i;
const MOTIVATION_COLD = /\bcold\b.*\blead/i;

// "find John Smith", "search for 123 Main Street", "pull up the Cliyattville lead"…
const SEARCH_PREFIX = /^(?:find|search(?: for)?|pull up|look up|look for|show me|get me)\s+(.+)/i;

function toLeadsUrl(params: Record<string, string>): string {
  const qs = new URLSearchParams(params).toString();
  return `/admin/leads?${qs}`;
}

export function parseVoiceCommand(rawTranscript: string): VoiceCommandResult {
  const transcript = rawTranscript.trim();
  if (!transcript) return { type: "unrecognized" };
  const lower = transcript.toLowerCase();

  if (FOLLOWUP_NONE.test(lower)) return { type: "navigate", url: toLeadsUrl({ followup: "none" }) };
  if (FOLLOWUP_OVERDUE.test(lower)) return { type: "navigate", url: toLeadsUrl({ followup: "overdue" }) };
  if (FOLLOWUP_UPCOMING.test(lower)) return { type: "navigate", url: toLeadsUrl({ followup: "upcoming" }) };
  if (FOLLOWUP_TODAY_RE.test(lower)) return { type: "navigate", url: toLeadsUrl({ followup: "today" }) };

  if (STATUS_QUALIFIED.test(lower)) return { type: "navigate", url: toLeadsUrl({ status: "Qualified" }) };
  if (STATUS_NEW.test(lower)) return { type: "navigate", url: toLeadsUrl({ status: "New" }) };
  if (MOTIVATION_HOT.test(lower)) return { type: "navigate", url: toLeadsUrl({ motivation: "Hot" }) };
  if (MOTIVATION_WARM.test(lower)) return { type: "navigate", url: toLeadsUrl({ motivation: "Warm" }) };
  if (MOTIVATION_COLD.test(lower)) return { type: "navigate", url: toLeadsUrl({ motivation: "Cold" }) };

  const searchMatch = transcript.match(SEARCH_PREFIX);
  if (searchMatch && searchMatch[1]?.trim()) {
    return { type: "navigate", url: toLeadsUrl({ search: searchMatch[1].trim() }) };
  }

  // Nothing matched a known command — treat the whole utterance as a plain
  // name/address lookup, e.g. just saying "Michael Johnson" or "5679
  // Clyattville Lake Park Road".
  return { type: "navigate", url: toLeadsUrl({ search: transcript }) };
}
