"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { PipelineStage } from "@/lib/types";

/**
 * Moves a lead to the next pipeline stage — the one real action behind the
 * Kanban board's "Advance" buttons. Deliberately narrow: it only ever
 * touches `pipeline_stage`, the same column the board already groups by,
 * so it's consistent with editing pipeline_stage any other way (e.g. the
 * lead detail page's own form via updateLead in leads/[id]/actions.ts).
 */
export async function advanceLeadStage(id: string, toStage: PipelineStage) {
  const supabase = createServerSupabaseClient();
  await supabase.from("seller_submissions").update({ pipeline_stage: toStage }).eq("id", id);
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin");
}
