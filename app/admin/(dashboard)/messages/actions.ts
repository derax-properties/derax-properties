"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateMessageStatus(id: string, status: string) {
  const supabase = createServerSupabaseClient();
  await supabase.from("contact_messages").update({ status }).eq("id", id);
  revalidatePath("/admin/messages");
}
