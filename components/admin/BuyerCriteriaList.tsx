"use client";

import { useState } from "react";
import type { BuyerInvestmentCriteria, PropertyType, InvestmentStrategy } from "@/lib/types";

const PROPERTY_TYPES: PropertyType[] = [
  "Single Family",
  "Multi-Family",
  "Condo",
  "Townhouse",
  "Mobile/Manufactured",
  "Land",
  "Other",
];
const STRATEGIES: InvestmentStrategy[] = ["Fix & Flip", "Buy & Hold", "Wholesale", "Development", "Land"];

export function BuyerCriteriaList({
  criteria,
  onUpdate,
  onRemove,
}: {
  criteria: BuyerInvestmentCriteria[];
  onUpdate: (criteriaId: string, formData: FormData) => Promise<void>;
  onRemove: (criteriaId: string) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <ul className="mt-4 flex flex-col gap-2">
      {criteria.map((c) =>
        editingId === c.id ? (
          <li key={c.id} className="rounded-lg border border-ink/10 bg-cream/30 p-3">
            <form
              action={async (formData: FormData) => {
                await onUpdate(c.id, formData);
                setEditingId(null);
              }}
              className="flex flex-col gap-2"
            >
              <select name="property_type" defaultValue={c.property_type ?? ""} className="focus-gold rounded-lg border border-ink/15 px-2 py-1.5 text-xs">
                <option value="">Any Property Type</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input name="min_price" type="number" placeholder="Min price" defaultValue={c.min_price ?? ""} className="focus-gold rounded-lg border border-ink/15 px-2 py-1.5 text-xs" />
                <input name="max_price" type="number" placeholder="Max price" defaultValue={c.max_price ?? ""} className="focus-gold rounded-lg border border-ink/15 px-2 py-1.5 text-xs" />
                <input name="min_bedrooms" type="number" placeholder="Min beds" defaultValue={c.min_bedrooms ?? ""} className="focus-gold rounded-lg border border-ink/15 px-2 py-1.5 text-xs" />
                <input name="min_bathrooms" type="number" step="0.5" placeholder="Min baths" defaultValue={c.min_bathrooms ?? ""} className="focus-gold rounded-lg border border-ink/15 px-2 py-1.5 text-xs" />
                <input name="min_sqft" type="number" placeholder="Min sqft" defaultValue={c.min_sqft ?? ""} className="focus-gold rounded-lg border border-ink/15 px-2 py-1.5 text-xs" />
                <input name="max_repair_budget" type="number" placeholder="Max repair budget" defaultValue={c.max_repair_budget ?? ""} className="focus-gold rounded-lg border border-ink/15 px-2 py-1.5 text-xs" />
              </div>
              <select name="preferred_strategy" defaultValue={c.preferred_strategy ?? ""} className="focus-gold rounded-lg border border-ink/15 px-2 py-1.5 text-xs">
                <option value="">Preferred Strategy</option>
                {STRATEGIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button type="submit" className="focus-gold rounded-full bg-gold px-4 py-1.5 text-xs font-semibold text-ink hover:bg-gold-light">
                  Save
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="focus-gold text-xs font-semibold text-ink/50 hover:underline">
                  Cancel
                </button>
              </div>
            </form>
          </li>
        ) : (
          <li key={c.id} className="flex items-start justify-between gap-2 rounded-lg border border-ink/10 p-2 text-xs">
            <span>
              {c.property_type ?? "Any type"} · {c.min_price ? `$${c.min_price.toLocaleString()}` : "any"}–
              {c.max_price ? `$${c.max_price.toLocaleString()}` : "any"}
              {c.preferred_strategy ? ` · ${c.preferred_strategy}` : ""}
            </span>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => setEditingId(c.id)} className="font-semibold text-gold-dark hover:underline">
                Edit
              </button>
              <form
                action={async () => {
                  await onRemove(c.id);
                }}
              >
                <button type="submit" className="text-red-600 hover:underline">
                  Remove
                </button>
              </form>
            </div>
          </li>
        )
      )}
      {criteria.length === 0 && <p className="text-xs text-ink/30">No criteria yet.</p>}
    </ul>
  );
}
