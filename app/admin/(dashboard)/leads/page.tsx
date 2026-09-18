import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SellerSubmission } from "@/lib/types";
import { LeadsTable } from "@/components/admin/LeadsTable";

export const metadata = { title: "Seller Leads", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("seller_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Seller Leads</h1>
      <p className="mt-1 text-sm text-ink/50">
        Every property submitted through the &quot;Sell Your Property&quot; form.
      </p>
      <div className="mt-6">
        <LeadsTable leads={(data as SellerSubmission[]) ?? []} />
      </div>
    </div>
  );
}
