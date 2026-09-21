import type { SellerSubmission } from "./types";

export type FollowUpStatus = "Overdue" | "Due Today" | "Upcoming" | "Completed" | "No Follow-Up";

export const FOLLOW_UP_TYPES = ["Call", "SMS", "Email", "Voicemail", "Appointment", "Offer Follow-Up", "Contract Follow-Up", "Other"] as const;
export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number];

/**
 * Follow-up status is computed from `next_follow_up_date` (a DATE, not a
 * timestamp — per the correction, this operates on the day, never a
 * specific time) compared against today, in the CRM's own local sense of
 * "today" rather than the server's UTC day, which can be wrong by one day
 * for anyone west of UTC. `follow_up_completed_at` short-circuits to
 * Completed regardless of the date, since a completed follow-up is done
 * even if the date passed before it was marked complete.
 */
export function getFollowUpStatus(lead: Pick<SellerSubmission, "next_follow_up_date" | "follow_up_completed_at">): FollowUpStatus {
  if (!lead.next_follow_up_date) return "No Follow-Up";
  if (lead.follow_up_completed_at) return "Completed";

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  if (lead.next_follow_up_date < todayStr) return "Overdue";
  if (lead.next_follow_up_date === todayStr) return "Due Today";
  return "Upcoming";
}

export function daysOverdue(nextFollowUpDate: string): number {
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  const due = new Date(nextFollowUpDate + "T00:00:00Z");
  return Math.max(0, Math.round((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
}

/** Local (not UTC) YYYY-MM-DD for "today" / "N days from today" quick-pick buttons. */
export function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
