const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
// Family-level aliases (no date suffix) track the current recommended
// snapshot for that model family, updated by Anthropic within about a week
// of a new release — but a NEW model family (e.g. Haiku 3.5 -> Haiku 4.5)
// gets its own alias name, so this still needs a code change whenever
// Anthropic retires the underlying family, which is exactly what happened
// to the previous "claude-3-5-haiku-latest" value here (it started 404ing
// once Anthropic retired that model). Override with ANTHROPIC_MODEL if you
// want a specific pinned dated snapshot instead of the family alias.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

export interface AiRepairEstimateResult {
  costs: Record<string, number>;
  summary: string;
}

export interface AiRepairEstimateInput {
  propertyType: string;
  overallCondition: string | null;
  sqft: number | null;
  yearBuilt: number | null;
  issues: string[];
  additionalDetails: string | null;
  // The admin explicitly checks which repair categories apply before
  // asking for an estimate — the AI only prices these, so a category the
  // admin didn't select (or already priced manually) is never touched.
  categories: string[];
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

  if (input.categories.length === 0) {
    console.warn("[aiRepairEstimate] No categories selected — skipping AI estimate.");
    return null;
  }

  const prompt = `You are helping a real estate wholesaler in the Atlanta, GA market rough-estimate repair costs for a distressed property, based only on the information given below. Never invent details that aren't provided.

Property type: ${input.propertyType}
Overall condition: ${input.overallCondition ?? "Not specified"}
Square footage: ${input.sqft ?? "Not specified"}
Year built: ${input.yearBuilt ?? "Not specified"}
Reported issues: ${input.issues.length ? input.issues.join(", ") : "None reported"}
Additional notes: ${input.additionalDetails ?? "None"}

The admin has specifically flagged these repair categories as applicable to this property — estimate a rough repair cost in USD for ONLY these categories, reflecting typical Atlanta-area investor-grade (not retail) repair costs for a property in this condition: ${input.categories.join(", ")}.

Respond with ONLY a JSON object, no other text, in exactly this shape:
{"costs": {${input.categories.map((c) => `"${c}": number`).join(", ")}}, "summary": "one sentence explaining the condition-driven reasoning"}`;

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

    const costs: Record<string, number> = {};
    for (const category of input.categories) {
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
