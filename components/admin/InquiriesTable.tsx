"use client";

import { useMemo, useState } from "react";
import type { InvestorInquiry } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { InquiryStatusSelect } from "@/components/admin/InquiryStatusSelect";

export function InquiriesTable({
  inquiries,
  action,
}: {
  inquiries: InvestorInquiry[];
  action: (id: string, status: string) => Promise<void>;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return inquiries;
    const q = search.toLowerCase();
    return inquiries.filter((inq) =>
      `${inq.name} ${inq.property_title ?? ""} ${inq.email} ${inq.phone}`.toLowerCase().includes(q)
    );
  }, [inquiries, search]);

  return (
    <div>
      <input
        type="search"
        placeholder="Search name, property, email, phone"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="focus-gold mb-3 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
      />

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
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
            {filtered.map((inq) => (
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
                  <InquiryStatusSelect id={inq.id} status={inq.status} action={action} />
                </td>
                <td className="p-3 text-ink/50">{formatDate(inq.created_at)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink/40">
                  {inquiries.length === 0 ? "No investor inquiries yet." : "No inquiries match that search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
