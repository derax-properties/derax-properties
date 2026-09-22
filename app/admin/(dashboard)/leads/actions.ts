"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAdminProfile } from "@/lib/supabase/profile";
import type { PipelineStage, DeadReason } from "@/lib/types";

/**
 * Moves a lead to the next pipeline stage — the one real action behind the
 * Kanban board's "Advance" buttons. Deliberately narrow: it only ever
 * touches `pipeline_stage`, the same column the board already groups by,
 * so it's consistent with editing pipeline_stage any other way (e.g. the
 * lead detail page's own form via updateLead in leads/[id]/actions.ts).
 *
 * Every stage change is logged to activity_log with the previous stage, the
 * new stage, and who made the change — the pipeline's own audit trail,
 * separate from (and never overwriting) the lead's other data.
 */
export async function advanceLeadStage(id: string, toStage: PipelineStage) {
  const supabase = createServerSupabaseClient();
  const profile = await getCurrentAdminProfile();

  const { data: current } = await supabase.from("seller_submissions").select("pipeline_stage").eq("id", id).maybeSingle();
  const fromStage = current?.pipeline_stage ?? "Pre-Qualified";

  await supabase.from("seller_submissions").update({ pipeline_stage: toStage }).eq("id", id);
  await supabase.from("activity_log").insert({
    seller_submission_id: id,
    actor_id: profile?.id ?? null,
    actor_type: "user",
    action: `Stage changed: ${fromStage} → ${toStage}`,
  });

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin");
}

/**
 * Moves a lead to Dead / Lost. A reason is required (per the pipeline
 * correction: "when moving a lead to Dead/Lost, require a reason") so the
 * activity log and any later review always show WHY a lead was dropped,
 * not just that it was. Nothing else about the lead is touched or deleted —
 * reopenLead below can bring it back into the active pipeline at any time.
 */
export async function markLeadDead(id: string, reason: DeadReason | string, note: string | null) {
  const supabase = createServerSupabaseClient();
  const profile = await getCurrentAdminProfile();

  const { data: current } = await supabase.from("seller_submissions").select("pipeline_stage").eq("id", id).maybeSingle();
  const fromStage = current?.pipeline_stage ?? "Pre-Qualified";

  await supabase
    .from("seller_submissions")
    .update({ pipeline_stage: "Dead / Lost", dead_reason: reason, dead_reason_note: note?.trim() || null })
    .eq("id", id);

  await supabase.from("activity_log").insert({
    seller_submission_id: id,
    actor_id: profile?.id ?? null,
    actor_type: "user",
    action: `Stage changed: ${fromStage} → Dead / Lost (${reason})${note ? ` — ${note}` : ""}`,
  });

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin");
}

/**
 * Brings a Dead/Lost lead back into the active pipeline. Clears the dead
 * reason (it no longer applies) but leaves everything else — notes,
 * underwriting, comps, activity history — exactly as it was.
 */
export async function reopenLead(id: string, toStage: PipelineStage = "Contacted") {
  const supabase = createServerSupabaseClient();
  const profile = await getCurrentAdminProfile();

  await supabase
    .from("seller_submissions")
    .update({ pipeline_stage: toStage, dead_reason: null, dead_reason_note: null })
    .eq("id", id);

  await supabase.from("activity_log").insert({
    seller_submission_id: id,
    actor_id: profile?.id ?? null,
    actor_type: "user",
    action: `Lead reopened: Dead / Lost → ${toStage}`,
  });

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin");
}
