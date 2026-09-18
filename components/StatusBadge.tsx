import { cx } from "@/lib/utils";
import type { LeadStatus, InquiryStatus, PropertyStatus } from "@/lib/types";

const STYLES: Record<string, string> = {
  New: "bg-blue-100 text-blue-800",
  Contacted: "bg-amber-100 text-amber-800",
  Qualified: "bg-purple-100 text-purple-800",
  "Offer Made": "bg-indigo-100 text-indigo-800",
  "Under Contract": "bg-teal-100 text-teal-800",
  Closed: "bg-emerald-100 text-emerald-800",
  "Not a Fit": "bg-neutral-200 text-neutral-700",
  "Follow Up": "bg-orange-100 text-orange-800",
  Interested: "bg-purple-100 text-purple-800",
  "Under Review": "bg-amber-100 text-amber-800",
  "Not Interested": "bg-neutral-200 text-neutral-700",
  Available: "bg-emerald-100 text-emerald-800",
  Sold: "bg-neutral-200 text-neutral-700",
  "Coming Soon": "bg-blue-100 text-blue-800",
};

export function StatusBadge({
  status,
}: {
  status: LeadStatus | InquiryStatus | PropertyStatus | string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        STYLES[status] ?? "bg-neutral-200 text-neutral-700"
      )}
    >
      {status}
    </span>
  );
}
