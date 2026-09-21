/**
 * Address lookup + parsing for the public seller form's single autocomplete
 * field (plan doc sections 57-61). Implemented against OpenStreetMap's
 * Nominatim search API — a free, no-API-key "equivalent service" to Google
 * Places Autocomplete. To swap in Google Places (or any other provider)
 * later, only this file needs to change: everything else calls
 * `searchAddress()` and reads back the same `ParsedAddress` shape.
 *
 * Nominatim's usage policy requires a descriptive User-Agent and caps
 * request volume — fine for a low-volume seller form, but if this grows
 * into serious traffic, move to a paid provider (Google Places, Mapbox,
 * SmartyStreets) using the same interface.
 */

export interface AddressSuggestion {
  place_id: string;
  formatted_address: string;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  county: string | null;
  country: string;
  lat: number;
  lng: number;
  confidence: "high" | "medium" | "low";
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "DeraxPropertiesSellerForm/1.0 (+https://www.deraxproperties.com)";

function confidenceFromResult(result: any): "high" | "medium" | "low" {
  // Nominatim's `importance` and whether it resolved down to house-number
  // level are the best signals it gives us for how sure we should be.
  const addr = result.address ?? {};
  const hasHouseNumber = Boolean(addr.house_number);
  const importance = typeof result.importance === "number" ? result.importance : 0;

  if (hasHouseNumber && importance > 0.3) return "high";
  if (hasHouseNumber || importance > 0.4) return "medium";
  return "low";
}

function parseResult(result: any): AddressSuggestion {
  const addr = result.address ?? {};
  const street = [addr.house_number, addr.road].filter(Boolean).join(" ") || null;

  return {
    place_id: String(result.place_id ?? result.osm_id ?? ""),
    formatted_address: result.display_name ?? "",
    street,
    city: addr.city || addr.town || addr.village || addr.hamlet || null,
    state: addr.state_code || (addr.state ? String(addr.state).slice(0, 2).toUpperCase() : null),
    zip: addr.postcode || null,
    county: addr.county || null,
    country: addr.country_code ? String(addr.country_code).toUpperCase() : "US",
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    confidence: confidenceFromResult(result),
  };
}

export async function searchAddress(query: string): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 4) return [];

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "us");
  url.searchParams.set("limit", "5");
  url.searchParams.set("q", trimmed);

  const response = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
    // Nominatim is a shared public service — never cache stale results,
    // but also don't hammer it: the API route debounces on the client side.
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Address lookup failed (${response.status})`);
  }

  const results = (await response.json()) as any[];
  return results.map(parseResult).filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
}
