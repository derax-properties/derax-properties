"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Deal, SellerSubmission, DealStage } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const STAGE_ACCENT: Record<DealStage, string> = {
  "Contract Sent": "bg-sky-100 text-sky-700",
  "Contract Signed": "bg-violet-100 text-violet-700",
  "Under Contract": "bg-indigo-100 text-indigo-700",
  "Buyer Assigned": "bg-amber-100 text-amber-700",
  "Closing Scheduled": "bg-emerald-100 text-emerald-700",
  Closed: "bg-ink/10 text-ink/60",
  "Fell Through": "bg-red-100 text-red-700",
};

const STAGES: DealStage[] = [
  "Contract Sent",
  "Contract Signed",
  "Under Contract",
  "Buyer Assigned",
  "Closing Scheduled",
  "Closed",
  "Fell Through",
];

type DealRow = Deal & { seller_submissions: Pick<SellerSubmission, "reference_number" | "property_address" | "city" | "state"> | null };

export function DealsTable({ deals }: { deals: DealRow[] }) {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      if (stage && d.stage !== stage) return false;
      if (search) {
        const haystack = `${d.seller_submissions?.property_address ?? ""} ${d.seller_submissions?.reference_number ?? ""} ${
          d.seller_submissions?.city ?? ""
        }`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [deals, search, stage]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search property, reference, city"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="focus-gold flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm"
        />
        <select value={stage} onChange={(e) => setStage(e.target.value)} className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm">
          <option value="">All Stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/40">
              <th className="p-3">Property</th>
              <th className="p-3">Exit Strategy</th>
              <th className="p-3">Purchase Price</th>
              <th className="p-3">Stage</th>
              <th className="p-3">Closing Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-ink/5 last:border-0 hover:bg-cream/40">
                <td className="p-3">
                  <Link href={`/admin/deals/${d.id}`} className="focus-gold font-medium text-gold-dark hover:underline">
                    {d.seller_submissions?.property_address ?? "Untitled deal"}
                  </Link>
                  <p className="text-xs text-ink/40">{d.seller_submissions?.reference_number}</p>
                </td>
                <td className="p-3">{d.exit_strategy ?? "—"}</td>
                <td className="p-3">{d.purchase_price ? `$${d.purchase_price.toLocaleString()}` : "—"}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STAGE_ACCENT[d.stage]}`}>{d.stage}</span>
                </td>
                <td className="p-3 text-ink/50">{d.closing_date ? formatDate(d.closing_date) : "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-ink/40">
                  {deals.length === 0 ? "No deals yet — create one from a lead." : "No deals match those filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
