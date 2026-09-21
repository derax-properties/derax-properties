import type { CashBuyer, BuyerZipCode, BuyerInvestmentCriteria, SellerSubmission } from "./types";

export interface BuyerMatchReason {
  label: string;
  matched: boolean;
}

export interface BuyerMatch {
  buyer: CashBuyer;
  score: number; // 0-100, purely for sorting — always shown alongside the reasons, never alone
  reasons: BuyerMatchReason[];
}

/**
 * Explainable, tiered buyer matching (plan doc: AI may calculate, match, and
 * flag — it never auto-selects or auto-contacts a buyer). This returns a
 * ranked list of candidates with the exact reasons behind each score so an
 * admin can see why a buyer was suggested before doing anything with it.
 * Nothing here writes to the database or contacts anyone.
 */
export function matchBuyersForLead(
  lead: SellerSubmission,
  buyers: CashBuyer[],
  zipsByBuyer: Map<string, BuyerZipCode[]>,
  criteriaByBuyer: Map<string, BuyerInvestmentCriteria[]>
): BuyerMatch[] {
  const askingPrice = lead.asking_price ? parseFloat(lead.asking_price.replace(/[^0-9.]/g, "")) : null;

  const matches: BuyerMatch[] = buyers
    .filter((b) => b.status === "Active")
    .map((buyer) => {
      const zips = zipsByBuyer.get(buyer.id) ?? [];
      const criteriaList = criteriaByBuyer.get(buyer.id) ?? [];
      const reasons: BuyerMatchReason[] = [];
      let score = 0;

      // ZIP coverage — the strongest single signal, since a buyer who
      // doesn't buy in this area at all is not a real match regardless of
      // everything else.
      const zipMatch = zips.some((z) => z.zip === lead.zip);
      reasons.push({ label: `Buys in ZIP ${lead.zip}`, matched: zipMatch });
      if (zipMatch) score += 40;

      // Investment criteria — checked against whichever of the buyer's
      // criteria rows fits best; a buyer with no criteria on file just
      // skips these checks rather than being penalized for missing data.
      if (criteriaList.length === 0) {
        reasons.push({ label: "No investment criteria on file yet", matched: false });
      } else {
        const best = criteriaList.find((c) => matchesPropertyType(c, lead)) ?? criteriaList[0];

        const typeMatch = !best.property_type || best.property_type === lead.property_type;
        reasons.push({ label: `Wants ${best.property_type ?? "any property type"}`, matched: typeMatch });
        if (typeMatch) score += 15;

        if (askingPrice != null) {
          const priceMatch =
            (best.min_price == null || askingPrice >= best.min_price) &&
            (best.max_price == null || askingPrice <= best.max_price);
          reasons.push({
            label: `Price fits ${formatRange(best.min_price, best.max_price)}`,
            matched: priceMatch,
          });
          if (priceMatch) score += 20;
        }

        if (lead.bedrooms != null && best.min_bedrooms != null) {
          const bedsMatch = lead.bedrooms >= best.min_bedrooms;
          reasons.push({ label: `At least ${best.min_bedrooms} bed`, matched: bedsMatch });
          if (bedsMatch) score += 10;
        }

        if (best.preferred_strategy) {
          reasons.push({ label: `Prefers ${best.preferred_strategy}`, matched: true });
          score += 5;
        }
      }

      if (buyer.proof_of_funds_on_file) {
        reasons.push({ label: "Proof of funds on file", matched: true });
        score += 10;
      }

      return { buyer, score: Math.min(100, score), reasons };
    })
    // Only surface buyers with at least some real signal (ZIP match or
    // scored criteria) — an empty-reasons match is noise, not a suggestion.
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  return matches;
}

function matchesPropertyType(criteria: BuyerInvestmentCriteria, lead: SellerSubmission): boolean {
  return !criteria.property_type || criteria.property_type === lead.property_type;
}

function formatRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return "any price";
  if (min == null) return `up to $${max!.toLocaleString()}`;
  if (max == null) return `$${min.toLocaleString()}+`;
  return `$${min.toLocaleString()}–$${max.toLocaleString()}`;
}

export function matchTier(score: number): "Strong" | "Possible" | "Weak" {
  if (score >= 60) return "Strong";
  if (score >= 30) return "Possible";
  return "Weak";
}
