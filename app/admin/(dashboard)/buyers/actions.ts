"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAdminProfile, isOwnerOrAdmin } from "@/lib/supabase/profile";

export async function createBuyer(formData: FormData) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("cash_buyers")
    .insert({
      full_name: String(formData.get("full_name") ?? "").trim(),
      company_name: String(formData.get("company_name") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      buyer_type: String(formData.get("buyer_type") ?? "") || null,
      proof_of_funds_on_file: formData.get("proof_of_funds_on_file") === "on",
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .select("id")
    .single();

  if (error || !data) return;

  revalidatePath("/admin/buyers");
  redirect(`/admin/buyers/${data.id}`);
}

export async function updateBuyer(buyerId: string, formData: FormData) {
  const supabase = createServerSupabaseClient();
  await supabase
    .from("cash_buyers")
    .update({
      full_name: String(formData.get("full_name") ?? "").trim(),
      company_name: String(formData.get("company_name") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      buyer_type: String(formData.get("buyer_type") ?? "") || null,
      proof_of_funds_on_file: formData.get("proof_of_funds_on_file") === "on",
      status: String(formData.get("status") ?? "Active"),
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .eq("id", buyerId);

  revalidatePath(`/admin/buyers/${buyerId}`);
  revalidatePath("/admin/buyers");
}

/**
 * Bulk ZIP entry: accepts a comma/space/newline-separated blob (as pasted
 * from a spreadsheet) and stores each 5-digit ZIP as its own row — never
 * one combined string — skipping ones the buyer already has.
 */
export async function addBuyerZips(buyerId: string, formData: FormData) {
  const raw = String(formData.get("zips") ?? "");
  const zips = Array.from(new Set(raw.split(/[\s,]+/).map((z) => z.trim()).filter((z) => /^\d{5}$/.test(z))));

  if (zips.length > 0) {
    const supabase = createServerSupabaseClient();
    await supabase
      .from("buyer_zip_codes")
      .upsert(
        zips.map((zip) => ({ buyer_id: buyerId, zip })),
        { onConflict: "buyer_id,zip", ignoreDuplicates: true }
      );
  }

  revalidatePath(`/admin/buyers/${buyerId}`);
}

export async function removeBuyerZip(buyerId: string, zipRowId: string) {
  const supabase = createServerSupabaseClient();
  await supabase.from("buyer_zip_codes").delete().eq("id", zipRowId);
  revalidatePath(`/admin/buyers/${buyerId}`);
}

export async function addBuyerCriteria(buyerId: string, formData: FormData) {
  const supabase = createServerSupabaseClient();

  const toNumberOrNull = (key: string) => {
    const v = formData.get(key);
    if (typeof v !== "string" || v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  await supabase.from("buyer_investment_criteria").insert({
    buyer_id: buyerId,
    property_type: String(formData.get("property_type") ?? "") || null,
    min_price: toNumberOrNull("min_price"),
    max_price: toNumberOrNull("max_price"),
    min_bedrooms: toNumberOrNull("min_bedrooms"),
    min_bathrooms: toNumberOrNull("min_bathrooms"),
    min_sqft: toNumberOrNull("min_sqft"),
    max_repair_budget: toNumberOrNull("max_repair_budget"),
    preferred_strategy: String(formData.get("preferred_strategy") ?? "") || null,
  });

  revalidatePath(`/admin/buyers/${buyerId}`);
}

/**
 * Edits an existing criteria row in place, instead of forcing a
 * remove-and-re-add for a simple correction (e.g. fixing a min price typo).
 */
export async function updateBuyerCriteria(buyerId: string, criteriaId: string, formData: FormData) {
  const supabase = createServerSupabaseClient();

  const toNumberOrNull = (key: string) => {
    const v = formData.get(key);
    if (typeof v !== "string" || v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  await supabase
    .from("buyer_investment_criteria")
    .update({
      property_type: String(formData.get("property_type") ?? "") || null,
      min_price: toNumberOrNull("min_price"),
      max_price: toNumberOrNull("max_price"),
      min_bedrooms: toNumberOrNull("min_bedrooms"),
      min_bathrooms: toNumberOrNull("min_bathrooms"),
      min_sqft: toNumberOrNull("min_sqft"),
      max_repair_budget: toNumberOrNull("max_repair_budget"),
      preferred_strategy: String(formData.get("preferred_strategy") ?? "") || null,
    })
    .eq("id", criteriaId);

  revalidatePath(`/admin/buyers/${buyerId}`);
}

export async function removeBuyerCriteria(buyerId: string, criteriaId: string) {
  const supabase = createServerSupabaseClient();
  await supabase.from("buyer_investment_criteria").delete().eq("id", criteriaId);
  revalidatePath(`/admin/buyers/${buyerId}`);
}

/**
 * Permanently deletes a cash buyer. Their ZIP coverage and investment
 * criteria rows cascade with them (`on delete cascade`). A deal already
 * matched to this buyer is NOT deleted (deals.cash_buyer_id is `on delete
 * set null`); the deal just loses its link back to this buyer.
 *
 * Restricted to Owner/Admin, mirroring the "Owners/Admins delete cash
 * buyers" RLS policy — this check just fails fast with a clear no-op
 * instead of a DB error; RLS is the real backstop either way.
 */
export async function deleteBuyer(id: string) {
  const profile = await getCurrentAdminProfile();
  if (!isOwnerOrAdmin(profile)) return;

  const supabase = createServerSupabaseClient();
  await supabase.from("cash_buyers").delete().eq("id", id);

  revalidatePath("/admin/buyers");
}
