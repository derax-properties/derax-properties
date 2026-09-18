import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/leads", label: "Seller Leads" },
  { href: "/admin/inquiries", label: "Investor Inquiries" },
  { href: "/admin/properties", label: "Properties" },
  { href: "/admin/messages", label: "Contact Messages" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-neutral-100 font-body text-ink">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="flex flex-col justify-between bg-ink px-4 py-6 text-cream lg:w-64 lg:shrink-0">
          <div>
            <Link href="/admin" className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold">DERAX</span>
              <span className="text-[9px] font-semibold tracking-[0.35em] text-gold">ADMIN</span>
            </Link>
            <nav className="mt-8 flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="focus-gold whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-cream/80 hover:bg-white/5 hover:text-gold"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-8 border-t border-white/10 pt-4">
            <p className="truncate text-xs text-cream/50">{user?.email}</p>
            <form action={signOut}>
              <button
                type="submit"
                className="focus-gold mt-2 text-sm font-semibold text-gold hover:text-gold-light"
              >
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        <main className="flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
