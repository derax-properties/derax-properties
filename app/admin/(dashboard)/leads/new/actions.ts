"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAdminProfile, isOwnerOrAdmin } from "@/lib/supabase/profile";

/**
 * Manual lead creation for Admin/Owner — the missing counterpart to the
 * public website form and the VA's /agent-intake link. Same seller_submissions
 * row shape as both of those, just entered directly inside the CRM by staff
 * (e.g. a lead that came in by phone).
 */
export async function createLeadManually(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  if (!profile || !isOwnerOrAdmin(profile)) {
    redirect("/admin/leads/new?error=" + encodeURIComponent("Not authorized."));
  }

  const supabase = createServerSupabaseClient();

  const first_name = String(formData.get("first_name") ?? "").trim();
  const last_name = String(formData.get("last_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const property_address = String(formData.get("property_address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const zip = String(formData.get("zip") ?? "").trim();

  if (!first_name || !last_name || !phone || !property_address || !city || !state || !zip) {
    redirect("/admin/leads/new?error=" + encodeURIComponent("Please fill in every required field."));
  }

  const payload = {
    first_name,
    last_name,
    phone,
    email: String(formData.get("email") ?? "").trim() || null,
    preferred_contact: String(formData.get("preferred_contact") ?? "Phone"),
    owner_status: String(formData.get("owner_status") ?? "Yes"),
    property_address,
    city,
    state,
    zip,
    property_type: String(formData.get("property_type") ?? "Single Family"),
    condition: String(formData.get("condition") ?? "").trim() || "Not assessed yet",
    selling_reason: String(formData.get("selling_reason") ?? "").trim() || "Not stated",
    timeline: String(formData.get("timeline") ?? "").trim() || "Unknown",
    best_contact_time: String(formData.get("best_contact_time") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    lead_source: "Self-Entered" as const,
    lead_type: "Other" as const,
    created_by: profile.id,
  };

  const { data, error } = await supabase.from("seller_submissions").insert(payload).select("id").single();

  if (error || !data) {
    redirect("/admin/leads/new?error=" + encodeURIComponent(error?.message ?? "Could not save this lead."));
  }

  redirect(`/admin/leads/${data.id}`);
}
