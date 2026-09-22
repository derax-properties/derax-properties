"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAdminProfile } from "@/lib/supabase/profile";

/**
 * VA lead intake. Deliberately narrow: a VA captures the seller's basic
 * info, property basics, and a qualification note — never underwriting,
 * comps, or offer numbers. The RLS policy "VAs can insert intake leads"
 * (migration 0004) is what actually enforces this at the database layer;
 * this action just collects the fields the plan scopes to a VA.
 */
export async function submitVaLead(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  if (!profile || profile.role !== "va") {
    redirect("/agent-intake/login");
  }

  const supabase = createServerSupabaseClient();

  const property_address = String(formData.get("property_address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const zip = String(formData.get("zip") ?? "").trim();

  if (!property_address || !city || !state || !zip) {
    redirect(
      `/agent-intake?error=${encodeURIComponent("Please search for and select the property address from the suggestions.")}`
    );
  }

  const formatted_address = String(formData.get("formatted_address") ?? "").trim() || null;
  const county = String(formData.get("county") ?? "").trim() || null;
  const place_id = String(formData.get("place_id") ?? "").trim() || null;
  const address_confidence = String(formData.get("address_confidence") ?? "").trim() || null;
  const latRaw = formData.get("latitude");
  const lngRaw = formData.get("longitude");
  const latitude = typeof latRaw === "string" && latRaw !== "" && Number.isFinite(Number(latRaw)) ? Number(latRaw) : null;
  const longitude = typeof lngRaw === "string" && lngRaw !== "" && Number.isFinite(Number(lngRaw)) ? Number(lngRaw) : null;

  const payload = {
    first_name: String(formData.get("first_name") ?? "").trim(),
    last_name: String(formData.get("last_name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim() || null,
    preferred_contact: String(formData.get("preferred_contact") ?? "Phone"),
    owner_status: String(formData.get("owner_status") ?? "Yes"),
    property_address,
    city,
    state,
    zip,
    county,
    formatted_address,
    latitude,
    longitude,
    place_id,
    address_confidence,
    property_type: String(formData.get("property_type") ?? "Single Family"),
    condition: String(formData.get("condition") ?? "").trim() || "Not assessed yet",
    selling_reason: String(formData.get("selling_reason") ?? "").trim() || "Not stated",
    timeline: String(formData.get("timeline") ?? "").trim() || "Unknown",
    best_contact_time: String(formData.get("best_contact_time") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    lead_source: "VA Entry",
    lead_type: "Other",
    created_by: profile.id,
  };

  const { error } = await supabase.from("seller_submissions").insert(payload);

  if (error) {
    redirect(`/agent-intake?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/agent-intake?success=1");
}

export async function vaSignOut() {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/agent-intake/login");
}
