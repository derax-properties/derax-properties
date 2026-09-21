import { NextResponse } from "next/server";
import { searchAddress } from "@/lib/geocoding";

/**
 * Proxies address-autocomplete lookups so the browser never talks to the
 * geocoding provider directly (keeps the required User-Agent server-side
 * and gives us one place to switch providers later). Used by
 * <AddressAutocomplete> on the public seller form.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (q.trim().length < 4) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const suggestions = await searchAddress(q);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("[api/geocode] lookup failed:", error);
    // Honest failure, not a fabricated result — the client shows its own
    // "we couldn't confirm this address" messaging when suggestions is empty
    // and the seller has already picked nothing.
    return NextResponse.json({ suggestions: [], error: "lookup_failed" }, { status: 200 });
  }
}
