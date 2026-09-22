/**
 * Equity is a straightforward calculation, not something that needs an AI
 * model's judgment — (current value − mortgage payoff balance) / current
 * value. Computed on the fly wherever it's shown rather than stored, so it
 * can never go stale after either input is edited. Returns null when either
 * number is missing (nothing to compute yet) rather than a misleading 0%.
 */
export function calculateEquityPercent(currentValue: number | null, mortgageBalance: number | null): number | null {
  if (currentValue == null || mortgageBalance == null || currentValue <= 0) return null;
  const equity = ((currentValue - mortgageBalance) / currentValue) * 100;
  return Math.round(equity * 10) / 10;
}

export function calculateEquityDollars(currentValue: number | null, mortgageBalance: number | null): number | null {
  if (currentValue == null || mortgageBalance == null) return null;
  return currentValue - mortgageBalance;
}
