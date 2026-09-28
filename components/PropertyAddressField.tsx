"use client";

import { useState } from "react";
import { AddressAutocomplete, type ParsedAddress } from "./AddressAutocomplete";
import { cx } from "@/lib/utils";

const fieldClasses =
  "focus-gold w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink/35";

type ManualAddress = { street: string; city: string; state: string; zip: string };

/**
 * Property address entry for VA intake and the CRM's "Add Lead" form.
 *
 * Defaults to plain manual fields (Street / City / State / ZIP) — no
 * external address lookup required, so a lead always saves regardless of
 * whether the geocoding provider is reachable. That lookup was previously
 * the ONLY way to fill these fields (a required autocomplete-and-select
 * step): if it failed or timed out, city/state/zip stayed empty and the
 * server action refused to save the lead at all ("please select from the
 * suggestions"). That's the bug this fixes.
 *
 * The address-autocomplete search (AddressAutocomplete.tsx) is kept, not
 * removed — it's offered as an opt-in "Search for it instead" shortcut for
 * when someone wants the faster, auto-filled experience — but it is no
 * longer required, and never blocks a save. Manually entered addresses are
 * stored with address_confidence "unresolved" (a value the schema already
 * supports, migration 0001) instead of high/medium/low, and skip
 * lat/lng/place_id/county, none of which are required to save a lead.
 */
export function PropertyAddressField({ required = true }: { required?: boolean }) {
  const [mode, setMode] = useState<"manual" | "search">("manual");
  const [address, setAddress] = useState<ParsedAddress | null>(null);
  const [manual, setManual] = useState<ManualAddress>({ street: "", city: "", state: "", zip: "" });

  const usingSearch = mode === "search" && !!address;

  const formatted = usingSearch
    ? address!.formatted_address
    : [manual.street, manual.city, manual.state, manual.zip].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-2">
      {mode === "search" ? (
        <div className="flex flex-col gap-1.5">
          <AddressAutocomplete
            id="property_address_search"
            label="Property Address"
            required={required}
            selected={address}
            onSelect={setAddress}
            onClear={() => setAddress(null)}
          />
          <button
            type="button"
            onClick={() => {
              setMode("manual");
              setAddress(null);
            }}
            className="focus-gold self-start text-xs font-semibold text-gold-dark hover:underline"
          >
            Enter address manually instead
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink/80">
            Property Address {required && <span className="text-gold-dark">*</span>}
          </label>
          <input
            type="text"
            required={required}
            placeholder="Street address"
            value={manual.street}
            onChange={(e) => setManual((m) => ({ ...m, street: e.target.value }))}
            className={fieldClasses}
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input
              type="text"
              required={required}
              placeholder="City"
              value={manual.city}
              onChange={(e) => setManual((m) => ({ ...m, city: e.target.value }))}
              className={cx(fieldClasses)}
            />
            <input
              type="text"
              required={required}
              placeholder="State"
              maxLength={2}
              value={manual.state}
              onChange={(e) => setManual((m) => ({ ...m, state: e.target.value.toUpperCase() }))}
              className={cx(fieldClasses)}
            />
            <input
              type="text"
              required={required}
              placeholder="ZIP"
              value={manual.zip}
              onChange={(e) => setManual((m) => ({ ...m, zip: e.target.value }))}
              className={cx(fieldClasses)}
            />
          </div>
          <button
            type="button"
            onClick={() => setMode("search")}
            className="focus-gold self-start text-xs font-semibold text-gold-dark hover:underline"
          >
            Search for it instead
          </button>
        </div>
      )}

      <input type="hidden" name="property_address" value={usingSearch ? address!.street ?? address!.formatted_address : manual.street} />
      <input type="hidden" name="city" value={usingSearch ? address!.city ?? "" : manual.city} />
      <input type="hidden" name="state" value={usingSearch ? address!.state ?? "" : manual.state} />
      <input type="hidden" name="zip" value={usingSearch ? address!.zip ?? "" : manual.zip} />
      <input type="hidden" name="county" value={usingSearch ? address!.county ?? "" : ""} />
      <input type="hidden" name="formatted_address" value={formatted} />
      <input type="hidden" name="latitude" value={usingSearch ? String(address!.lat) : ""} />
      <input type="hidden" name="longitude" value={usingSearch ? String(address!.lng) : ""} />
      <input type="hidden" name="place_id" value={usingSearch ? address!.place_id : ""} />
      <input type="hidden" name="address_confidence" value={usingSearch ? address!.confidence : "unresolved"} />
    </div>
  );
}
