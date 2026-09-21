import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendDailyFollowupDigest, type DigestLead } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Daily follow-up digest (plan section 6). Triggered by Vercel Cron
 * (see vercel.json — runs once a day) hitting this route with the
 * `Authorization: Bearer $CRON_SECRET` header Vercel adds automatically
 * for scheduled invocations. Never wired to anything user-facing.
 *
 * Idempotent per calendar day via notification_log (migration 0006): if
 * today's row already exists, this returns immediately rather than
 * sending a second email, so a retry or a manual curl against this URL
 * can never double-send.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createAdminSupabaseClient();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC

  const { data: existing } = await supabase
    .from("notification_log")
    .select("id")
    .eq("notification_type", "daily_followup")
    .eq("sent_for_date", today)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ skipped: true, reason: "Already sent today", date: today });
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Three groups of "needs a human today", de-duplicated by id:
  //  1. Explicitly marked "Follow Up"
  //  2. Still "New" and created more than 24h ago (going stale)
  //  3. Motivation "Hot" and not yet Closed / Not a Fit
  const [followUp, staleNew, hot] = await Promise.all([
    supabase
      .from("seller_submissions")
      .select("id, reference_number, first_name, last_name, property_address, city, state, status, motivation_level, created_at")
      .eq("status", "Follow Up"),
    supabase
      .from("seller_submissions")
      .select("id, reference_number, first_name, last_name, property_address, city, state, status, motivation_level, created_at")
      .eq("status", "New")
      .lt("created_at", oneDayAgo),
    supabase
      .from("seller_submissions")
      .select("id, reference_number, first_name, last_name, property_address, city, state, status, motivation_level, created_at")
      .eq("motivation_level", "Hot")
      .not("status", "in", '("Closed","Not a Fit")'),
  ]);

  const byId = new Map<string, DigestLead>();
  for (const group of [followUp.data, staleNew.data, hot.data]) {
    for (const lead of group ?? []) {
      byId.set(lead.id, lead as DigestLead);
    }
  }
  const leads = Array.from(byId.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  await sendDailyFollowupDigest(leads);

  await supabase.from("notification_log").insert({
    notification_type: "daily_followup",
    sent_for_date: today,
    lead_count: leads.length,
  });

  return NextResponse.json({ sent: true, date: today, lead_count: leads.length });
}
