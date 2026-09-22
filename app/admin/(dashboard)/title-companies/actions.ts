"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAdminProfile, isOwnerOrAdmin } from "@/lib/supabase/profile";

export async function createTitleCompany(formData: FormData) {
  const supabase = createServerSupabaseClient();
  const states = String(formData.get("states_covered") ?? "")
    .split(/[,\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  await supabase.from("title_companies").insert({
    company_name: String(formData.get("company_name") ?? "").trim(),
    contact_name: String(formData.get("contact_name") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    states_covered: states,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  revalidatePath("/admin/title-companies");
}

export async function updateTitleCompanyStatus(id: string, status: "Active" | "Inactive") {
  const supabase = createServerSupabaseClient();
  await supabase.from("title_companies").update({ status }).eq("id", id);
  revalidatePath("/admin/title-companies");
}

/**
 * Full edit of an existing title company's details — separate from the
 * status toggle above, since a typo in the name/contact/phone previously
 * had no fix short of a direct database edit.
 */
export async function updateTitleCompany(id: string, formData: FormData) {
  const supabase = createServerSupabaseClient();
  const states = String(formData.get("states_covered") ?? "")
    .split(/[,\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  await supabase
    .from("title_companies")
    .update({
      company_name: String(formData.get("company_name") ?? "").trim(),
      contact_name: String(formData.get("contact_name") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      states_covered: states,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .eq("id", id);

  revalidatePath("/admin/title-companies");
}

/**
 * Permanently deletes a title company. A deal already assigned to this
 * company is NOT deleted (deals.title_company_id is `on delete set null`);
 * the deal just loses its link back to this company.
 *
 * Restricted to Owner/Admin, mirroring the "Owners/Admins delete title
 * companies" RLS policy — this check just fails fast with a clear no-op
 * instead of a DB error; RLS is the real backstop either way.
 */
export async function deleteTitleCompany(id: string) {
  const profile = await getCurrentAdminProfile();
  if (!isOwnerOrAdmin(profile)) return;

  const supabase = createServerSupabaseClient();
  await supabase.from("title_companies").delete().eq("id", id);

  revalidatePath("/admin/title-companies");
}
