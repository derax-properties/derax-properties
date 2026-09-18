"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateLead(id: string, formData: FormData) {
  const status = formData.get("status");
  const notes = formData.get("notes");
  const assigned_to = formData.get("assigned_to");

  const supabase = createServerSupabaseClient();

  const payload: Record<string, unknown> = {};
  if (typeof status === "string" && status) payload.status = status;
  if (typeof notes === "string") payload.notes = notes;
  if (typeof assigned_to === "string") payload.assigned_to = assigned_to || null;

  await supabase.from("seller_submissions").update(payload).eq("id", id);
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}
