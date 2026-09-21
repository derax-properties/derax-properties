import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/storage";
import type { SellerSubmission } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import {
  updateLead,
  logActivity,
  generateLocationInsight,
  updateUnderwriting,
  updateRepairItems,
  estimateRepairsWithAIAction,
} from "./actions";
import { getPopulationForZip } from "@/lib/population";
import { matchBuyersForLead, matchTier } from "@/lib/buyerMatching";
import type { CashBuyer, BuyerZipCode, BuyerInvestmentCriteria, RepairItem } from "@/lib/types";
import { REPAIR_CATEGORIES } from "@/lib/types";
import { createDeal } from "../../deals/actions";
import { calculateMAO } from "@/lib/profitAnalysis";

const PIPELINE_STAGES = ["New Lead", "Contacted", "Qualified", "Offer Made", "Under Contract", "Closed", "Dead"];
const MOTIVATION_LEVELS = ["Hot", "Warm", "Cold"];
const LEAD_SOURCES = ["Website", "VA Entry", "Self-Entered", "Auction", "Referral", "Other"];
const LEAD_TYPES = ["Off-Market", "On-Market", "Trustee Sale", "Probate", "Pre-Foreclosure", "Other"];

export const metadata = { title: "Lead Detail", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const STATUSES = [
  "New",
  "Contacted",
  "Qualified",
  "Offer Made",
  "Under Contract",
  "Closed",
  "Not a Fit",
  "Follow Up",
];

const ISSUE_LABELS: Array<[keyof SellerSubmission, string]> = [
  ["foundation_issue", "Foundation"],
  ["plumbing_issue", "Plumbing"],
  ["electrical_issue", "Electrical"],
  ["water_damage", "Water damage"],
  ["fire_damage", "Fire damage"],
  ["mold", "Mold"],
  ["structural_issue", "Structural"],
];

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createServerSupabaseClient();

  const { data: lead } = await supabase
    .from("seller_submissions")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!lead) notFound();

  const { data: photoRows } = await supabase
    .from("seller_property_photos")
    .select("*")
    .eq("submission_id", params.id);
  const { data: docRows } = await supabase
    .from("seller_documents")
    .select("*")
    .eq("submission_id", params.id);
  const { data: admins } = await supabase.from("admin_profiles").select("id, full_name");
  const { data: activity } = await supabase
    .from("activity_log")
    .select("*")
    .eq("seller_submission_id", params.id)
    .order("created_at", { ascending: false });

  const population = lead.zip ? await getPopulationForZip(lead.zip) : null;
  const generateLocationInsightWithId = generateLocationInsight.bind(null, params.id, lead.zip);

  const { data: repairItemRows } = await supabase
    .from("repair_items")
    .select("*")
    .eq("seller_submission_id", params.id);
  const repairCostByCategory = new Map<string, number>();
  for (const r of (repairItemRows as RepairItem[]) ?? []) {
    repairCostByCategory.set(r.category, r.cost);
  }
  const updateRepairItemsWithId = updateRepairItems.bind(null, params.id);
  const estimateRepairsWithAIWithId = estimateRepairsWithAIAction.bind(null, params.id);

  const { data: activeBuyers } = await supabase.from("cash_buyers").select("*").eq("status", "Active");
  const buyerIds = (activeBuyers ?? []).map((b) => b.id);
  const [{ data: allZips }, { data: allCriteria }] = await Promise.all([
    buyerIds.length
      ? supabase.from("buyer_zip_codes").select("*").in("buyer_id", buyerIds)
      : Promise.resolve({ data: [] as BuyerZipCode[] }),
    buyerIds.length
      ? supabase.from("buyer_investment_criteria").select("*").in("buyer_id", buyerIds)
      : Promise.resolve({ data: [] as BuyerInvestmentCriteria[] }),
  ]);

  const zipsByBuyer = new Map<string, BuyerZipCode[]>();
  for (const z of (allZips as BuyerZipCode[]) ?? []) {
    zipsByBuyer.set(z.buyer_id, [...(zipsByBuyer.get(z.buyer_id) ?? []), z]);
  }
  const criteriaByBuyer = new Map<string, BuyerInvestmentCriteria[]>();
  for (const c of (allCriteria as BuyerInvestmentCriteria[]) ?? []) {
    criteriaByBuyer.set(c.buyer_id, [...(criteriaByBuyer.get(c.buyer_id) ?? []), c]);
  }

  const { data: existingDeal } = await supabase
    .from("deals")
    .select("id")
    .eq("seller_submission_id", params.id)
    .maybeSingle();

  let duplicateRef: string | null = null;
  if (lead.possible_duplicate_of) {
    const { data: dup } = await supabase
      .from("seller_submissions")
      .select("reference_number")
      .eq("id", lead.possible_duplicate_of)
      .maybeSingle();
    duplicateRef = dup?.reference_number ?? null;
  }

  const photoBucket = process.env.SUPABASE_SELLER_PHOTOS_BUCKET || "seller-photos";
  const docBucket = process.env.SUPABASE_SELLER_DOCS_BUCKET || "seller-documents";

  const photos = await Promise.all(
    (photoRows ?? []).map(async (p) => ({ ...p, url: await getSignedUrl(photoBucket, p.storage_path) }))
  );
  const documents = await Promise.all(
    (docRows ?? []).map(async (d) => ({ ...d, url: await getSignedUrl(docBucket, d.storage_path) }))
  );

  const updateLeadWithId = updateLead.bind(null, params.id);
  const l = lead as SellerSubmission;
  const reportedIssues = ISSUE_LABELS.filter(([key]) => l[key]).map(([, label]) => label);
  const buyerMatches = matchBuyersForLead(l, (activeBuyers as CashBuyer[]) ?? [], zipsByBuyer, criteriaByBuyer);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">
            {l.reference_number}
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink">{l.property_address}</h1>
          <p className="text-sm text-ink/50">
            {l.city}, {l.state} {l.zip} · Submitted {formatDate(l.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={l.status} />
          {existingDeal ? (
            <Link
              href={`/admin/deals/${existingDeal.id}`}
              className="focus-gold rounded-full border border-gold px-4 py-2 text-xs font-semibold text-gold-dark hover:bg-gold hover:text-ink"
            >
              View Deal
            </Link>
          ) : (
            <form action={createDeal.bind(null, params.id)}>
              <button
                type="submit"
                className="focus-gold rounded-full bg-gold px-4 py-2 text-xs font-semibold text-ink hover:bg-gold-light"
              >
                Create Deal
              </button>
            </form>
          )}
        </div>
      </div>

      {l.possible_duplicate_of && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span aria-hidden>⚠</span>
          <span>
            This lead may be a duplicate of{" "}
            {duplicateRef ? (
              <Link href={`/admin/leads/${l.possible_duplicate_of}`} className="font-semibold underline">
                {duplicateRef}
              </Link>
            ) : (
              "another lead"
            )}
            . Nothing was merged automatically — review both before contacting the seller twice.
          </span>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-ink">Lead Detail — {l.first_name} {l.last_name}</h2>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Row label="Address" value={`${l.property_address}, ${l.city}, ${l.state} ${l.zip}`} />
            <Row label="Asking Price" value={l.asking_price ?? "Not specified"} />
            <Row label="Motivation" value={l.motivation_level ?? "—"} />
            <Row label="Best Callback" value={l.best_callback_time ?? "—"} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`tel:${l.phone.replace(/\D/g, "")}`}
              className="focus-gold rounded-full border border-gold px-4 py-1.5 text-xs font-semibold text-gold-dark hover:bg-gold hover:text-ink"
            >
              Call
            </a>
            <a
              href={`sms:${l.phone.replace(/\D/g, "")}`}
              className="focus-gold rounded-full border border-gold px-4 py-1.5 text-xs font-semibold text-gold-dark hover:bg-gold hover:text-ink"
            >
              SMS
            </a>
            {l.email && (
              <a
                href={`mailto:${l.email}`}
                className="focus-gold rounded-full border border-gold px-4 py-1.5 text-xs font-semibold text-gold-dark hover:bg-gold hover:text-ink"
              >
                Email
              </a>
            )}
          </div>
          {photos.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {photos.slice(0, 4).map((p) =>
                p.url ? (
                  <a key={p.id} href={p.url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" className="aspect-square w-full rounded-lg object-cover" />
                  </a>
                ) : null
              )}
            </div>
          )}
        </div>

        <div id="underwriting" className="scroll-mt-24 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-ink">Underwriting Snapshot</h2>
          <p className="mt-1 text-xs text-ink/40">
            Entered by your team, not auto-calculated from an outside source — verify comps before offering.
          </p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <UnderwritingRow label="ARV (Estimated)" value={l.arv_estimate} tint="text-emerald-600" />
            <UnderwritingRow label="Repairs" value={l.repair_estimate} tint="text-amber-600" />
            <UnderwritingRow
              label={`Maximum Allowable Offer (${Math.round((l.mao_multiplier ?? 0.7) * 100)}%)`}
              value={l.arv_estimate != null ? calculateMAO(l.arv_estimate, l.repair_estimate ?? 0, l.mao_multiplier ?? 0.7) : null}
              tint="text-sky-600"
            />
            <UnderwritingRow label="Recommended Offer" value={l.recommended_offer} tint="text-violet-600" />
          </div>
          {l.comps_note && <p className="mt-2 text-xs text-ink/40">{l.comps_note}</p>}

          <form action={updateUnderwriting.bind(null, params.id)} className="mt-4 grid grid-cols-2 gap-3 border-t border-ink/10 pt-4">
            <div>
              <label htmlFor="arv_estimate" className="text-xs font-medium text-ink/60">ARV Estimate ($)</label>
              <input
                id="arv_estimate"
                name="arv_estimate"
                type="number"
                step="1000"
                defaultValue={l.arv_estimate ?? ""}
                className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="repair_estimate" className="text-xs font-medium text-ink/60">Repair Estimate ($)</label>
              <input
                id="repair_estimate"
                name="repair_estimate"
                type="number"
                step="500"
                defaultValue={l.repair_estimate ?? ""}
                className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="mao_multiplier" className="text-xs font-medium text-ink/60">MAO Multiplier</label>
              <input
                id="mao_multiplier"
                name="mao_multiplier"
                type="number"
                step="0.01"
                min="0"
                max="1"
                defaultValue={l.mao_multiplier ?? 0.7}
                className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="recommended_offer" className="text-xs font-medium text-ink/60">Recommended Offer ($)</label>
              <input
                id="recommended_offer"
                name="recommended_offer"
                type="number"
                step="500"
                defaultValue={l.recommended_offer ?? ""}
                className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-1.5 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="comps_note" className="text-xs font-medium text-ink/60">Comps Note</label>
              <input
                id="comps_note"
                name="comps_note"
                type="text"
                placeholder="e.g. 115 Main St – $295,000 · 3 months ago"
                defaultValue={l.comps_note ?? ""}
                className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-1.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="focus-gold col-span-2 mt-1 self-start rounded-full bg-gold px-5 py-2 text-xs font-semibold text-ink hover:bg-gold-light"
            >
              Save Underwriting
            </button>
          </form>

          <div className="mt-5 border-t border-ink/10 pt-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-ink">Repair Estimate Breakdown</h3>
                <p className="mt-1 text-xs text-ink/40">
                  Enter a cost per category — the total replaces "Repair Estimate ($)" above automatically.
                </p>
              </div>
              <form action={estimateRepairsWithAIWithId}>
                <button
                  type="submit"
                  className="focus-gold shrink-0 rounded-full border border-violet-300 bg-violet-50 px-4 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                >
                  ✨ Estimate with AI
                </button>
              </form>
            </div>
            <p className="mt-2 rounded-lg bg-violet-50 px-3 py-2 text-[11px] text-violet-700">
              AI-generated estimate — always verify against real comps and contractor quotes before making an offer.
            </p>
            {searchParams.error && (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700" role="alert">
                {searchParams.error}
              </p>
            )}
            <form action={updateRepairItemsWithId} className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {REPAIR_CATEGORIES.map((category) => (
                <div key={category}>
                  <label htmlFor={`repair_${category}`} className="text-xs font-medium text-ink/60">
                    {category}
                  </label>
                  <input
                    id={`repair_${category}`}
                    name={`repair_${category}`}
                    type="number"
                    step="100"
                    min="0"
                    defaultValue={repairCostByCategory.get(category) ?? ""}
                    placeholder="0"
                    className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-1.5 text-sm"
                  />
                </div>
              ))}
              <button
                type="submit"
                className="focus-gold col-span-2 mt-1 self-end rounded-full bg-forest px-5 py-2 text-xs font-semibold text-white hover:bg-forest/90 sm:col-span-3"
              >
                Save Repair Breakdown
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Panel title="Seller">
            <Row label="Name" value={`${l.first_name} ${l.last_name}`} />
            <Row
              label="Phone"
              value={
                <div className="flex flex-wrap gap-3">
                  <span>{l.phone}</span>
                  <a href={`tel:${l.phone.replace(/\D/g, "")}`} className="text-gold-dark hover:underline">
                    Call
                  </a>
                  <a href={`sms:${l.phone.replace(/\D/g, "")}`} className="text-gold-dark hover:underline">
                    Text
                  </a>
                </div>
              }
            />
            {l.email && (
              <Row
                label="Email"
                value={
                  <a href={`mailto:${l.email}`} className="text-gold-dark hover:underline">
                    {l.email}
                  </a>
                }
              />
            )}
            <Row label="Preferred Contact" value={l.preferred_contact} />
            <Row label="Owner?" value={l.owner_status} />
            {l.owner_relationship && <Row label="Relationship" value={l.owner_relationship} />}
          </Panel>

          <Panel title="Property">
            <Row label="Type" value={l.property_type} />
            <Row
              label="Beds / Baths / Sq Ft"
              value={`${l.bedrooms ?? "—"} / ${l.bathrooms ?? "—"} / ${l.square_feet ?? "—"}`}
            />
            <Row label="Year Built" value={l.year_built ?? "—"} />
            <Row label="County" value={l.county ?? "—"} />
          </Panel>

          <Panel title="Location">
            <Row label="Parsed Address" value={l.formatted_address ?? l.property_address} />
            <Row
              label="Coordinates"
              value={l.latitude && l.longitude ? `${l.latitude.toFixed(5)}, ${l.longitude.toFixed(5)}` : "—"}
            />
            <Row label="Address Confidence" value={l.address_confidence ?? "—"} />
          </Panel>

          <Panel title="Location Intelligence">
            {population && !population.lookup_failed ? (
              <>
                <Row label="Population (ZCTA estimate)" value={population.population?.toLocaleString() ?? "—"} />
                <Row label="Source" value={`${population.data_source}${population.data_year ? ` · ${population.data_year}` : ""}`} />
              </>
            ) : (
              <p className="text-sm text-ink/40">Population data unavailable.</p>
            )}
            <form action={generateLocationInsightWithId} className="mt-2">
              <button
                type="submit"
                className="focus-gold rounded-full border border-gold px-4 py-1.5 text-xs font-semibold text-gold-dark hover:bg-gold hover:text-ink"
              >
                Generate AI Location Insight
              </button>
            </form>
          </Panel>

          <Panel title="Condition">
            <Row label="Overall" value={l.condition} />
            <Row label="Roof" value={l.roof_condition ?? "—"} />
            <Row label="HVAC" value={l.hvac_condition ?? "—"} />
            <Row label="Reported Issues" value={reportedIssues.join(", ") || "None reported"} />
            {l.additional_details && <Row label="Additional Details" value={l.additional_details} />}
          </Panel>

          <Panel title="Selling Situation">
            <Row label="Reason" value={l.selling_reason} />
            <Row label="Timeline" value={l.timeline} />
            <Row label="Asking Price" value={l.asking_price ?? "Not specified"} />
            <Row label="Best Time to Contact" value={l.best_contact_time ?? "—"} />
          </Panel>

          <Panel title="Buyer Matches">
            <p className="mb-2 text-xs text-ink/40">
              Suggestions only — nothing here contacts a buyer or assigns a deal automatically.
            </p>
            {buyerMatches.length === 0 && <p className="text-sm text-ink/40">No active buyers match yet.</p>}
            <ul className="flex flex-col gap-3">
              {buyerMatches.map((m) => (
                <li key={m.buyer.id} className="rounded-lg border border-ink/10 p-3">
                  <div className="flex items-center justify-between">
                    <Link href={`/admin/buyers/${m.buyer.id}`} className="font-medium text-gold-dark hover:underline">
                      {m.buyer.full_name}
                    </Link>
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-xs font-semibold " +
                        (matchTier(m.score) === "Strong"
                          ? "bg-emerald-100 text-emerald-700"
                          : matchTier(m.score) === "Possible"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-ink/10 text-ink/50")
                      }
                    >
                      {matchTier(m.score)} · {m.score}
                    </span>
                  </div>
                  <ul className="mt-2 flex flex-col gap-0.5 text-xs">
                    {m.reasons.map((r, i) => (
                      <li key={i} className={r.matched ? "text-emerald-700" : "text-ink/35 line-through"}>
                        {r.matched ? "✓" : "–"} {r.label}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </Panel>

          {photos.length > 0 && (
            <Panel title="Photos">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((p) =>
                  p.url ? (
                    <a key={p.id} href={p.url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="" className="aspect-square w-full rounded-lg object-cover" />
                    </a>
                  ) : null
                )}
              </div>
            </Panel>
          )}

          {documents.length > 0 && (
            <Panel title="Documents">
              <ul className="flex flex-col gap-2">
                {documents.map((d) => (
                  <li key={d.id}>
                    {d.url ? (
                      <a href={d.url} target="_blank" rel="noreferrer" className="text-gold-dark hover:underline">
                        {d.storage_path.split("/").pop()}
                      </a>
                    ) : (
                      <span className="text-ink/40">{d.storage_path.split("/").pop()} (link expired)</span>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Manage Lead">
            <form action={updateLeadWithId} className="flex flex-col gap-4">
              <div>
                <label htmlFor="status" className="text-sm font-medium text-ink/70">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={l.status}
                  className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pipeline_stage" className="text-sm font-medium text-ink/70">
                    Pipeline Stage
                  </label>
                  <select
                    id="pipeline_stage"
                    name="pipeline_stage"
                    defaultValue={l.pipeline_stage ?? ""}
                    className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  >
                    <option value="">—</option>
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="motivation_level" className="text-sm font-medium text-ink/70">
                    Motivation
                  </label>
                  <select
                    id="motivation_level"
                    name="motivation_level"
                    defaultValue={l.motivation_level ?? ""}
                    className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  >
                    <option value="">—</option>
                    {MOTIVATION_LEVELS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="lead_source" className="text-sm font-medium text-ink/70">
                    Lead Source
                  </label>
                  <select
                    id="lead_source"
                    name="lead_source"
                    defaultValue={l.lead_source ?? ""}
                    className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  >
                    <option value="">—</option>
                    {LEAD_SOURCES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="lead_type" className="text-sm font-medium text-ink/70">
                    Lead Type
                  </label>
                  <select
                    id="lead_type"
                    name="lead_type"
                    defaultValue={l.lead_type ?? ""}
                    className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  >
                    <option value="">—</option>
                    {LEAD_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="best_callback_time" className="text-sm font-medium text-ink/70">
                  Best Callback Time
                </label>
                <input
                  id="best_callback_time"
                  name="best_callback_time"
                  type="text"
                  defaultValue={l.best_callback_time ?? ""}
                  placeholder="e.g. Weekdays after 5pm"
                  className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="assigned_to" className="text-sm font-medium text-ink/70">
                  Assigned To
                </label>
                <select
                  id="assigned_to"
                  name="assigned_to"
                  defaultValue={l.assigned_to ?? ""}
                  className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {(admins ?? []).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.full_name ?? a.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="notes" className="text-sm font-medium text-ink/70">
                  Internal Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  defaultValue={l.notes ?? ""}
                  rows={5}
                  className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="focus-gold rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold-light"
              >
                Save Changes
              </button>
            </form>
          </Panel>

          <Panel title="Activity">
            <form
              action={async (formData: FormData) => {
                "use server";
                const note = String(formData.get("note") ?? "").trim();
                if (note) await logActivity(params.id, null, note);
              }}
              className="flex flex-col gap-2"
            >
              <input
                name="note"
                type="text"
                placeholder="Log a call, text, or note…"
                className="focus-gold w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="focus-gold self-start rounded-full border border-gold px-4 py-1.5 text-xs font-semibold text-gold-dark hover:bg-gold hover:text-ink"
              >
                Add to Activity Log
              </button>
            </form>
            <ul className="mt-3 flex flex-col gap-3">
              {(activity ?? []).map((entry) => (
                <li key={entry.id} className="border-b border-ink/5 pb-2 text-sm last:border-0">
                  <p className="text-ink">{entry.action}</p>
                  <p className="text-xs text-ink/40">
                    {entry.actor_type === "ai" ? "AI" : "Team"} · {formatDate(entry.created_at)}
                  </p>
                </li>
              ))}
              {(!activity || activity.length === 0) && (
                <li className="text-sm text-ink/40">No activity logged yet.</li>
              )}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-3 flex flex-col gap-2">{children}</div>
    </div>
  );
}

function UnderwritingRow({ label, value, tint }: { label: string; value: number | null; tint: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink/5 pb-2 last:border-0">
      <span className="text-sm text-ink/50">{label}</span>
      <span className={`text-sm font-semibold ${value != null ? tint : "text-ink/30"}`}>
        {value != null ? `$${Math.round(value).toLocaleString()}` : "Not entered"}
      </span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-ink/5 pb-2 last:border-0 sm:flex-row sm:justify-between">
      <span className="text-sm font-medium text-ink/50">{label}</span>
      <span className="text-sm text-ink">{value}</span>
    </div>
  );
}
