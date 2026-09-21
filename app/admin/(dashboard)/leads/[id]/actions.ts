"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPopulationForZip } from "@/lib/population";
import { REPAIR_CATEGORIES } from "@/lib/types";
import { estimateRepairsWithAI } from "@/lib/aiRepairEstimate";

export async function updateLead(id: string, formData: FormData) {
  const status = formData.get("status");
  const notes = formData.get("notes");
  const assigned_to = formData.get("assigned_to");
  const pipeline_stage = formData.get("pipeline_stage");
  const motivation_level = formData.get("motivation_level");
  const lead_source = formData.get("lead_source");
  const lead_type = formData.get("lead_type");
  const best_callback_time = formData.get("best_callback_time");
  const motivation_override = formData.get("motivation_override");
  const dead_reason = formData.get("dead_reason");
  const dead_reason_note = formData.get("dead_reason_note");

  const supabase = createServerSupabaseClient();

  const payload: Record<string, unknown> = {};
  if (typeof status === "string" && status) payload.status = status;
  if (typeof notes === "string") payload.notes = notes;
  if (typeof assigned_to === "string") payload.assigned_to = assigned_to || null;
  if (typeof pipeline_stage === "string" && pipeline_stage) payload.pipeline_stage = pipeline_stage;
  if (typeof motivation_level === "string" && motivation_level) payload.motivation_level = motivation_level;
  // A checkbox only appears in FormData when checked, so its absence means false.
  payload.motivation_override = motivation_override === "true";
  if (typeof lead_source === "string" && lead_source) payload.lead_source = lead_source;
  if (typeof lead_type === "string" && lead_type) payload.lead_type = lead_type;
  if (typeof best_callback_time === "string") payload.best_callback_time = best_callback_time || null;
  if (typeof dead_reason === "string") payload.dead_reason = dead_reason || null;
  if (typeof dead_reason_note === "string") payload.dead_reason_note = dead_reason_note.trim() || null;

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

/**
 * Saves the itemized repair checklist (Roof, HVAC, Foundation, Electrical,
 * Kitchen, etc.) for a lead and rolls the categories up into the single
 * `repair_estimate` number the Underwriting Snapshot and MAO calculation
 * already read — so filling in the breakdown here is what actually moves
 * "Repairs" on the snapshot, rather than being a second, disconnected total
 * someone would have to re-enter by hand.
 *
 * Reads every `repair_<category>` field actually present in the form —
 * not just REPAIR_CATEGORIES — so a category the admin added by hand via
 * "+ Add Repair Item" (rendered as its own repair_<name> field once it
 * already has a saved row) is preserved and re-totaled exactly like a
 * built-in one. A brand-new custom item comes through the reserved
 * `repair_new_name` / `repair_new_cost` / `repair_new_notes` fields.
 */
export async function updateRepairItems(id: string, formData: FormData) {
  const supabase = createServerSupabaseClient();

  const rows: { seller_submission_id: string; category: string; cost: number; source: "manual"; notes: string | null; updated_at: string }[] = [];
  const seen = new Set<string>();

  for (const [key, raw] of formData.entries()) {
    if (!key.startsWith("repair_") || key.startsWith("repair_new_")) continue;
    const category = key.slice("repair_".length);
    if (seen.has(category)) continue;
    seen.add(category);
    const cost = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : 0;
    const notesRaw = formData.get(`repair_notes_${category}`);
    rows.push({
      seller_submission_id: id,
      category,
      cost: Number.isFinite(cost) ? cost : 0,
      source: "manual",
      notes: typeof notesRaw === "string" && notesRaw.trim() ? notesRaw.trim() : null,
      updated_at: new Date().toISOString(),
    });
  }

  const newName = formData.get("repair_new_name");
  if (typeof newName === "string" && newName.trim()) {
    const newCostRaw = formData.get("repair_new_cost");
    const newCost = typeof newCostRaw === "string" && newCostRaw.trim() !== "" ? Number(newCostRaw) : 0;
    const newNotes = formData.get("repair_new_notes");
    rows.push({
      seller_submission_id: id,
      category: newName.trim(),
      cost: Number.isFinite(newCost) ? newCost : 0,
      source: "manual",
      notes: typeof newNotes === "string" && newNotes.trim() ? newNotes.trim() : null,
      updated_at: new Date().toISOString(),
    });
  }

  if (rows.length) {
    await supabase.from("repair_items").upsert(rows, { onConflict: "seller_submission_id,category" });
  }

  const total = rows.reduce((sum, r) => sum + r.cost, 0);
  await supabase
    .from("seller_submissions")
    .update({ repair_estimate: total, underwriting_updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath(`/admin/leads/${id}`);
}

/**
 * "Estimate with AI": a real Anthropic API call (lib/aiRepairEstimate.ts)
 * that reads only this lead's own stored condition data and suggests a
 * starting cost per repair category. Every value it returns is saved to
 * repair_items tagged source='ai' and rolled into repair_estimate exactly
 * like a manual save — nothing about how it's stored or displayed treats
 * an AI number differently from one an admin typed, except the small
 * "AI estimated" note the lead page shows next to it. The admin can edit
 * any field and re-save (which switches it back to source='manual') before
 * using it for an offer — this is a starting point, never a final number.
 */
export async function estimateRepairsWithAIAction(id: string) {
  const supabase = createServerSupabaseClient();
  const { data: lead } = await supabase.from("seller_submissions").select("*").eq("id", id).single();

  if (!lead) {
    redirect(`/admin/leads/${id}#underwriting`);
  }

  const issues: string[] = [];
  if (lead.foundation_issue) issues.push("Foundation issue reported");
  if (lead.plumbing_issue) issues.push("Plumbing issue reported");
  if (lead.electrical_issue) issues.push("Electrical issue reported");
  if (lead.water_damage) issues.push("Water damage reported");
  if (lead.fire_damage) issues.push("Fire damage reported");
  if (lead.mold) issues.push("Mold reported");
  if (lead.structural_issue) issues.push("Structural issue reported");
  if (lead.roof_condition) issues.push(`Roof condition: ${lead.roof_condition}`);
  if (lead.hvac_condition) issues.push(`HVAC condition: ${lead.hvac_condition}`);

  const result = await estimateRepairsWithAI({
    propertyType: lead.property_type,
    overallCondition: lead.condition ?? null,
    sqft: lead.square_feet ?? null,
    yearBuilt: lead.year_built ?? null,
    issues,
    additionalDetails: lead.additional_details ?? lead.notes ?? null,
  });

  if (!result) {
    redirect(
      `/admin/leads/${id}?error=${encodeURIComponent(
        "AI repair estimate is not available right now — check ANTHROPIC_API_KEY is configured, or fill in the breakdown manually."
      )}#underwriting`
    );
  }

  const rows = REPAIR_CATEGORIES.map((category) => ({
    seller_submission_id: id,
    category,
    cost: result.costs[category] ?? 0,
    source: "ai" as const,
    updated_at: new Date().toISOString(),
  }));

  await supabase.from("repair_items").upsert(rows, { onConflict: "seller_submission_id,category" });

  const total = rows.reduce((sum, r) => sum + r.cost, 0);
  await supabase
    .from("seller_submissions")
    .update({ repair_estimate: total, underwriting_updated_at: new Date().toISOString() })
    .eq("id", id);

  await supabase.from("activity_log").insert({
    seller_submission_id: id,
    actor_id: null,
    actor_type: "ai",
    action: `AI repair estimate generated: $${total.toLocaleString()} total. ${result.summary}`,
  });

  revalidatePath(`/admin/leads/${id}`);
  redirect(`/admin/leads/${id}#underwriting`);
}

/**
 * Comparable sales for the underwriting workspace — one row per comp
 * (lead_comps, migration 0008), never a JSON blob. Manually entered here;
 * `source` stays 'manual' unless/until a property-data API is connected to
 * import comps automatically (see lib/types.ts LeadComp for the honesty
 * rule: never label an invented number as an imported comp).
 */
export async function addComp(sellerSubmissionId: string, formData: FormData) {
  const supabase = createServerSupabaseClient();
  const num = (v: FormDataEntryValue | null) => {
    if (typeof v !== "string" || v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const str = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() ? v.trim() : null);

  const address = formData.get("address");
  if (typeof address !== "string" || !address.trim()) return;

  await supabase.from("lead_comps").insert({
    seller_submission_id: sellerSubmissionId,
    address: address.trim(),
    sale_price: num(formData.get("sale_price")),
    sale_date: str(formData.get("sale_date")),
    bedrooms: num(formData.get("bedrooms")),
    bathrooms: num(formData.get("bathrooms")),
    square_feet: num(formData.get("square_feet")),
    lot_size: str(formData.get("lot_size")),
    distance_miles: num(formData.get("distance_miles")),
    condition: str(formData.get("condition")),
    comp_rating: str(formData.get("comp_rating")),
    notes: str(formData.get("notes")),
    source: "manual",
  });

  revalidatePath(`/admin/leads/${sellerSubmissionId}`);
}

export async function deleteComp(sellerSubmissionId: string, compId: string) {
  const supabase = createServerSupabaseClient();
  await supabase.from("lead_comps").delete().eq("id", compId).eq("seller_submission_id", sellerSubmissionId);
  revalidatePath(`/admin/leads/${sellerSubmissionId}`);
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
