import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SellerSubmission } from "@/lib/types";
import { getFollowUpStatus } from "@/lib/followUp";
import { LeadsView } from "@/components/admin/LeadsView";
import { PageHeader } from "@/components/admin/PageHeader";
import { GroupIcon } from "@/components/admin/icons";
import { advanceLeadStage, markLeadDead, reopenLead } from "./actions";

export const metadata = { title: "Seller Leads", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const FOLLOWUP_LABELS: Record<string, string> = {
  overdue: "Overdue follow-ups",
  today: "Follow-ups due today",
  upcoming: "Upcoming follow-ups",
  none: "Leads with no follow-up scheduled",
};

export default async function AdminLeadsPage({ searchParams }: { searchParams: { search?: string; followup?: string } }) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("seller_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  let leads = (data as SellerSubmission[]) ?? [];

  const followup = searchParams.followup;
  if (followup && FOLLOWUP_LABELS[followup]) {
    leads = leads.filter((l) => {
      if (l.pipeline_stage === "Dead / Lost") return false;
      const status = getFollowUpStatus(l);
      if (followup === "overdue") return status === "Overdue";
      if (followup === "today") return status === "Due Today";
      if (followup === "upcoming") return status === "Upcoming";
      if (followup === "none") return status === "No Follow-Up";
      return true;
    });
  }

  return (
    <div>
      <PageHeader
        icon={<GroupIcon className="h-5 w-5" />}
        title="Seller Leads"
        subtitle='Every property submitted through the "Sell Your Property" form.'
        action={
          <Link
            href="/admin/leads/new"
            className="focus-gold rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold-light"
          >
            + Add Lead
          </Link>
        }
      />
      {followup && FOLLOWUP_LABELS[followup] && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-gold/10 px-4 py-2.5 text-sm">
          <span className="font-medium text-ink">
            Filtered: {FOLLOWUP_LABELS[followup]} ({leads.length})
          </span>
          <Link href="/admin/leads" className="focus-gold font-semibold text-gold-dark hover:underline">
            Clear filter
          </Link>
        </div>
      )}
      <div className="mt-6">
        <LeadsView
          leads={leads}
          initialSearch={searchParams.search ?? ""}
          initialView={followup ? "table" : undefined}
          onAdvance={advanceLeadStage}
          onMarkDead={markLeadDead}
          onReopen={reopenLead}
        />
      </div>
    </div>
  );
}
