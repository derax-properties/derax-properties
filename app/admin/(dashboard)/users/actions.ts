"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getCurrentAdminProfile, isOwnerOrAdmin } from "@/lib/supabase/profile";
import { sendAdminInviteEmail } from "@/lib/email";
import type { AdminInvitation } from "@/lib/types";

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  full_name: z.string().optional().or(z.literal("")),
  role: z.enum(["owner", "admin", "va"]),
});

/**
 * Creates an invitation row and emails the invite link. Never creates the
 * Supabase auth user or admin_profiles row directly — that only happens
 * when the invitee actually accepts (see app/admin/accept-invite).
 */
export async function inviteUser(formData: FormData): Promise<void> {
  const profile = await getCurrentAdminProfile();
  if (!isOwnerOrAdmin(profile)) {
    redirect(`/admin/users?error=${encodeURIComponent("Only Owners and Admins can invite teammates.")}`);
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    full_name: formData.get("full_name"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    redirect(`/admin/users?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid invitation details.")}`);
  }

  const supabase = createServerSupabaseClient();
  const email = parsed.data.email.toLowerCase();

  // (Whether this email already has an active account is checked again,
  // authoritatively, when the invite is accepted — see accept-invite/actions.ts.)

  // Re-inviting the same email updates their still-pending invitation
  // instead of creating a second row (see the partial unique index).
  const { data: pending } = await supabase
    .from("admin_invitations")
    .select("id")
    .eq("email", email)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .maybeSingle();

  const row = {
    email,
    full_name: parsed.data.full_name || null,
    role: parsed.data.role,
    invited_by: profile!.id,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const { data: invitation, error } = pending
    ? await supabase.from("admin_invitations").update(row).eq("id", pending.id).select("*").single()
    : await supabase.from("admin_invitations").insert(row).select("*").single();

  if (error || !invitation) {
    redirect(`/admin/users?error=${encodeURIComponent("Could not create the invitation. Please try again.")}`);
  }

  await sendAdminInviteEmail(invitation as AdminInvitation);
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function revokeInvitation(invitationId: string) {
  const profile = await getCurrentAdminProfile();
  if (!isOwnerOrAdmin(profile)) return;

  const supabase = createServerSupabaseClient();
  await supabase
    .from("admin_invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", invitationId);

  revalidatePath("/admin/users");
}

/**
 * Soft-disable: the account can no longer sign in effectively (checked in
 * middleware/layout), but every lead, deal, and activity-log entry they
 * ever touched stays exactly as it is. This is the preferred way to remove
 * a VA — full removal below is for when the account should be fully gone.
 */
export async function deactivateUser(userId: string) {
  const profile = await getCurrentAdminProfile();
  if (!isOwnerOrAdmin(profile)) return;
  if (profile!.id === userId) return; // can't deactivate yourself

  const supabase = createServerSupabaseClient();
  await supabase
    .from("admin_profiles")
    .update({ deactivated_at: new Date().toISOString() })
    .eq("id", userId);

  revalidatePath("/admin/users");
}

export async function reactivateUser(userId: string) {
  const profile = await getCurrentAdminProfile();
  if (!isOwnerOrAdmin(profile)) return;

  const supabase = createServerSupabaseClient();
  await supabase.from("admin_profiles").update({ deactivated_at: null }).eq("id", userId);
  revalidatePath("/admin/users");
}

/**
 * Fully removes the auth user (and, by cascade, their admin_profiles row).
 * Every lead/deal/activity-log row that referenced them falls back to
 * unassigned/null rather than being deleted — see migration 0001.
 */
export async function removeUser(userId: string): Promise<void> {
  const profile = await getCurrentAdminProfile();
  if (!isOwnerOrAdmin(profile)) {
    redirect(`/admin/users?error=${encodeURIComponent("Not authorized.")}`);
  }
  if (profile!.id === userId) {
    redirect(`/admin/users?error=${encodeURIComponent("You can't remove your own account.")}`);
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    redirect(`/admin/users?error=${encodeURIComponent("Could not remove this user.")}`);
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}
