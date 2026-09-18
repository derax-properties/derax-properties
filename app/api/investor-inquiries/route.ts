import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { investorInquirySchema } from "@/lib/validation";
import { sendInvestorInquiryNotification } from "@/lib/email";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = investorInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("investor_inquiries")
      .insert({
        property_id: parsed.data.property_id || null,
        property_title: parsed.data.property_title || null,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email,
        company: parsed.data.company || null,
        investor_type: parsed.data.investor_type || null,
        message: parsed.data.message,
      })
      .select()
      .single();

    if (error) throw error;

    await sendInvestorInquiryNotification(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/investor-inquiries] Failed to save inquiry:", error);
    return NextResponse.json(
      { error: "Something went wrong on our end. Please try again or email us directly." },
      { status: 500 }
    );
  }
}
