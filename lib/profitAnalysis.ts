/**
 * Deal math: MAO, exit-strategy-aware profit, and a disposition suggestion.
 * Every function here is a pure calculation — nothing writes to the
 * database, contacts anyone, or picks an exit strategy on its own. The
 * "AI Disposition Analysis" the plan describes is implemented as an
 * explainable rule-based heuristic (no LLM call is wired up in this
 * environment); `recommendExitStrategy` always returns its reasoning
 * alongside the suggestion so an admin can see exactly why, and it's a
 * suggestion, never an automatic assignment.
 */

export interface DealInputs {
  arvEstimate: number | null;
  estimatedRepairs: number | null;
  purchasePrice: number | null;
  assignmentFee: number | null;
  exitStrategy: "Wholesale" | "Assignment" | "Double Close" | "Fix & Flip" | "Buy & Hold" | null;
}

const MAO_MULTIPLIER = 0.7; // standard 70% rule
const HOLDING_COST_RATE = 0.02; // rough monthly carrying cost as a % of ARV, for a 4-month flip default
const SELLING_COST_RATE = 0.08; // agent commission + closing costs on resale

export function calculateMAO(arv: number, repairs: number, multiplier: number = MAO_MULTIPLIER): number {
  return Math.max(0, arv * multiplier - repairs);
}

export function calculateWholesaleProfit(contractPrice: number, assignmentFee: number): number {
  // In a straight assignment, the wholesaler's profit IS the assignment
  // fee — contractPrice is shown for context, not subtracted twice.
  void contractPrice;
  return assignmentFee;
}

export function calculateDoubleCloseProfit(purchasePrice: number, resalePrice: number, closingCosts = 0): number {
  return resalePrice - purchasePrice - closingCosts;
}

export function calculateFixFlipProfit(
  arv: number,
  purchasePrice: number,
  repairs: number,
  months = 4
): { profit: number; holdingCosts: number; sellingCosts: number } {
  const holdingCosts = arv * HOLDING_COST_RATE * months;
  const sellingCosts = arv * SELLING_COST_RATE;
  const profit = arv - purchasePrice - repairs - holdingCosts - sellingCosts;
  return { profit, holdingCosts, sellingCosts };
}

export interface DispositionRecommendation {
  suggestedStrategy: DealInputs["exitStrategy"];
  reasons: string[];
  spread: number | null;
}

/**
 * A transparent, rule-based suggestion — not a black box. Every rule that
 * fired is listed in `reasons` so the admin sees exactly why before acting
 * on it. This never gets written back to the deal automatically.
 */
export function recommendExitStrategy(inputs: DealInputs): DispositionRecommendation {
  const { arvEstimate, estimatedRepairs, purchasePrice } = inputs;
  const reasons: string[] = [];

  if (arvEstimate == null || purchasePrice == null) {
    return {
      suggestedStrategy: null,
      reasons: ["Not enough data yet — enter an ARV estimate and purchase price to get a suggestion."],
      spread: null,
    };
  }

  const repairs = estimatedRepairs ?? 0;
  const mao = calculateMAO(arvEstimate, repairs);
  const spread = mao - purchasePrice;

  if (spread <= 0) {
    reasons.push(`Purchase price ($${purchasePrice.toLocaleString()}) is at or above the 70% MAO ($${mao.toLocaleString()}) — thin or negative margin at these numbers.`);
    return { suggestedStrategy: null, reasons, spread };
  }

  if (spread < 10000) {
    reasons.push(`Spread to MAO is $${spread.toLocaleString()} — usually too thin for a fix & flip once holding/selling costs are added.`);
    reasons.push("A wholesale assignment locks in this spread without carrying repair or holding risk.");
    return { suggestedStrategy: "Wholesale", reasons, spread };
  }

  const { profit: flipProfit } = calculateFixFlipProfit(arvEstimate, purchasePrice, repairs);
  reasons.push(`Estimated fix & flip profit after holding and selling costs: $${Math.round(flipProfit).toLocaleString()}.`);

  if (flipProfit > spread * 1.5) {
    reasons.push("Flip profit clears a wholesale assignment by a wide margin — worth considering if you want to take on the rehab.");
    return { suggestedStrategy: "Fix & Flip", reasons, spread };
  }

  reasons.push(`Wholesale spread ($${spread.toLocaleString()}) is close to the flip profit without the rehab risk or timeline.`);
  return { suggestedStrategy: "Wholesale", reasons, spread };
}
