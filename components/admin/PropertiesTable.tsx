"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Property } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/utils";

export function PropertiesTable({ properties }: { properties: Property[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (status && p.status !== status) return false;
      if (search) {
        const haystack = `${p.title} ${p.city} ${p.state} ${p.address_line ?? ""}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [properties, search, status]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search title, city, state"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="focus-gold flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          <option value="Available">Available</option>
          <option value="Under Contract">Under Contract</option>
          <option value="Sold">Sold</option>
          <option value="Coming Soon">Coming Soon</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/40">
              <th className="p-3">Title</th>
              <th className="p-3">Location</th>
              <th className="p-3">Price</th>
              <th className="p-3">Strategy</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-ink/5 last:border-0">
                <td className="p-3 font-medium text-ink">{p.title}</td>
                <td className="p-3">
                  {p.city}, {p.state}
                </td>
                <td className="p-3">{formatCurrency(p.price)}</td>
                <td className="p-3">{p.strategy}</td>
                <td className="p-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="p-3 text-right">
                  <Link href={`/admin/properties/${p.id}/edit`} className="focus-gold font-semibold text-gold-dark hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink/40">
                  {properties.length === 0
                    ? "No properties yet. Add your first listing to show it on the site."
                    : "No properties match those filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
