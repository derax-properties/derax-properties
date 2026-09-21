import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Deal, SellerSubmission } from "@/lib/types";
import { DealsTable } from "@/components/admin/DealsTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { DocumentIcon } from "@/components/admin/icons";
import { NewDealButton } from "@/components/admin/NewDealButton";
import { createDeal } from "./actions";

export const metadata = { title: "Deals — DERAX CRM", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const supabase = createServerSupabaseClient();
  const [{ data: deals }, { data: allLeads }] = await Promise.all([
    supabase
      .from("deals")
      .select("*, seller_submissions(reference_number, property_address, city, state)")
      .order("created_at", { ascending: false }),
    supabase
      .from("seller_submissions")
      .select("id, reference_number, property_address, city, state")
      .order("created_at", { ascending: false }),
  ]);

  const dealRows =
    (deals as (Deal & {
      seller_submissions: Pick<SellerSubmission, "reference_number" | "property_address" | "city" | "state"> | null;
    })[]) ?? [];

  // Only leads without a deal yet belong in the picker — every other lead
  // already has one, shown in the table below.
  const leadsWithDeals = new Set(dealRows.map((d) => d.seller_submission_id).filter(Boolean));
  const availableLeads = ((allLeads as Pick<SellerSubmission, "id" | "reference_number" | "property_address" | "city" | "state">[]) ?? []).filter(
    (l) => !leadsWithDeals.has(l.id)
  );

  return (
    <div>
      <PageHeader
        icon={<DocumentIcon className="h-5 w-5" />}
        title="Deals"
        subtitle="Every deal from contract to close."
        action={<NewDealButton leads={availableLeads} action={createDeal} />}
      />

      <div className="mt-6">
        <DealsTable deals={dealRows} />
      </div>
    </div>
  );
}
