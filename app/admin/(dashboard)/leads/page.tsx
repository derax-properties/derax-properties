import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SellerSubmission } from "@/lib/types";
import { LeadsView } from "@/components/admin/LeadsView";
import { PageHeader } from "@/components/admin/PageHeader";
import { GroupIcon } from "@/components/admin/icons";
import { advanceLeadStage, markLeadDead, reopenLead } from "./actions";

export const metadata = { title: "Seller Leads", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLeadsPage({ searchParams }: { searchParams: { search?: string } }) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("seller_submissions")
    .select("*")
    .order("created_at", { ascending: false });

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
      <div className="mt-6">
        <LeadsView
          leads={(data as SellerSubmission[]) ?? []}
          initialSearch={searchParams.search ?? ""}
          onAdvance={advanceLeadStage}
          onMarkDead={markLeadDead}
          onReopen={reopenLead}
        />
      </div>
    </div>
  );
}
