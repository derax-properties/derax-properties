import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { InvestorInquiry } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { InquiryStatusSelect } from "@/components/admin/InquiryStatusSelect";
import { updateInquiryStatus } from "./actions";

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
      <h1 className="font-display text-2xl font-semibold text-ink">Investor Inquiries</h1>
      <p className="mt-1 text-sm text-ink/50">Buyer and investor interest submitted from property pages.</p>

      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/40">
              <th className="p-3">Property</th>
              <th className="p-3">Name</th>
              <th className="p-3">Phone / Email</th>
              <th className="p-3">Message</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inq) => (
              <tr key={inq.id} className="border-b border-ink/5 last:border-0 align-top">
                <td className="p-3">{inq.property_title ?? "General inquiry"}</td>
                <td className="p-3">{inq.name}</td>
                <td className="p-3">
                  <div className="flex flex-col gap-0.5">
                    <a href={`tel:${inq.phone.replace(/\D/g, "")}`} className="text-gold-dark hover:underline">
                      {inq.phone}
                    </a>
                    <a href={`mailto:${inq.email}`} className="text-ink/50 hover:underline">
                      {inq.email}
                    </a>
                  </div>
                </td>
                <td className="max-w-xs p-3 text-ink/70">{inq.message}</td>
                <td className="p-3">
                  <InquiryStatusSelect id={inq.id} status={inq.status} action={updateInquiryStatus} />
                </td>
                <td className="p-3 text-ink/50">{formatDate(inq.created_at)}</td>
              </tr>
            ))}
            {inquiries.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink/40">
                  No investor inquiries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
