"use client";

import { useTransition } from "react";
import type { InquiryStatus } from "@/lib/types";

const STATUSES: InquiryStatus[] = [
  "New",
  "Contacted",
  "Interested",
  "Under Review",
  "Closed",
  "Not Interested",
];

export function InquiryStatusSelect({
  id,
  status,
  action,
}: {
  id: string;
  status: string;
  action: (id: string, status: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) => startTransition(() => action(id, e.target.value))}
      className="focus-gold rounded-lg border border-ink/15 px-2 py-1 text-sm"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
