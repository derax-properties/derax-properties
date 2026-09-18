"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateSettings(formData: FormData) {
  const supabase = createServerSupabaseClient();

  const payload = {
    company_name: String(formData.get("company_name") ?? "Derax Properties"),
    phone: String(formData.get("phone") ?? "") || null,
    notification_email: String(formData.get("notification_email") ?? "info@deraxproperties.com"),
    facebook_url: String(formData.get("facebook_url") ?? "") || null,
    instagram_url: String(formData.get("instagram_url") ?? "") || null,
    linkedin_url: String(formData.get("linkedin_url") ?? "") || null,
    youtube_url: String(formData.get("youtube_url") ?? "") || null,
    updated_at: new Date().toISOString(),
  };

  await supabase.from("site_settings").update(payload).eq("id", true);

  revalidatePath("/admin/settings");
  revalidatePath("/");
  redirect("/admin/settings?saved=1");
}
