import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sellerSubmissionSchema } from "@/lib/validation";
import { sendSellerLeadNotification, sendSellerConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = sellerSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const d = parsed.data;

  try {
    const supabase = createAdminSupabaseClient();

    // Duplicate flagging: never silently merge or drop a new submission —
    // it's always saved as its own lead. If it matches an existing one by
    // phone, email, or the exact parsed address, we just link the two so
    // an admin can review and decide (see migration 0001).
    const orFilters = [`phone.eq.${d.phone}`];
    if (d.email) orFilters.push(`email.eq.${d.email}`);
    if (d.formatted_address) orFilters.push(`formatted_address.eq.${d.formatted_address}`);

    const { data: possibleDuplicate } = await supabase
      .from("seller_submissions")
      .select("id")
      .or(orFilters.join(","))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await supabase
      .from("seller_submissions")
      .insert({
        possible_duplicate_of: possibleDuplicate?.id ?? null,
        first_name: d.first_name,
        last_name: d.last_name,
        phone: d.phone,
        email: d.email || null,
        preferred_contact: d.preferred_contact,
        owner_status: d.owner_status,
        owner_relationship: d.owner_relationship || null,

        property_address: d.property_address,
        city: d.city,
        state: d.state.toUpperCase(),
        zip: d.zip,
        county: d.county || null,
        formatted_address: d.formatted_address,
        latitude: Number.isFinite(d.latitude) ? d.latitude : null,
        longitude: Number.isFinite(d.longitude) ? d.longitude : null,
        place_id: d.place_id || null,
        address_country: d.address_country || "US",
        address_confidence: d.address_confidence || null,
        property_type: d.property_type,
        bedrooms: Number.isFinite(d.bedrooms) ? d.bedrooms : null,
        bathrooms: Number.isFinite(d.bathrooms) ? d.bathrooms : null,
        square_feet: Number.isFinite(d.square_feet) ? d.square_feet : null,
        year_built: Number.isFinite(d.year_built) ? d.year_built : null,

        condition: d.condition,
        roof_condition: d.roof_condition || null,
        hvac_condition: d.hvac_condition || null,
        foundation_issue: !!d.foundation_issue,
        plumbing_issue: !!d.plumbing_issue,
        electrical_issue: !!d.electrical_issue,
        water_damage: !!d.water_damage,
        fire_damage: !!d.fire_damage,
        mold: !!d.mold,
        structural_issue: !!d.structural_issue,
        additional_details: d.additional_details || null,

        selling_reason: d.selling_reason,
        timeline: d.timeline,
        asking_price: d.asking_price || null,
        best_contact_time: d.best_contact_time || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Best-effort notifications — never block the seller's confirmation on email.
    await Promise.allSettled([
      sendSellerLeadNotification(data),
      sendSellerConfirmationEmail(data),
    ]);

    return NextResponse.json({
      success: true,
      id: data.id,
      reference_number: data.reference_number,
    });
  } catch (error) {
    console.error("[api/seller-submissions] Failed to save submission:", error);
    return NextResponse.json(
      {
        error:
          "We couldn't save your submission just now. Please try again, or email info@deraxproperties.com directly.",
      },
      { status: 500 }
    );
  }
}
