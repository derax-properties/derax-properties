import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { LeadStatus, SellerSubmission, Deal, DealStage } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatDateOnly } from "@/lib/utils";
import { getFollowUpStatus } from "@/lib/followUp";
import { GroupIcon, FlameIcon, CalendarIcon, AlertClockIcon, DocumentIcon } from "@/components/admin/icons";

const DEAL_STAGES: DealStage[] = [
  "Contract Sent",
  "Contract Signed",
  "Under Contract",
  "Buyer Assigned",
  "Closing Scheduled",
];

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

  const { data: allLeads } = await supabase.from("seller_submissions").select("status, motivation_level, created_at");

  const { data: followUpLeadsRaw } = await supabase
    .from("seller_submissions")
    .select("id, reference_number, first_name, last_name, next_follow_up_date, follow_up_type, follow_up_completed_at, pipeline_stage")
    .not("next_follow_up_date", "is", null)
    .neq("pipeline_stage", "Dead / Lost")
    .order("next_follow_up_date", { ascending: true });

  const followUpCounts = { overdue: 0, dueToday: 0, upcoming: 0 };
  (followUpLeadsRaw ?? []).forEach((l) => {
    const s = getFollowUpStatus(l as unknown as SellerSubmission);
    if (s === "Overdue") followUpCounts.overdue++;
    else if (s === "Due Today") followUpCounts.dueToday++;
    else if (s === "Upcoming") followUpCounts.upcoming++;
  });
  const noFollowUpCount = (allLeads ?? []).length - (followUpLeadsRaw ?? []).length;
  const upcomingFollowUps = (followUpLeadsRaw ?? [])
    .filter((l) => {
      const s = getFollowUpStatus(l as unknown as SellerSubmission);
      return s === "Overdue" || s === "Due Today" || s === "Upcoming";
    })
    .slice(0, 6);

  const counts = SUMMARY_STATUSES.reduce<Record<string, number>>((acc, status) => {
    acc[status] = (allLeads ?? []).filter((l) => l.status === status).length;
    return acc;
  }, {});

  // "Overdue" here means a real, honest thing given what the schema tracks
  // today: a New or Contacted lead sitting untouched for 3+ days. There's
  // no due-date field yet, so this isn't a fabricated "due today" count —
  // it's the closest truthful signal available.
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const totalLeads = allLeads?.length ?? 0;
  const hotLeads = (allLeads ?? []).filter((l) => l.motivation_level === "Hot").length;
  const followUpLeads = (allLeads ?? []).filter((l) => l.status === "Follow Up").length;
  const overdueLeads = (allLeads ?? []).filter(
    (l) => (l.status === "New" || l.status === "Contacted") && new Date(l.created_at) < threeDaysAgo
  ).length;

  const { data: activeDeals } = await supabase
    .from("deals")
    .select("*, seller_submissions(reference_number, property_address, city, state)")
    .not("stage", "in", '("Closed","Fell Through")')
    .order("updated_at", { ascending: false });

  const dealsByStage = DEAL_STAGES.reduce<Record<string, typeof activeDeals>>((acc, stage) => {
    acc[stage] = (activeDeals ?? []).filter((d) => d.stage === stage);
    return acc;
  }, {} as Record<string, typeof activeDeals>);

  const pipelineValue = (activeDeals ?? []).reduce((sum, d) => sum + (d.purchase_price ?? 0), 0);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-ink/50">Overview of seller leads and pipeline health.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={<GroupIcon className="h-5 w-5" />} value={totalLeads} label="Total Leads" tint="crm-accent-soft-bg" />
        <StatTile icon={<FlameIcon className="h-5 w-5" />} value={hotLeads} label="Hot" tint="bg-red-50 text-red-600" />
        <StatTile icon={<CalendarIcon className="h-5 w-5" />} value={followUpLeads} label="Follow Up" tint="bg-sky-50 text-sky-600" />
        <StatTile icon={<AlertClockIcon className="h-5 w-5" />} value={overdueLeads} label="Overdue (3+ days)" tint="bg-amber-50 text-amber-600" />
      </div>

      <div className="mt-8 rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="crm-accent-soft-bg flex h-8 w-8 items-center justify-center rounded-lg">
            <AlertClockIcon className="h-4 w-4" />
          </span>
          <h2 className="font-display text-lg font-semibold text-ink">Follow-Up Center</h2>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link href="/admin/leads?followup=overdue" className="rounded-lg bg-red-50 p-3 hover:bg-red-100">
            <p className="text-xl font-semibold text-red-600">{followUpCounts.overdue}</p>
            <p className="mt-0.5 text-xs text-red-600/70">Overdue</p>
          </Link>
          <Link href="/admin/leads?followup=today" className="rounded-lg bg-amber-50 p-3 hover:bg-amber-100">
            <p className="text-xl font-semibold text-amber-600">{followUpCounts.dueToday}</p>
            <p className="mt-0.5 text-xs text-amber-600/70">Due Today</p>
          </Link>
          <Link href="/admin/leads?followup=upcoming" className="rounded-lg bg-sky-50 p-3 hover:bg-sky-100">
            <p className="text-xl font-semibold text-sky-600">{followUpCounts.upcoming}</p>
            <p className="mt-0.5 text-xs text-sky-600/70">Upcoming</p>
          </Link>
          <Link href="/admin/leads?followup=none" className="crm-accent-soft-bg rounded-lg p-3 hover:opacity-80">
            <p className="text-xl font-semibold text-ink">{Math.max(noFollowUpCount, 0)}</p>
            <p className="mt-0.5 text-xs text-ink/60">No Follow-Up</p>
          </Link>
        </div>

        {upcomingFollowUps.length > 0 && (
          <ul className="mt-4 flex flex-col divide-y divide-ink/5">
            {upcomingFollowUps.map((l) => {
              const s = getFollowUpStatus(l as unknown as SellerSubmission);
              return (
                <li key={l.id} className="flex items-center justify-between gap-3 rounded-lg py-2 px-2 text-sm hover:bg-cream/40">
                  <Link href={`/admin/leads/${l.id}`} className="focus-gold font-medium text-gold-dark hover:underline">
                    {l.first_name} {l.last_name} <span className="text-ink/40">({l.reference_number})</span>
                  </Link>
                  <span className={`text-xs font-semibold ${s === "Overdue" ? "text-red-500" : s === "Due Today" ? "text-amber-600" : "text-ink/50"}`}>
                    {l.follow_up_type ? `${l.follow_up_type} · ` : ""}
                    {l.next_follow_up_date ? formatDateOnly(l.next_follow_up_date) : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {upcomingFollowUps.length === 0 && <p className="mt-4 text-sm text-ink/40">Nothing overdue or due soon.</p>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {SUMMARY_STATUSES.map((status) => (
          <div key={status} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-2xl font-semibold text-ink">{counts[status] ?? 0}</p>
            <p className="mt-1 text-xs text-ink/50">{status}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="crm-accent-soft-bg flex h-8 w-8 items-center justify-center rounded-lg">
              <GroupIcon className="h-4 w-4" />
            </span>
            <h2 className="font-display text-lg font-semibold text-ink">Recent Seller Leads</h2>
          </div>
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
                <tr key={lead.id} className="border-b border-ink/5 last:border-0 hover:bg-cream/40">
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

      <div className="mt-8 rounded-xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="crm-accent-soft-bg flex h-8 w-8 items-center justify-center rounded-lg">
              <DocumentIcon className="h-4 w-4" />
            </span>
            <h2 className="font-display text-lg font-semibold text-ink">Deal Command Center</h2>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-ink/50">
              Active pipeline value: <span className="font-semibold text-ink">${pipelineValue.toLocaleString()}</span>
            </p>
            <Link href="/admin/deals" className="focus-gold text-sm font-semibold text-gold-dark hover:underline">
              View all →
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {DEAL_STAGES.map((stage) => (
            <div key={stage} className="crm-accent-soft-bg rounded-lg p-3">
              <p className="text-xl font-semibold text-ink">{dealsByStage[stage]?.length ?? 0}</p>
              <p className="mt-0.5 text-xs text-ink/60">{stage}</p>
            </div>
          ))}
        </div>

        {activeDeals && activeDeals.length > 0 && (
          <ul className="mt-4 flex flex-col divide-y divide-ink/5">
            {activeDeals.slice(0, 6).map((d: Deal & { seller_submissions: { reference_number: string; property_address: string; city: string; state: string } | null }) => (
              <li key={d.id} className="flex items-center justify-between gap-3 rounded-lg py-2 px-2 text-sm hover:bg-cream/40">
                <Link href={`/admin/deals/${d.id}`} className="focus-gold font-medium text-gold-dark hover:underline">
                  {d.seller_submissions?.property_address ?? "Untitled deal"}
                </Link>
                <span className="text-xs text-ink/50">{d.stage}</span>
              </li>
            ))}
          </ul>
        )}
        {(!activeDeals || activeDeals.length === 0) && (
          <p className="mt-4 text-sm text-ink/40">No active deals right now.</p>
        )}
      </div>
    </div>
  );
}

function StatTile({ icon, value, label, tint }: { icon: React.ReactNode; value: number; label: string; tint: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tint}`}>{icon}</span>
      <div>
        <p className="text-2xl font-semibold leading-none text-ink">{value}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-ink/50">{label}</p>
      </div>
    </div>
  );
}
