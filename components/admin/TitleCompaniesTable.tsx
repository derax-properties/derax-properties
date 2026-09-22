"use client";

import { Fragment, useMemo, useState } from "react";
import type { TitleCompany } from "@/lib/types";
import { DeleteButton } from "@/components/admin/DeleteButton";

export function TitleCompaniesTable({
  companies,
  onToggleStatus,
  onEdit,
  onDelete,
}: {
  companies: TitleCompany[];
  onToggleStatus: (id: string, nextStatus: "Active" | "Inactive") => Promise<void>;
  onEdit: (id: string, formData: FormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return companies;
    const q = search.toLowerCase();
    return companies.filter((c) =>
      `${c.company_name} ${c.contact_name ?? ""} ${(c.states_covered ?? []).join(" ")}`.toLowerCase().includes(q)
    );
  }, [companies, search]);

  return (
    <div>
      <input
        type="search"
        placeholder="Search company, contact, state"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="focus-gold mb-3 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
      />

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/40">
            <th className="p-2">Company</th>
            <th className="p-2">Contact</th>
            <th className="p-2">States</th>
            <th className="p-2">Status</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => (
            <Fragment key={c.id}>
              <tr className="border-b border-ink/5 last:border-0 hover:bg-cream/40">
                <td className="p-2 font-medium text-ink">{c.company_name}</td>
                <td className="p-2">
                  <div className="flex flex-col">
                    <span>{c.contact_name}</span>
                    {c.phone && (
                      <a href={`tel:${c.phone.replace(/\D/g, "")}`} className="text-gold-dark hover:underline">
                        {c.phone}
                      </a>
                    )}
                  </div>
                </td>
                <td className="p-2">{c.states_covered?.join(", ") || "—"}</td>
                <td className="p-2">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(c.id, c.status === "Active" ? "Inactive" : "Active")}
                    className={
                      "rounded-full px-2 py-0.5 text-xs font-semibold " +
                      (c.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-ink/10 text-ink/50")
                    }
                  >
                    {c.status}
                  </button>
                </td>
                <td className="p-2 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingId(editingId === c.id ? null : c.id)}
                      className="focus-gold text-xs font-semibold text-gold-dark hover:underline"
                    >
                      {editingId === c.id ? "Cancel" : "Edit"}
                    </button>
                    <DeleteButton
                      action={onDelete.bind(null, c.id)}
                      confirmMessage={`Delete ${c.company_name} from your title companies? This cannot be undone.`}
                      label="Delete"
                      className="focus-gold text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                    />
                  </div>
                </td>
              </tr>
              {editingId === c.id && (
                <tr className="border-b border-ink/5 bg-cream/30 last:border-0">
                  <td colSpan={5} className="p-3">
                    <form
                      action={async (formData: FormData) => {
                        await onEdit(c.id, formData);
                        setEditingId(null);
                      }}
                      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                    >
                      <input
                        name="company_name"
                        placeholder="Company name"
                        required
                        defaultValue={c.company_name}
                        className="focus-gold rounded-lg border border-ink/15 px-3 py-1.5 text-sm"
                      />
                      <input
                        name="contact_name"
                        placeholder="Contact name"
                        defaultValue={c.contact_name ?? ""}
                        className="focus-gold rounded-lg border border-ink/15 px-3 py-1.5 text-sm"
                      />
                      <input
                        name="phone"
                        placeholder="Phone"
                        defaultValue={c.phone ?? ""}
                        className="focus-gold rounded-lg border border-ink/15 px-3 py-1.5 text-sm"
                      />
                      <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        defaultValue={c.email ?? ""}
                        className="focus-gold rounded-lg border border-ink/15 px-3 py-1.5 text-sm"
                      />
                      <input
                        name="states_covered"
                        placeholder="States covered (e.g. GA, FL)"
                        defaultValue={c.states_covered?.join(", ") ?? ""}
                        className="focus-gold rounded-lg border border-ink/15 px-3 py-1.5 text-sm"
                      />
                      <input
                        name="notes"
                        placeholder="Notes"
                        defaultValue={c.notes ?? ""}
                        className="focus-gold rounded-lg border border-ink/15 px-3 py-1.5 text-sm sm:col-span-1"
                      />
                      <div className="col-span-2 sm:col-span-3">
                        <button
                          type="submit"
                          className="focus-gold rounded-full bg-gold px-4 py-1.5 text-xs font-semibold text-ink hover:bg-gold-light"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={5} className="p-8 text-center text-ink/40">
                {companies.length === 0 ? "No title companies yet." : "No title companies match that search."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
