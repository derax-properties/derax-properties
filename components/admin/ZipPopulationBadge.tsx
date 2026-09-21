"use client";

import { useState } from "react";
import type { ZipPopulationCache } from "@/lib/types";

/**
 * A small ⓘ badge next to a ZIP code. Desktop: hover to reveal the
 * population panel. Mobile: tap to toggle it. Deliberately subtle — this
 * never crowds out the core property fields (beds/baths/sqft/price) an
 * admin scans a card for first. See plan doc section 56.
 */
export function ZipPopulationBadge({ zip }: { zip: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ZipPopulationCache | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (data || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/population?zip=${zip}`);
      setData(await res.json());
    } catch {
      setData({ zip, population: null, city: null, county: null, state: null, data_source: "", data_year: null, lookup_failed: true, updated_at: "" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <span
      className="relative inline-block"
      onClick={(e) => {
        // This badge is used inline inside card/row links elsewhere in the
        // CRM (the Kanban board in particular) — stop the click here so
        // tapping ⓘ never also triggers the surrounding link's navigation.
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseEnter={() => {
        setOpen(true);
        load();
      }}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          load();
        }}
        className="ml-1 text-ink/30 hover:text-gold-dark"
        aria-label={`Population info for ZIP ${zip}`}
      >
        ⓘ
      </button>
      {open && (
        <span
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-ink/10 bg-white p-3 text-xs shadow-card"
        >
          {loading && <span className="text-ink/40">Loading…</span>}
          {!loading && data && data.lookup_failed && (
            <span className="text-ink/40">Population data unavailable.</span>
          )}
          {!loading && data && !data.lookup_failed && (
            <>
              <span className="block font-semibold text-ink">
                Population (ZCTA {zip} estimate): {data.population?.toLocaleString() ?? "—"}
              </span>
              <span className="mt-1 block text-ink/40">
                {data.data_source}
                {data.data_year ? ` · ${data.data_year}` : ""}
              </span>
            </>
          )}
        </span>
      )}
    </span>
  );
}
