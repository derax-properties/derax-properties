"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getCurrentAdminProfile, isOwnerOrAdmin } from "@/lib/supabase/profile";
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/validation";
import { LEAD_TYPES, type LeadType } from "@/lib/types";

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

  if (!property_address || !city || !state || !zip) {
    redirect("/admin/leads/new?error=" + encodeURIComponent("Please fill in every required field."));
  }

  const toNumberOrNull = (v: FormDataEntryValue | null) => {
    if (typeof v !== "string" || v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const submittedLeadType = String(formData.get("lead_type") ?? "").trim();
  const lead_type: LeadType | null = (LEAD_TYPES as readonly string[]).includes(submittedLeadType)
    ? (submittedLeadType as LeadType)
    : null;

  const payload = {
    first_name: first_name || null,
    last_name: last_name || null,
    phone: phone || null,
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
    current_value: toNumberOrNull(formData.get("current_value")),
    mortgage_balance: toNumberOrNull(formData.get("mortgage_balance")),
    lead_source: "Self-Entered" as const,
    lead_type,
    created_by: profile.id,
  };

  const { data, error } = await supabase.from("seller_submissions").insert(payload).select("id").single();

  if (error || !data) {
    redirect("/admin/leads/new?error=" + encodeURIComponent(error?.message ?? "Could not save this lead."));
  }

  // Photos are optional and best-effort: a failed photo upload should never
  // block the lead itself from being saved (the lead is already inserted
  // above). Reuses the exact same bucket/table as the public website's
  // upload route (app/api/seller-submissions/[id]/uploads/route.ts) so
  // these show up in the same "Photos" panel on the lead page either way.
  const photoFiles = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (photoFiles.length > 0 && data) {
    const adminSupabase = createAdminSupabaseClient();
    const bucket = process.env.SUPABASE_SELLER_PHOTOS_BUCKET || "seller-photos";

    for (const file of photoFiles) {
      if (file.size > MAX_FILE_SIZE_BYTES || !ALLOWED_IMAGE_TYPES.includes(file.type)) continue;
      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `${data.id}/${Date.now()}-${safeName}`;
        const arrayBuffer = await file.arrayBuffer();
        const { error: uploadError } = await adminSupabase.storage
          .from(bucket)
          .upload(storagePath, Buffer.from(arrayBuffer), { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        await adminSupabase.from("seller_property_photos").insert({ submission_id: data.id, storage_path: storagePath });
      } catch (photoError) {
        console.error("[leads/new] Photo upload failed:", photoError);
      }
    }
  }

  redirect(`/admin/leads/${data.id}`);
}
