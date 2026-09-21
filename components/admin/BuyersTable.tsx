"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CashBuyer } from "@/lib/types";

export function BuyersTable({ buyers }: { buyers: CashBuyer[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    return buyers.filter((b) => {
      if (status && b.status !== status) return false;
      if (search) {
        const haystack = `${b.full_name} ${b.company_name ?? ""} ${b.phone ?? ""} ${b.email ?? ""}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [buyers, search, status]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search name, company, phone, email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="focus-gold flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Do Not Contact">Do Not Contact</option>
        </select>
      </div>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/40">
            <th className="p-2">Name</th>
            <th className="p-2">Type</th>
            <th className="p-2">Phone / Email</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((b) => (
            <tr key={b.id} className="border-b border-ink/5 last:border-0 hover:bg-cream/40">
              <td className="p-2">
                <Link href={`/admin/buyers/${b.id}`} className="focus-gold font-medium text-gold-dark hover:underline">
                  {b.full_name}
                </Link>
                {b.company_name && <p className="text-xs text-ink/40">{b.company_name}</p>}
              </td>
              <td className="p-2">{b.buyer_type ?? "—"}</td>
              <td className="p-2">
                <div className="flex flex-col">
                  {b.phone && (
                    <a href={`tel:${b.phone.replace(/\D/g, "")}`} className="text-gold-dark hover:underline">
                      {b.phone}
                    </a>
                  )}
                  {b.email && <span className="text-ink/50">{b.email}</span>}
                </div>
              </td>
              <td className="p-2">
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-xs font-semibold " +
                    (b.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-ink/10 text-ink/50")
                  }
                >
                  {b.status}
                </span>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={4} className="p-8 text-center text-ink/40">
                {buyers.length === 0 ? "No cash buyers yet — add your first one." : "No buyers match those filters."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
