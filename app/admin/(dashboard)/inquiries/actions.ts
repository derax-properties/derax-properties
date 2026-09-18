"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateInquiryStatus(id: string, status: string) {
  const supabase = createServerSupabaseClient();
  await supabase.from("investor_inquiries").update({ status }).eq("id", id);
  revalidatePath("/admin/inquiries");
}
