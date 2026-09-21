import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAdminProfile } from "@/lib/supabase/profile";
import { redirect } from "next/navigation";
import { vaSignOut } from "./actions";

export const metadata: Metadata = {
  title: "Agent Intake — DERAX CRM",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The VA-only intake surface (plan doc section 25/26): a separate app
 * segment from /admin, on purpose. A VA lands here, not in the CRM
 * dashboard — they never see underwriting, deals, or buyer data. Route
 * protection also happens in middleware.ts; this is the belt to that
 * braces (never render intake content for a signed-out or non-VA session).
 */
export default async function AgentIntakeLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/agent-intake/login");
  }

  const profile = await getCurrentAdminProfile();
  if (!profile) {
    redirect("/agent-intake/login");
  }
  if (profile.role !== "va") {
    // Owners/Admins belong in the full CRM, not the intake tool.
    redirect("/admin");
  }

  return (
    <div className="crm-canvas min-h-screen font-body text-ink">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-8 sm:px-6">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold text-ink">DERAX</span>
            <span className="text-[9px] font-semibold tracking-[0.35em] text-gold-dark">AGENT INTAKE</span>
          </div>
          <form action={vaSignOut}>
            <button type="submit" className="focus-gold text-sm font-semibold text-gold-dark hover:underline">
              Sign Out
            </button>
          </form>
        </header>
        {children}
      </div>
    </div>
  );
}
