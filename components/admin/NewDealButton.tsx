"use client";

import { useState } from "react";
import type { SellerSubmission } from "@/lib/types";

export function NewDealButton({
  leads,
  action,
}: {
  leads: Pick<SellerSubmission, "id" | "reference_number" | "property_address" | "city" | "state">[];
  action: (sellerSubmissionId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [leadId, setLeadId] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-gold rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold-light"
      >
        + New Deal
      </button>
    );
  }

  return (
    <form
      action={async () => {
        if (leadId) await action(leadId);
      }}
      className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 shadow-sm"
    >
      <select
        value={leadId}
        onChange={(e) => setLeadId(e.target.value)}
        required
        className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm"
      >
        <option value="">Choose a lead without a deal yet…</option>
        {leads.map((l) => (
          <option key={l.id} value={l.id}>
            {l.reference_number} — {l.property_address}, {l.city}, {l.state}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!leadId}
        className="focus-gold rounded-full bg-gold px-4 py-2 text-xs font-semibold text-ink hover:bg-gold-light disabled:opacity-40"
      >
        Create Deal
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="focus-gold text-xs font-semibold text-ink/50 hover:underline"
      >
        Cancel
      </button>
      {leads.length === 0 && (
        <p className="w-full text-xs text-ink/40">Every lead already has a deal — create a new lead first.</p>
      )}
    </form>
  );
}
