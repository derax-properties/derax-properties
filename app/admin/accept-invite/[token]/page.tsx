import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { acceptInvite } from "./actions";

export const metadata = { title: "Accept Invitation — DERAX CRM", robots: { index: false, follow: false } };

export default async function AcceptInvitePage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { error?: string };
}) {
  const admin = createAdminSupabaseClient();
  const { data: invitation } = await admin
    .from("admin_invitations")
    .select("email, full_name, role, expires_at, accepted_at, revoked_at")
    .eq("token", params.token)
    .maybeSingle();

  const isValid =
    invitation && !invitation.accepted_at && !invitation.revoked_at && new Date(invitation.expires_at) > new Date();

  return (
    <div className="crm-sidebar flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-card">
        <div className="mb-6 flex flex-col items-center leading-none">
          <span className="font-display text-xl font-bold text-ink">DERAX</span>
          <span className="text-[10px] font-semibold tracking-[0.35em] text-gold-dark">CRM</span>
        </div>

        {!isValid ? (
          <>
            <h1 className="text-center font-display text-xl font-semibold text-ink">
              {invitation?.accepted_at ? "You already have an account" : "Invitation not found"}
            </h1>
            <p className="mt-3 text-center text-sm text-ink/60">
              {invitation?.accepted_at
                ? "This invitation link was already used to set up your account. You don't need to use it again — just sign in below with the email and password you already created."
                : "This invitation link is invalid, has already been used, or has expired. Ask whoever invited you to send a new one."}
            </p>
            {/*
              Link back to a normal sign-in screen so a returning VA/Admin who
              only ever kept the one-time invite email isn't stuck here —
              this is the fix for "it keeps asking me to create an account
              again": once accepted, this page now points them at the real
              login page instead of a dead end.
            */}
            <Link
              href={invitation?.role === "va" ? "/agent-intake/login" : "/admin/login"}
              className="focus-gold mt-6 block w-full rounded-full bg-gold px-6 py-2.5 text-center text-sm font-semibold text-ink hover:bg-gold-light"
            >
              Go to Sign In
            </Link>
            {!invitation && (
              <p className="mt-3 text-center text-xs text-ink/40">
                Not sure which sign-in page you need?{" "}
                <Link href="/agent-intake/login" className="font-semibold underline">
                  Agent sign in
                </Link>{" "}
                ·{" "}
                <Link href="/admin/login" className="font-semibold underline">
                  Admin sign in
                </Link>
              </p>
            )}
          </>
        ) : (
          <>
            <h1 className="text-center font-display text-xl font-semibold text-ink">
              Welcome to DERAX CRM
            </h1>
            <p className="mt-1 text-center text-sm text-ink/60">
              Set a password for {invitation!.email} to activate your account.
            </p>

            <form action={acceptInvite} className="mt-6 flex flex-col gap-4">
              <input type="hidden" name="token" value={params.token} />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-ink/80">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="focus-gold w-full rounded-lg border border-ink/15 px-4 py-2.5 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm_password" className="text-sm font-medium text-ink/80">Confirm Password</label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="focus-gold w-full rounded-lg border border-ink/15 px-4 py-2.5 text-sm"
                />
              </div>

              {searchParams.error && (
                <p className="text-sm font-medium text-red-600" role="alert">
                  {searchParams.error}
                </p>
              )}

              <button
                type="submit"
                className="focus-gold mt-2 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-ink hover:bg-gold-light"
              >
                Activate Account
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
