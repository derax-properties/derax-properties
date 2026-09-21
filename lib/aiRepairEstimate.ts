import { REPAIR_CATEGORIES, type RepairCategory } from "./types";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
// "-latest" aliases track the current recommended model for that family, so
// this stays valid as Anthropic ships newer models without a code change.
// Override with ANTHROPIC_MODEL if you want a specific pinned model instead.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";

export interface AiRepairEstimateResult {
  costs: Record<RepairCategory, number>;
  summary: string;
}

export interface AiRepairEstimateInput {
  propertyType: string;
  overallCondition: string | null;
  sqft: number | null;
  yearBuilt: number | null;
  issues: string[];
  additionalDetails: string | null;
}

/**
 * A real LLM call (Anthropic Messages API) that reasons only about a
 * lead's own stored condition data to suggest a starting repair cost per
 * category — never anything invented about the property. This is
 * explicitly a starting point: every value it returns lands in
 * repair_items tagged source='ai', stays fully editable, and the lead page
 * always shows the fixed disclaimer next to it. Returns null on any
 * failure (no API key configured, network error, malformed response)
 * rather than fabricating a number — callers must treat null as "AI
 * estimate unavailable," never silently show a guessed cost as real.
 */
export async function estimateRepairsWithAI(input: AiRepairEstimateInput): Promise<AiRepairEstimateResult | null> {
  if (!ANTHROPIC_API_KEY) {
    console.warn("[aiRepairEstimate] ANTHROPIC_API_KEY not set — skipping AI estimate.");
    return null;
  }

  const prompt = `You are helping a real estate wholesaler in the Atlanta, GA market rough-estimate repair costs for a distressed property, based only on the information given below. Never invent details that aren't provided.

Property type: ${input.propertyType}
Overall condition: ${input.overallCondition ?? "Not specified"}
Square footage: ${input.sqft ?? "Not specified"}
Year built: ${input.yearBuilt ?? "Not specified"}
Reported issues: ${input.issues.length ? input.issues.join(", ") : "None reported"}
Additional notes: ${input.additionalDetails ?? "None"}

Estimate a rough repair cost in USD for each category below, reflecting typical Atlanta-area investor-grade (not retail) repair costs for a property in this condition. If a category shows no sign of needing work, give it a low or zero estimate rather than skipping it. Respond with ONLY a JSON object, no other text, in exactly this shape:
{"costs": {${REPAIR_CATEGORIES.map((c) => `"${c}": number`).join(", ")}}, "summary": "one sentence explaining the condition-driven reasoning"}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      console.error("[aiRepairEstimate] Anthropic API error:", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as { content?: Array<{ text?: string }> };
    const text = data?.content?.[0]?.text;
    if (typeof text !== "string") return null;

    // Asked for JSON only, but strip any accidental code fence or stray
    // prose defensively before parsing.
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as { costs?: Record<string, unknown>; summary?: unknown };

    if (!parsed || typeof parsed !== "object" || !parsed.costs) return null;

    const costs = {} as Record<RepairCategory, number>;
    for (const category of REPAIR_CATEGORIES) {
      const v = parsed.costs[category];
      costs[category] = typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0;
    }

    return {
      costs,
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
    };
  } catch (error) {
    console.error("[aiRepairEstimate] Failed to get AI estimate:", error);
    return null;
  }
}
