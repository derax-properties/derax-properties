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

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: { search?: string; followup?: string; status?: string; motivation?: string };
}) {
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

  // ?status= and ?motivation= are additive filters on top of (or instead
  // of) ?followup= — added so the voice-command search bar (see
  // components/admin/VoiceCommand.tsx) can say "new leads", "qualified
  // leads", or "hot leads" and land here already filtered, the same way
  // "today's follow-ups" already worked before voice was added.
  const statusFilter = searchParams.status;
  if (statusFilter) {
    leads = leads.filter((l) => l.status === statusFilter);
  }
  const motivationFilter = searchParams.motivation;
  if (motivationFilter) {
    leads = leads.filter((l) => l.motivation_level === motivationFilter);
  }

  const filterLabel = followup && FOLLOWUP_LABELS[followup]
    ? FOLLOWUP_LABELS[followup]
    : statusFilter
    ? `${statusFilter} leads`
    : motivationFilter
    ? `${motivationFilter} leads`
    : null;

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
      {filterLabel && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-gold/10 px-4 py-2.5 text-sm">
          <span className="font-medium text-ink">
            Filtered: {filterLabel} ({leads.length})
          </span>
          <Link href="/admin/leads" className="focus-gold font-semibold text-gold-dark hover:underline">
            Clear filter
          </Link>
          {/* Hidden — not a UI change, just gives the voice-command bar
              (components/admin/VoiceCommand.tsx) a natural-sounding
              sentence to speak back after it navigates here. */}
          <span data-voice-announce hidden>
            {leads.length} {leads.length === 1 ? "lead" : "leads"} — {filterLabel}
          </span>
        </div>
      )}
      <div className="mt-6">
        <LeadsView
          leads={leads}
          initialSearch={searchParams.search ?? ""}
          initialStatus={statusFilter ?? ""}
          initialView={filterLabel ? "table" : undefined}
          onAdvance={advanceLeadStage}
          onMarkDead={markLeadDead}
          onReopen={reopenLead}
        />
      </div>
    </div>
  );
}
