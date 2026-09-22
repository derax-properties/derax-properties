import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAdminProfile, isOwnerOrAdmin } from "@/lib/supabase/profile";
import { signOut } from "../login/actions";
import { Topbar } from "@/components/admin/Topbar";
import { ThemePicker } from "@/components/admin/ThemePicker";
import { PageTransition } from "@/components/admin/PageTransition";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import {
  DashboardIcon,
  GroupIcon,
  PersonIcon,
  DocumentIcon,
  BuildingIcon,
  MailIcon,
  HouseIcon,
  ChatIcon,
  GearIcon,
} from "@/components/admin/icons";

export const metadata = {
  robots: { index: false, follow: false, nocache: true },
};

const ICON_CLASS = "h-[18px] w-[18px]";
const BASE_LINKS = [
  { href: "/admin", label: "Dashboard", icon: <DashboardIcon className={ICON_CLASS} /> },
  { href: "/admin/leads", label: "Seller Leads", icon: <GroupIcon className={ICON_CLASS} /> },
  { href: "/admin/buyers", label: "Cash Buyers", icon: <PersonIcon className={ICON_CLASS} /> },
  { href: "/admin/deals", label: "Deals", icon: <DocumentIcon className={ICON_CLASS} /> },
  { href: "/admin/title-companies", label: "Title Companies", icon: <BuildingIcon className={ICON_CLASS} /> },
  { href: "/admin/inquiries", label: "Investor Inquiries", icon: <MailIcon className={ICON_CLASS} /> },
  { href: "/admin/properties", label: "Properties", icon: <HouseIcon className={ICON_CLASS} /> },
  { href: "/admin/messages", label: "Contact Messages", icon: <ChatIcon className={ICON_CLASS} /> },
];
const OWNER_ADMIN_LINKS = [
  { href: "/admin/users", label: "Users", icon: <PersonIcon className={ICON_CLASS} /> },
  { href: "/admin/settings", label: "Settings", icon: <GearIcon className={ICON_CLASS} /> },
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
        <div className="flex min-h-screen flex-row">
          <AdminSidebar
            links={links}
            userEmail={user?.email ?? null}
            roleLabel={profile ? (profile.role === "owner" ? "Owner" : "Admin") : null}
            signOutAction={signOut}
          />

          <div className="flex min-w-0 flex-1 flex-col">
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
