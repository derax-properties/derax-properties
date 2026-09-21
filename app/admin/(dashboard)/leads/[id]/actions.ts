"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPopulationForZip } from "@/lib/population";

export async function updateLead(id: string, formData: FormData) {
  const status = formData.get("status");
  const notes = formData.get("notes");
  const assigned_to = formData.get("assigned_to");
  const pipeline_stage = formData.get("pipeline_stage");
  const motivation_level = formData.get("motivation_level");
  const lead_source = formData.get("lead_source");
  const lead_type = formData.get("lead_type");
  const best_callback_time = formData.get("best_callback_time");

  const supabase = createServerSupabaseClient();

  const payload: Record<string, unknown> = {};
  if (typeof status === "string" && status) payload.status = status;
  if (typeof notes === "string") payload.notes = notes;
  if (typeof assigned_to === "string") payload.assigned_to = assigned_to || null;
  if (typeof pipeline_stage === "string" && pipeline_stage) payload.pipeline_stage = pipeline_stage;
  if (typeof motivation_level === "string" && motivation_level) payload.motivation_level = motivation_level;
  if (typeof lead_source === "string" && lead_source) payload.lead_source = lead_source;
  if (typeof lead_type === "string" && lead_type) payload.lead_type = lead_type;
  if (typeof best_callback_time === "string") payload.best_callback_time = best_callback_time || null;

  await supabase.from("seller_submissions").update(payload).eq("id", id);
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}

/**
 * Logs a note to activity_log without changing any lead field — used for a
 * plain "called the seller" / "left voicemail" style entry, kept distinct
 * from the lead's own status/notes fields per the plan's rule that activity
 * history is its own append-only record, not folded into `notes`.
 */
/**
 * "AI Location Insight": a short, honestly-labeled note built from the
 * population lookup and the lead's own numbers — a rule-based summary, not
 * a live LLM call (none is configured in this environment). It only ever
 * adds supplementary context to the activity log; it never changes any
 * lead field or feeds into buyer matching.
 */
export async function generateLocationInsight(sellerSubmissionId: string, zip: string) {
  const population = await getPopulationForZip(zip);

  let note: string;
  if (population.lookup_failed || population.population == null) {
    note = `AI Location Insight: population data for ZIP ${zip} is unavailable right now — no insight generated.`;
  } else {
    const size =
      population.population < 5000 ? "a small, low-density area" : population.population < 25000 ? "a mid-sized community" : "a densely populated area";
    note = `AI Location Insight: ZIP ${zip} has an estimated population of ${population.population.toLocaleString()} (${population.data_source}${
      population.data_year ? `, ${population.data_year}` : ""
    }) — ${size}. Informational only; verify against local market data before making offer decisions.`;
  }

  const supabase = createServerSupabaseClient();
  await supabase.from("activity_log").insert({
    seller_submission_id: sellerSubmissionId,
    actor_id: null,
    actor_type: "ai",
    action: note,
  });

  revalidatePath(`/admin/leads/${sellerSubmissionId}`);
}

/**
 * Saves the lead-level underwriting inputs (ARV, repairs, comps note, and
 * a manually-judged recommended offer). The Maximum Allowable Offer itself
 * is never stored — it's derived from these numbers via calculateMAO() at
 * render time, so it can never drift out of sync with what's saved here.
 */
export async function updateUnderwriting(id: string, formData: FormData) {
  const arv = formData.get("arv_estimate");
  const repairs = formData.get("repair_estimate");
  const multiplier = formData.get("mao_multiplier");
  const recommended = formData.get("recommended_offer");
  const compsNote = formData.get("comps_note");

  const toNumberOrNull = (v: FormDataEntryValue | null) => {
    if (typeof v !== "string" || v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const supabase = createServerSupabaseClient();
  await supabase
    .from("seller_submissions")
    .update({
      arv_estimate: toNumberOrNull(arv),
      repair_estimate: toNumberOrNull(repairs),
      mao_multiplier: toNumberOrNull(multiplier) ?? 0.7,
      recommended_offer: toNumberOrNull(recommended),
      comps_note: typeof compsNote === "string" ? compsNote.trim() || null : null,
      underwriting_updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(`/admin/leads/${id}`);
}

export async function logActivity(sellerSubmissionId: string, actorId: string | null, action: string) {
  const supabase = createServerSupabaseClient();
  await supabase.from("activity_log").insert({
    seller_submission_id: sellerSubmissionId,
    actor_id: actorId,
    actor_type: "user",
    action,
  });
  revalidatePath(`/admin/leads/${sellerSubmissionId}`);
}
