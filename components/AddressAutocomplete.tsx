"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/utils";

export interface ParsedAddress {
  formatted_address: string;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  county: string | null;
  country: string;
  lat: number;
  lng: number;
  place_id: string;
  confidence: "high" | "medium" | "low";
}

interface Props {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  /** Currently selected address, or null if none has been confirmed yet. */
  selected: ParsedAddress | null;
  onSelect: (address: ParsedAddress) => void;
  onClear: () => void;
}

const fieldClasses =
  "focus-gold w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink/35";

/**
 * A single Zillow-style address field: the seller types, sees live
 * suggestions, and picks one. Once picked, the structured fields (street,
 * city, state, zip, county, lat/lng, place id) are already parsed and
 * carried on `selected` — never asked as separate questions on this form.
 * See plan doc sections 57-61.
 */
export function AddressAutocomplete({ id, label, required, error, selected, onSelect, onClear }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ParsedAddress[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lookupFailed, setLookupFailed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 4) {
      setSuggestions([]);
      setLookupFailed(false);
      return;
    }
    const thisRequestId = ++requestIdRef.current;
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (requestIdRef.current !== thisRequestId) return; // stale response
        setSuggestions(data.suggestions ?? []);
        setLookupFailed(Boolean(data.error) && (data.suggestions ?? []).length === 0);
      } catch {
        if (requestIdRef.current === thisRequestId) {
          setSuggestions([]);
          setLookupFailed(true);
        }
      } finally {
        if (requestIdRef.current === thisRequestId) setLoading(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  if (selected) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink/80">
          {label} {required && <span className="text-gold-dark">*</span>}
        </label>
        <div className="flex items-start justify-between gap-3 rounded-lg border border-gold/40 bg-gold/5 px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-gold-dark" aria-hidden>
              ✓
            </span>
            <span className="text-sm text-ink">{selected.formatted_address}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClear();
              setQuery("");
              setSuggestions([]);
            }}
            className="focus-gold shrink-0 text-xs font-semibold text-gold-dark hover:underline"
          >
            Change address
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink/80">
        {label} {required && <span className="text-gold-dark">*</span>}
      </label>
      <input
        id={id}
        type="text"
        autoComplete="off"
        placeholder="Start typing the property address…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-invalid={!!error}
        className={cx(fieldClasses, error && "border-red-500")}
      />

      {open && query.trim().length >= 4 && (
        <div className="absolute top-full z-20 mt-1 w-full overflow-hidden rounded-lg border border-ink/10 bg-white shadow-card">
          {loading && <p className="px-4 py-3 text-sm text-ink/50">Searching…</p>}
          {!loading && suggestions.length === 0 && !lookupFailed && (
            <p className="px-4 py-3 text-sm text-ink/50">No matches yet — keep typing.</p>
          )}
          {!loading && lookupFailed && (
            <p className="px-4 py-3 text-sm text-ink/50">
              We couldn&apos;t confirm this address. Please check the address and try again.
            </p>
          )}
          {!loading &&
            suggestions.map((s) => (
              <button
                key={s.place_id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(s);
                  setOpen(false);
                }}
                className="block w-full px-4 py-2.5 text-left text-sm text-ink hover:bg-gold/10"
              >
                {s.formatted_address}
              </button>
            ))}
        </div>
      )}

      {error && (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
