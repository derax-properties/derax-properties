import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { contactMessageSchema } from "@/lib/validation";
import { sendContactMessageNotification } from "@/lib/email";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = contactMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("contact_messages")
      .insert({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        interest: parsed.data.interest,
        message: parsed.data.message,
      })
      .select()
      .single();

    if (error) throw error;

    await sendContactMessageNotification(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/contact] Failed to save message:", error);
    return NextResponse.json(
      { error: "Something went wrong on our end. Please try again or email us directly." },
      { status: 500 }
    );
  }
}
