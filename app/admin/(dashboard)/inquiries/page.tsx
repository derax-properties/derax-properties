import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { InvestorInquiry } from "@/lib/types";
import { InquiriesTable } from "@/components/admin/InquiriesTable";
import { updateInquiryStatus } from "./actions";
import { PageHeader } from "@/components/admin/PageHeader";
import { GroupIcon } from "@/components/admin/icons";

export const metadata = { title: "Investor Inquiries", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function InquiriesPage() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("investor_inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  const inquiries = (data as InvestorInquiry[]) ?? [];

  return (
    <div>
      <PageHeader
        icon={<GroupIcon className="h-5 w-5" />}
        title="Investor Inquiries"
        subtitle="Buyer and investor interest submitted from property pages."
      />

      <div className="mt-6">
        <InquiriesTable inquiries={inquiries} action={updateInquiryStatus} />
      </div>
    </div>
  );
}
