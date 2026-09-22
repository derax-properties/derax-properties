import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAdminProfile, isOwnerOrAdmin } from "@/lib/supabase/profile";
import { signOut } from "../login/actions";
import { Topbar } from "@/components/admin/Topbar";
import { ThemePicker } from "@/components/admin/ThemePicker";
import { PageTransition } from "@/components/admin/PageTransition";

export const metadata = {
  robots: { index: false, follow: false, nocache: true },
};

const BASE_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/leads", label: "Seller Leads" },
  { href: "/admin/buyers", label: "Cash Buyers" },
  { href: "/admin/deals", label: "Deals" },
  { href: "/admin/title-companies", label: "Title Companies" },
  { href: "/admin/inquiries", label: "Investor Inquiries" },
  { href: "/admin/properties", label: "Properties" },
  { href: "/admin/messages", label: "Contact Messages" },
];
const OWNER_ADMIN_LINKS = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Profile and notification count don't depend on each other — run them
  // together instead of one-after-another. Combined with passing `user`
  // through (so getCurrentAdminProfile skips its own auth.getUser() call),
  // this cuts two redundant sequential round-trips that were previously
  // happening on every single admin page navigation, which is most of why
  // switching pages felt slow.
  const [profile, hotCountResult] = await Promise.all([
    getCurrentAdminProfile(user),
    // A simple, real notification count for the topbar bell: leads marked
    // Hot that are not yet Closed/Not a Fit. Not a fabricated placeholder —
    // it reflects the same data the Leads page shows.
    supabase
      .from("seller_submissions")
      .select("id", { count: "exact", head: true })
      .eq("motivation_level", "Hot")
      .not("status", "in", '("Closed","Not a Fit")'),
  ]);
  const hotCount = hotCountResult.count;

  // Defense in depth: middleware.ts already keeps VAs out of /admin
  // entirely, sending them to /agent-intake instead. This is the
  // second check, not the only one.
  if (profile?.role === "va") {
    redirect("/agent-intake");
  }
  const links = isOwnerOrAdmin(profile) ? [...BASE_LINKS, ...OWNER_ADMIN_LINKS] : BASE_LINKS;

  return (
    <div className="crm-shell" data-crm-theme="sage" data-crm-mode="light">
      <div className="crm-canvas min-h-screen font-body text-ink">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <aside className="crm-sidebar flex flex-col justify-between gap-6 px-4 py-6 text-cream lg:w-56 lg:shrink-0">
            <div>
              <Link href="/admin" className="crm-float-chip flex flex-col leading-none rounded-xl px-3 py-2.5">
                <span className="font-display text-lg font-bold">DERAX</span>
                <span className="text-[9px] font-semibold tracking-[0.35em] text-gold">CRM</span>
              </Link>
              <nav className="mt-4 flex flex-row gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="crm-float-chip focus-gold whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-cream/80 hover:text-gold"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex flex-col gap-2">
              <div className="crm-float-chip rounded-xl px-3 py-2.5">
                <p className="truncate text-xs text-cream/50">{user?.email}</p>
                {profile && (
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold/70">
                    {profile.role === "owner" ? "Owner" : "Admin"}
                  </p>
                )}
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="crm-float-chip focus-gold w-full rounded-lg px-3 py-2 text-sm font-semibold text-gold hover:text-gold-light"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </aside>

          <div className="flex flex-1 flex-col">
            <Topbar fullName={profile?.full_name ?? null} role={profile?.role ?? null} notificationCount={hotCount ?? 0} />
            <div className="flex items-center justify-end px-4 pt-4 sm:px-8">
              <ThemePicker />
            </div>
            <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-8">
              <PageTransition>{children}</PageTransition>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
