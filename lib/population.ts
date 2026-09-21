import { createAdminSupabaseClient } from "./supabase/admin";
import type { ZipPopulationCache } from "./types";

const CACHE_MAX_AGE_DAYS = 180;
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
  if (cached) {
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
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;

    const rows = (await res.json()) as string[][];
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
