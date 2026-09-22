"use server";

import { redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function acceptInvite(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    redirect(`/admin/accept-invite/${token}?error=${encodeURIComponent("Password must be at least 8 characters.")}`);
  }
  if (password !== confirmPassword) {
    redirect(`/admin/accept-invite/${token}?error=${encodeURIComponent("Passwords don't match.")}`);
  }

  const admin = createAdminSupabaseClient();

  const { data: invitation, error: lookupError } = await admin
    .from("admin_invitations")
    .select("*")
    .eq("token", token)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (lookupError || !invitation) {
    redirect(`/admin/accept-invite/${token}?error=${encodeURIComponent("This invitation is invalid or has expired.")}`);
  }

  const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
    email: invitation!.email,
    password,
    email_confirm: true,
  });

  if (createError || !createdUser.user) {
    // Already-registered is a common case here: someone re-clicks the
    // one-time invite email as if it were a bookmark. Rather than leaving
    // them stuck re-submitting the "create account" form, take them
    // straight to the real sign-in page for their role with a clear note.
    if (createError?.message?.includes("already registered")) {
      const loginPath = invitation!.role === "va" ? "/agent-intake/login" : "/admin/login";
      redirect(
        `${loginPath}?error=${encodeURIComponent("You already have an account for this email — sign in below instead.")}`
      );
    }
    redirect(
      `/admin/accept-invite/${token}?error=${encodeURIComponent("Could not create the account. Please try again.")}`
    );
  }

  await admin.from("admin_profiles").insert({
    id: createdUser!.user.id,
    full_name: invitation!.full_name,
    role: invitation!.role,
    invited_by: invitation!.invited_by,
    invited_at: invitation!.created_at,
  });

  await admin.from("admin_invitations").update({ accepted_at: new Date().toISOString() }).eq("id", invitation!.id);

  // Sign the new user in immediately so they land straight in the right
  // surface: a VA goes to the intake tool, everyone else to the full CRM.
  const supabase = createServerSupabaseClient();
  await supabase.auth.signInWithPassword({ email: invitation!.email, password });

  redirect(invitation!.role === "va" ? "/agent-intake" : "/admin");
}
