import { createServerSupabaseClient } from "./server";
import type { AdminProfile } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

/**
 * Fetches the signed-in user's admin_profiles row (id, name, role). Used to
 * decide what the dashboard nav shows and to gate owner/admin-only actions
 * like inviting or removing teammates. Returns null if signed out or if the
 * auth user has no matching profile row.
 *
 * Pass `knownUser` when the caller already fetched `auth.getUser()` in the
 * same request (the admin layout does, for the topbar email) — this avoids
 * a second, redundant Supabase Auth round-trip on every single page
 * navigation, which was previously happening on every admin page load.
 */
export async function getCurrentAdminProfile(knownUser?: User | null): Promise<AdminProfile | null> {
  const supabase = createServerSupabaseClient();
  let user = knownUser;
  if (user === undefined) {
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser();
    user = fetchedUser;
  }
  if (!user) return null;

  const { data } = await supabase
    .from("admin_profiles")
    .select("id, full_name, role, invited_by, invited_at, deactivated_at, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) return null;
  return { ...data, email: user.email ?? null } as AdminProfile;
}

export function isOwnerOrAdmin(profile: AdminProfile | null): boolean {
  return profile?.role === "owner" || profile?.role === "admin";
}
