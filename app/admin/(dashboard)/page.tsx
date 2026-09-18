import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { LeadStatus, SellerSubmission } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Admin Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const SUMMARY_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Offer Made",
  "Under Contract",
  "Closed",
];

export default async function AdminDashboardPage() {
  const supabase = createServerSupabaseClient();

  const { data: leads } = await supabase
    .from("seller_submissions")
    .select("id, reference_number, first_name, last_name, city, state, status, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: allLeads } = await supabase.from("seller_submissions").select("status");

  const counts = SUMMARY_STATUSES.reduce<Record<string, number>>((acc, status) => {
    acc[status] = (allLeads ?? []).filter((l) => l.status === status).length;
    return acc;
  }, {});

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-ink/50">Overview of seller leads and pipeline health.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {SUMMARY_STATUSES.map((status) => (
          <div key={status} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-2xl font-semibold text-ink">{counts[status] ?? 0}</p>
            <p className="mt-1 text-xs text-ink/50">{status}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Recent Seller Leads</h2>
          <Link href="/admin/leads" className="focus-gold text-sm font-semibold text-gold-dark hover:underline">
            View all →
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/40">
                <th className="pb-2">Reference</th>
                <th className="pb-2">Seller</th>
                <th className="pb-2">Location</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {((leads as Pick<
                SellerSubmission,
                "id" | "reference_number" | "first_name" | "last_name" | "city" | "state" | "status" | "created_at"
              >[]) ?? []).map((lead) => (
                <tr key={lead.id} className="border-b border-ink/5 last:border-0">
                  <td className="py-3">
                    <Link href={`/admin/leads/${lead.id}`} className="focus-gold font-medium text-gold-dark hover:underline">
                      {lead.reference_number}
                    </Link>
                  </td>
                  <td className="py-3">
                    {lead.first_name} {lead.last_name}
                  </td>
                  <td className="py-3">
                    {lead.city}, {lead.state}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="py-3 text-ink/50">{formatDate(lead.created_at)}</td>
                </tr>
              ))}
              {(!leads || leads.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ink/40">
                    No seller submissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
