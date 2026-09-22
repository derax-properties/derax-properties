"use client";

import { useState } from "react";
import { AddressAutocomplete, type ParsedAddress } from "./AddressAutocomplete";

/**
 * Drop-in replacement for a raw "Property Address" text input plus separate
 * City / State / ZIP inputs. Wraps the same Zillow-style AddressAutocomplete
 * already used on the public seller form (app/sell-your-property) so every
 * lead-entry path — website, VA intake, and the CRM's own "Add Lead" form —
 * gives the same one-field typing experience.
 *
 * This is a plain "use client" component with native `name` attributes on
 * hidden inputs, so it drops into an existing `<form action={serverAction}>`
 * with zero extra wiring — same pattern as LeadPhotosField. The surrounding
 * server action keeps reading `property_address`/`city`/`state`/`zip` from
 * FormData exactly as before; those values now just come from the parsed
 * autocomplete result instead of being typed by hand, which also means
 * they're clean/consistent (proper casing, valid ZIP) instead of whatever a
 * person free-types. The extra hidden fields (formatted_address, lat/lng,
 * place_id, county) are additive — they let VA/Admin-entered leads use the
 * same duplicate-detection and location-intelligence columns that
 * website leads already populate; nothing existing is removed.
 */
export function PropertyAddressField({ required = true }: { required?: boolean }) {
  const [address, setAddress] = useState<ParsedAddress | null>(null);

  return (
    <div className="flex flex-col gap-1.5">
      <AddressAutocomplete
        id="property_address_search"
        label="Property Address"
        required={required}
        selected={address}
        onSelect={setAddress}
        onClear={() => setAddress(null)}
      />
      <input type="hidden" name="property_address" value={address?.street ?? address?.formatted_address ?? ""} />
      <input type="hidden" name="city" value={address?.city ?? ""} />
      <input type="hidden" name="state" value={address?.state ?? ""} />
      <input type="hidden" name="zip" value={address?.zip ?? ""} />
      <input type="hidden" name="county" value={address?.county ?? ""} />
      <input type="hidden" name="formatted_address" value={address?.formatted_address ?? ""} />
      <input type="hidden" name="latitude" value={address ? String(address.lat) : ""} />
      <input type="hidden" name="longitude" value={address ? String(address.lng) : ""} />
      <input type="hidden" name="place_id" value={address?.place_id ?? ""} />
      <input type="hidden" name="address_confidence" value={address?.confidence ?? ""} />
    </div>
  );
}
