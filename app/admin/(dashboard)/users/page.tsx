import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAdminProfile, isOwnerOrAdmin } from "@/lib/supabase/profile";
import type { AdminInvitation, AdminProfile } from "@/lib/types";
import { deactivateUser, inviteUser, reactivateUser, removeUser, revokeInvitation } from "./actions";

export const metadata = { title: "Users — DERAX CRM" };

const ROLE_LABEL: Record<AdminProfile["role"], string> = {
  owner: "Owner",
  admin: "Admin",
  va: "Virtual Assistant",
};

export default async function UsersPage({ searchParams }: { searchParams: { error?: string } }) {
  const profile = await getCurrentAdminProfile();
  if (!isOwnerOrAdmin(profile)) {
    redirect("/admin");
  }

  const supabase = createServerSupabaseClient();
  const [{ data: profiles }, { data: invitations }] = await Promise.all([
    supabase
      .from("admin_profiles")
      .select("id, full_name, role, invited_at, deactivated_at, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("admin_invitations")
      .select("*")
      .is("accepted_at", null)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Users</h1>
        <p className="mt-1 text-sm text-ink/60">
          Invite VAs and Admins to DERAX CRM. Access is invitation-only — no one can create their
          own account.
        </p>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold text-ink">Invite a teammate</h2>
        <form action={inviteUser} className="mt-4 grid gap-4 sm:grid-cols-[2fr_1.5fr_1fr_auto] sm:items-end">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-ink/80">Email</label>
            <input id="email" name="email" type="email" required className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="full_name" className="text-sm font-medium text-ink/80">Name (optional)</label>
            <input id="full_name" name="full_name" type="text" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="role" className="text-sm font-medium text-ink/80">Role</label>
            <select id="role" name="role" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm">
              <option value="va">Virtual Assistant</option>
              <option value="admin">Admin</option>
              {profile?.role === "owner" && <option value="owner">Owner</option>}
            </select>
          </div>
          <button type="submit" className="focus-gold rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold-light">
            Send Invite
          </button>
        </form>
        {searchParams.error && <p className="mt-3 text-sm font-medium text-red-600">{searchParams.error}</p>}
      </section>

      {invitations && invitations.length > 0 && (
        <section className="rounded-2xl bg-white p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold text-ink">Pending invitations</h2>
          <ul className="mt-4 flex flex-col divide-y divide-ink/10">
            {(invitations as AdminInvitation[]).map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{inv.email}</p>
                  <p className="text-xs text-ink/50">
                    {ROLE_LABEL[inv.role]} — invited {new Date(inv.created_at).toLocaleDateString()}, expires{" "}
                    {new Date(inv.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <form action={revokeInvitation.bind(null, inv.id)}>
                  <button type="submit" className="text-xs font-semibold text-red-600 hover:underline">
                    Revoke
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold text-ink">Team</h2>
        <ul className="mt-4 flex flex-col divide-y divide-ink/10">
          {(profiles as AdminProfile[] | null)?.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">
                  {p.full_name || "Unnamed"} {p.deactivated_at && <span className="ml-2 text-xs font-semibold text-red-600">Deactivated</span>}
                </p>
                <p className="text-xs text-ink/50">{ROLE_LABEL[p.role]}</p>
              </div>
              {p.id !== profile!.id && (
                <div className="flex items-center gap-3">
                  {p.deactivated_at ? (
                    <form action={reactivateUser.bind(null, p.id)}>
                      <button type="submit" className="text-xs font-semibold text-gold-dark hover:underline">Reactivate</button>
                    </form>
                  ) : (
                    <form action={deactivateUser.bind(null, p.id)}>
                      <button type="submit" className="text-xs font-semibold text-ink/60 hover:underline">Deactivate</button>
                    </form>
                  )}
                  <form action={removeUser.bind(null, p.id)}>
                    <button type="submit" className="text-xs font-semibold text-red-600 hover:underline">
                      Remove
                    </button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-ink/40">
          Removing someone never deletes the leads, deals, or activity they worked on — those
          simply fall back to unassigned.
        </p>
      </section>
    </div>
  );
}
