"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SellerSubmission, LeadStatus, PropertyType } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { ZipPopulationBadge } from "@/components/admin/ZipPopulationBadge";
import { formatDate, formatLeadName } from "@/lib/utils";

const STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Offer Made",
  "Under Contract",
  "Closed",
  "Not a Fit",
  "Follow Up",
];

const PROPERTY_TYPES: PropertyType[] = [
  "Single Family",
  "Multi-Family",
  "Condo",
  "Townhouse",
  "Mobile/Manufactured",
  "Land",
  "Other",
];

type SortKey = "newest" | "oldest";

function toCsv(rows: SellerSubmission[]): string {
  const headers = [
    "reference_number",
    "created_at",
    "first_name",
    "last_name",
    "phone",
    "email",
    "property_address",
    "city",
    "state",
    "zip",
    "property_type",
    "condition",
    "selling_reason",
    "timeline",
    "asking_price",
    "status",
  ];
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      headers
        .map((h) => {
          const value = (row as unknown as Record<string, unknown>)[h] ?? "";
          const str = String(value).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(",")
    );
  }
  return lines.join("\n");
}

export function LeadsTable({
  leads,
  initialSearch = "",
  initialStatus = "",
}: {
  leads: SellerSubmission[];
  initialSearch?: string;
  initialStatus?: string;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [propertyType, setPropertyType] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  const states = useMemo(() => Array.from(new Set(leads.map((l) => l.state))).sort(), [leads]);

  const filtered = useMemo(() => {
    let result = leads.filter((lead) => {
      if (state && lead.state !== state) return false;
      if (zip && !lead.zip.includes(zip)) return false;
      if (status && lead.status !== status) return false;
      if (propertyType && lead.property_type !== propertyType) return false;
      if (search) {
        const haystack =
          `${formatLeadName(lead.first_name, lead.last_name)} ${lead.property_address} ${lead.city} ${lead.reference_number}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    });
    result = result.sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sort === "newest" ? -diff : diff;
    });
    return result;
  }, [leads, search, state, zip, status, propertyType, sort]);

  function exportCsv() {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `derax-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Hidden — gives the voice-command bar a spoken result for a plain
          name/address lookup, which (unlike the status/follow-up filters
          above) has no other on-screen "Filtered: … (N)" banner to read. */}
      {initialSearch && (
        <span data-voice-announce hidden>
          {filtered.length} {filtered.length === 1 ? "result" : "results"} for {initialSearch}
        </span>
      )}
      <div className="grid grid-cols-2 gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-3 lg:grid-cols-6">
        <input
          type="search"
          placeholder="Search name, address, ref #"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="focus-gold col-span-2 rounded-lg border border-ink/15 px-3 py-2 text-sm lg:col-span-2"
        />
        <select value={state} onChange={(e) => setState(e.target.value)} className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm">
          <option value="">All States</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          placeholder="ZIP"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm"
        >
          <option value="">All Types</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="sort" className="text-ink/50">
            Sort:
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="focus-gold rounded-lg border border-ink/15 px-2 py-1"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        <button
          onClick={exportCsv}
          className="focus-gold rounded-full border border-gold px-4 py-2 text-sm font-semibold text-gold-dark hover:bg-gold hover:text-ink"
        >
          Export CSV
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/40">
              <th className="p-3">Reference</th>
              <th className="p-3">Seller</th>
              <th className="p-3">Phone / Email</th>
              <th className="p-3">Property</th>
              <th className="p-3">Type</th>
              <th className="p-3">Motivation</th>
              <th className="p-3">Status</th>
              <th className="p-3">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <tr key={lead.id} className="border-b border-ink/5 last:border-0 hover:bg-cream/40">
                <td className="p-3">
                  <Link href={`/admin/leads/${lead.id}`} className="focus-gold font-medium text-gold-dark hover:underline">
                    {lead.reference_number}
                  </Link>
                  {lead.possible_duplicate_of && (
                    <span title="Possible duplicate — review before contacting twice" className="ml-1.5 text-amber-600">
                      ⚠
                    </span>
                  )}
                </td>
                <td className="p-3">
                  {formatLeadName(lead.first_name, lead.last_name)}
                </td>
                <td className="p-3">
                  <div className="flex flex-col gap-0.5">
                    {lead.phone ? (
                      <a href={`tel:${lead.phone.replace(/\D/g, "")}`} className="text-gold-dark hover:underline">
                        {lead.phone}
                      </a>
                    ) : (
                      !lead.email && <span className="text-ink/30">Not provided</span>
                    )}
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="text-ink/50 hover:underline">
                        {lead.email}
                      </a>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  {lead.property_address}, {lead.city}, {lead.state} {lead.zip}
                  <ZipPopulationBadge zip={lead.zip} />
                </td>
                <td className="p-3">{lead.property_type}</td>
                <td className="p-3">
                  {lead.motivation_level ? (
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-xs font-semibold " +
                        (lead.motivation_level === "Hot"
                          ? "bg-red-100 text-red-700"
                          : lead.motivation_level === "Warm"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-sky-100 text-sky-700")
                      }
                    >
                      {lead.motivation_level}
                    </span>
                  ) : (
                    <span className="text-ink/30">—</span>
                  )}
                </td>
                <td className="p-3">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="p-3 text-ink/50">{formatDate(lead.created_at)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-ink/40">
                  No leads match those filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
