import { createAdminSupabaseClient } from "./supabase/admin";
import type { ZipPopulationCache } from "./types";

const CACHE_MAX_AGE_DAYS = 180;
// A *failed* lookup (network hiccup, census.gov blocking the request that
// day, etc.) is transient, not a fact about the ZIP — it should never be
// remembered for as long as a real population number. Before this, a
// single failure got cached as lookup_failed:true and then served back
// as-is for up to 180 days, so fixing the actual cause (see the
// User-Agent fix above) didn't help anyone who'd already hit the bug
// once: they kept seeing "Population data unavailable" from the stale
// failed cache row itself, never touching the (now-working) API again
// until that row aged out. Retrying on every request when the cached
// result was a failure — regardless of how old it is — means a fix like
// that one takes effect on the very next click instead of up to 6 months
// later.
const DATA_YEAR = 2022; // ACS 5-year estimate vintage currently queried
const DATA_SOURCE = "U.S. Census Bureau (ACS 5-Year, ZCTA)";

/**
 * Population lookup for a ZIP, backed by a per-ZIP cache (zip_population_cache).
 * A ZCTA (ZIP Code Tabulation Area) isn't always identical to a USPS ZIP
 * boundary, so callers should label this as an estimate, never an exact
 * count — see the labeling in the Location Intelligence panel.
 *
 * On any failure (network, no match, malformed response) this returns
 * lookup_failed: true rather than fabricating a number — callers must show
 * "Population data unavailable", never a guessed value or a bare 0.
 */
export async function getPopulationForZip(zip: string): Promise<ZipPopulationCache> {
  const admin = createAdminSupabaseClient();

  const { data: cached } = await admin.from("zip_population_cache").select("*").eq("zip", zip).maybeSingle();
  if (cached && !cached.lookup_failed) {
    const ageDays = (Date.now() - new Date(cached.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays < CACHE_MAX_AGE_DAYS) return cached as ZipPopulationCache;
  }

  const fresh = await fetchFromCensus(zip);
  // fetchFromCensus only requests the population column (B01003_001E) —
  // it never returns city/county/state, so those always come from
  // whatever was cached before, never fabricated from this response.
  const row: ZipPopulationCache = {
    zip,
    population: fresh?.population ?? null,
    city: cached?.city ?? null,
    county: cached?.county ?? null,
    state: cached?.state ?? null,
    data_source: DATA_SOURCE,
    data_year: fresh ? DATA_YEAR : cached?.data_year ?? null,
    lookup_failed: !fresh,
    updated_at: new Date().toISOString(),
  };

  await admin.from("zip_population_cache").upsert(row, { onConflict: "zip" });
  return row;
}

async function fetchFromCensus(zip: string): Promise<{ population: number } | null> {
  try {
    const url = `https://api.census.gov/data/${DATA_YEAR}/acs/acs5?get=NAME,B01003_001E&for=zip%20code%20tabulation%20area:${encodeURIComponent(zip)}`;
    const res = await fetch(url, {
      cache: "no-store",
      // census.gov was returning a 200 with an HTML page (starting
      // "<html style...") instead of the actual JSON — the classic sign of
      // a bot-protection/challenge page, since Node's fetch sends no
      // User-Agent by default and a lot of gov/enterprise sites wall off
      // requests that don't look like they came from an actual browser.
      // Sending a normal browser-ish User-Agent (and asking for JSON
      // explicitly) is the standard fix for that, and costs nothing if
      // that wasn't the actual cause.
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      console.error("[population] Census lookup returned non-OK status:", res.status);
      return null;
    }

    // Confirm it's actually JSON before parsing — if census.gov (or
    // something in front of it) ever sends an HTML page again, this fails
    // clearly with the page's own start logged, instead of a generic
    // "Unexpected token '<'" JSON.parse crash that doesn't say why.
    const contentType = res.headers.get("content-type") ?? "";
    const bodyText = await res.text();
    if (!contentType.includes("json")) {
      console.error(
        "[population] Census lookup returned non-JSON content-type:",
        contentType,
        "— first 200 chars:",
        bodyText.slice(0, 200)
      );
      return null;
    }

    const rows = JSON.parse(bodyText) as string[][];
    // rows[0] is the header; rows[1] is the data row when a match is found.
    if (!rows || rows.length < 2) return null;

    const populationIndex = rows[0].indexOf("B01003_001E");
    const populationRaw = rows[1][populationIndex];
    const population = Number(populationRaw);
    if (!Number.isFinite(population)) return null;

    return { population };
  } catch (error) {
    console.error("[population] Census lookup failed:", error);
    return null;
  }
}
