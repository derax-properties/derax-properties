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
  addComp,
  deleteComp,
  setFollowUp,
  setFollowUpFromForm,
  completeFollowUp,
} from "./actions";
import { FOLLOW_UP_TYPES, getFollowUpStatus, daysOverdue, dateOffset } from "@/lib/followUp";
import { getPopulationForZip } from "@/lib/population";
import { matchBuyersForLead, matchTier } from "@/lib/buyerMatching";
import type { CashBuyer, BuyerZipCode, BuyerInvestmentCriteria, RepairItem, LeadComp } from "@/lib/types";
import { REPAIR_CATEGORIES, PIPELINE_STAGES, MOTIVATION_LEVELS, LEAD_SOURCES, LEAD_TYPES, DEAD_REASONS } from "@/lib/types";
import { createDeal } from "../../deals/actions";
import { calculateMAO } from "@/lib/profitAnalysis";
import { calculateEquityPercent, calculateEquityDollars } from "@/lib/equity";
import { LeadMediaUploader } from "@/components/admin/LeadMediaUploader";
import { LeadPhotoGallery } from "@/components/admin/LeadPhotoGallery";
import { CollapsiblePanel, SaveAndCollapseButton } from "@/components/admin/CollapsiblePanel";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { formatDateOnly, formatRelativeTime, formatLeadName } from "@/lib/utils";

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

  // First wave: everything below only depends on the lead already fetched
  // above, not on each other — so instead of ~10 sequential round trips to
  // Supabase (each one waiting on the last), they all fire at once. This
  // and the second wave further down are what actually make this page,
  // easily the CRM's heaviest, show up quickly instead of sitting on a
  // loading skeleton for several seconds.
  const [
    { data: photoRows },
    { data: videoRows },
    { data: docRows },
    { data: admins },
    { data: activity },
    { data: repairItemRows },
    { data: compRows },
    { data: activeBuyers },
    { data: existingDeal },
    population,
    duplicateRef,
  ] = await Promise.all([
    supabase.from("seller_property_photos").select("*").eq("submission_id", params.id),
    supabase.from("seller_property_videos").select("*").eq("submission_id", params.id),
    supabase.from("seller_documents").select("*").eq("submission_id", params.id),
    supabase.from("admin_profiles").select("id, full_name"),
    supabase
      .from("activity_log")
      .select("*")
      .eq("seller_submission_id", params.id)
      .order("created_at", { ascending: false }),
    supabase.from("repair_items").select("*").eq("seller_submission_id", params.id),
    supabase
      .from("lead_comps")
      .select("*")
      .eq("seller_submission_id", params.id)
      .order("sale_date", { ascending: false, nullsFirst: false }),
    supabase.from("cash_buyers").select("*").eq("status", "Active"),
    supabase.from("deals").select("id").eq("seller_submission_id", params.id).maybeSingle(),
    lead.zip ? getPopulationForZip(lead.zip) : Promise.resolve(null),
    lead.possible_duplicate_of
      ? supabase
          .from("seller_submissions")
          .select("reference_number")
          .eq("id", lead.possible_duplicate_of)
          .maybeSingle()
          .then((r) => r.data?.reference_number ?? null)
      : Promise.resolve(null as string | null),
  ]);

  const generateLocationInsightWithId = generateLocationInsight.bind(null, params.id, lead.zip);

  const repairCostByCategory = new Map<string, number>();
  for (const r of (repairItemRows as RepairItem[]) ?? []) {
    repairCostByCategory.set(r.category, r.cost);
  }
  const customRepairCategories = [...repairCostByCategory.keys()].filter(
    (c) => !(REPAIR_CATEGORIES as readonly string[]).includes(c)
  );
  const updateRepairItemsWithId = updateRepairItems.bind(null, params.id);
  const estimateRepairsWithAIWithId = estimateRepairsWithAIAction.bind(null, params.id);

  const comps = (compRows as LeadComp[]) ?? [];
  const compPrices = comps.map((c) => c.sale_price).filter((p): p is number => typeof p === "number");
  const avgCompPrice = compPrices.length ? compPrices.reduce((s, p) => s + p, 0) / compPrices.length : 0;
  const sortedPrices = [...compPrices].sort((a, b) => a - b);
  const medianCompPrice = sortedPrices.length
    ? sortedPrices.length % 2 === 1
      ? sortedPrices[(sortedPrices.length - 1) / 2]
      : (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
    : 0;
  const pricesPerSqft = comps
    .filter((c) => c.sale_price && c.square_feet)
    .map((c) => (c.sale_price as number) / (c.square_feet as number));
  const avgPricePerSqft = pricesPerSqft.length ? pricesPerSqft.reduce((s, p) => s + p, 0) / pricesPerSqft.length : 0;

  const buyerIds = (activeBuyers ?? []).map((b) => b.id);

  const photoBucket = process.env.SUPABASE_SELLER_PHOTOS_BUCKET || "seller-photos";
  const videoBucket = process.env.SUPABASE_SELLER_VIDEOS_BUCKET || "seller-videos";
  const docBucket = process.env.SUPABASE_SELLER_DOCS_BUCKET || "seller-documents";

  // Second wave: these depend on the first wave's results (buyer ids,
  // photo/video/doc rows) but not on each other, so they too run
  // concurrently rather than one after another.
  const [{ data: allZips }, { data: allCriteria }, photos, videos, documents] = await Promise.all([
    buyerIds.length
      ? supabase.from("buyer_zip_codes").select("*").in("buyer_id", buyerIds)
      : Promise.resolve({ data: [] as BuyerZipCode[] }),
    buyerIds.length
      ? supabase.from("buyer_investment_criteria").select("*").in("buyer_id", buyerIds)
      : Promise.resolve({ data: [] as BuyerInvestmentCriteria[] }),
    Promise.all((photoRows ?? []).map(async (p) => ({ ...p, url: await getSignedUrl(photoBucket, p.storage_path) }))),
    Promise.all((videoRows ?? []).map(async (v) => ({ ...v, url: await getSignedUrl(videoBucket, v.storage_path) }))),
    Promise.all((docRows ?? []).map(async (d) => ({ ...d, url: await getSignedUrl(docBucket, d.storage_path) }))),
  ]);

  const zipsByBuyer = new Map<string, BuyerZipCode[]>();
  for (const z of (allZips as BuyerZipCode[]) ?? []) {
    zipsByBuyer.set(z.buyer_id, [...(zipsByBuyer.get(z.buyer_id) ?? []), z]);
  }
  const criteriaByBuyer = new Map<string, BuyerInvestmentCriteria[]>();
  for (const c of (allCriteria as BuyerInvestmentCriteria[]) ?? []) {
    criteriaByBuyer.set(c.buyer_id, [...(criteriaByBuyer.get(c.buyer_id) ?? []), c]);
  }

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
        <div className="crm-water-hover rounded-xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-ink">Lead Detail — {formatLeadName(l.first_name, l.last_name)}</h2>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Row label="Address" value={`${l.property_address}, ${l.city}, ${l.state} ${l.zip}`} />
            <Row label="Asking Price" value={l.asking_price ?? "Not specified"} />
            <Row label="Motivation" value={l.motivation_level ?? "—"} />
            <Row label="Best Callback" value={l.best_callback_time ?? "—"} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {l.phone && (
              <>
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
              </>
            )}
            {l.email && (
              <a
                href={`mailto:${l.email}`}
                className="focus-gold rounded-full border border-gold px-4 py-1.5 text-xs font-semibold text-gold-dark hover:bg-gold hover:text-ink"
              >
                Email
              </a>
            )}
          </div>
          <LeadPhotoGallery
            photos={photos
              .slice(0, 4)
              .filter((p) => Boolean(p.url))
              .map((p) => ({ id: p.id, url: p.url as string }))}
            gridClassName="mt-4 grid grid-cols-4 gap-2"
          />
        </div>

        <FollowUpPanel lead={l} />

        {/*
          No crm-water-hover here on purpose (other cards on this page have
          it, this one deliberately doesn't). That class lifts + rotates +
          scales the whole card on :hover via a CSS transform — which only
          ever fires on a mouse (a touchscreen tap doesn't trigger a
          lingering :hover the way a cursor does), so it's exactly why
          "Hide details" was unreliable on Windows but fine on the iPhone:
          moving the mouse onto this card to reach the small "Hide details"
          pill in its corner kicks off a 420ms transform transition, and if
          the click lands while the card (and the button inside it) is
          still mid-shift, the click can miss the button's actual position
          at that instant. A card full of buttons and form fields the admin
          needs to hit precisely shouldn't also be animating out from under
          the cursor.
        */}
        <div id="underwriting" className="scroll-mt-24 rounded-xl bg-white p-5 shadow-sm">
          <CollapsiblePanel
            title="Underwriting Snapshot"
            subtitle="Entered by your team, not auto-calculated from an outside source — verify comps before offering."
            anchorId="underwriting"
            summary={
              <div className="flex flex-col gap-2 text-sm">
                <UnderwritingRow label="ARV (Estimated)" value={l.arv_estimate} tint="text-emerald-600" />
                <UnderwritingRow label="Repairs" value={l.repair_estimate} tint="text-amber-600" />
                <UnderwritingRow
                  label={`Maximum Allowable Offer (${Math.round((l.mao_multiplier ?? 0.7) * 100)}%)`}
                  value={l.arv_estimate != null ? calculateMAO(l.arv_estimate, l.repair_estimate ?? 0, l.mao_multiplier ?? 0.7) : null}
                  tint="text-sky-600"
                />
                <UnderwritingRow label="Recommended Offer" value={l.recommended_offer} tint="text-violet-600" />
                {(() => {
                  const equityPct = calculateEquityPercent(l.current_value, l.mortgage_balance);
                  return equityPct != null ? (
                    <div className="flex items-center justify-between">
                      <span className="text-ink/50">Equity</span>
                      <span className={`font-bold ${equityPct >= 30 ? "text-emerald-600" : equityPct >= 0 ? "text-amber-600" : "text-red-600"}`}>
                        {equityPct}%
                      </span>
                    </div>
                  ) : null;
                })()}
                {l.comps_note && <p className="mt-1 text-xs text-ink/40">{l.comps_note}</p>}
                <p className="mt-1 text-[11px] text-ink/35">Click to open comps, repair breakdown, and edit these numbers.</p>
              </div>
            }
          >
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

          <div className="mt-4 rounded-lg bg-cream/60 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">Equity</span>
              {(() => {
                const equityPct = calculateEquityPercent(l.current_value, l.mortgage_balance);
                return equityPct != null ? (
                  <span className={`text-lg font-bold ${equityPct >= 30 ? "text-emerald-600" : equityPct >= 0 ? "text-amber-600" : "text-red-600"}`}>
                    {equityPct}%
                  </span>
                ) : (
                  <span className="text-xs text-ink/30">Enter both fields below</span>
                );
              })()}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs text-ink/50">
              <span>Current Value − Payoff Balance</span>
              {(() => {
                const equityDollars = calculateEquityDollars(l.current_value, l.mortgage_balance);
                return equityDollars != null ? <span>${Math.round(equityDollars).toLocaleString()}</span> : null;
              })()}
            </div>
            <p className="mt-1.5 text-[11px] text-ink/35">
              A plain calculation from the two numbers below, not an AI estimate — equity is arithmetic, not judgment. It recalculates automatically whenever either number changes.
            </p>
          </div>

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
              <label htmlFor="repair_estimate_display" className="text-xs font-medium text-ink/60">Repair Estimate ($)</label>
              {/*
                Read-only on purpose — no `name`, so it's never part of this
                form's submission. This used to be a plain editable number
                that also wrote to the same repair_estimate column the
                itemized breakdown below computes. That's exactly what made
                totals randomly "revert to what I had when I opened the
                file": edit the breakdown, save it (new total written) — but
                this field's value on screen was set from the page load
                before that edit, and never refreshes without a full
                reload (defaultValue only applies once, at mount). Later
                saving THIS form (say, just to update ARV) would silently
                write that stale number straight back over the fresh total.
                Making it read-only removes the second, conflicting way to
                set this number — the itemized breakdown below is now the
                only thing that can ever change it, so it can't drift.
              */}
              <input
                id="repair_estimate_display"
                type="number"
                value={l.repair_estimate ?? ""}
                readOnly
                disabled
                className="mt-1 w-full cursor-not-allowed rounded-lg border border-ink/15 bg-ink/5 px-3 py-1.5 text-sm text-ink/60"
              />
              <p className="mt-1 text-[11px] text-ink/35">Auto-calculated from the Repair Estimate Breakdown below.</p>
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
            <div>
              <label htmlFor="current_value" className="text-xs font-medium text-ink/60">Current Value ($)</label>
              <input
                id="current_value"
                name="current_value"
                type="number"
                step="1000"
                defaultValue={l.current_value ?? ""}
                placeholder="As-is value, not ARV"
                className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="mortgage_balance" className="text-xs font-medium text-ink/60">Mortgage Payoff Balance ($)</label>
              <input
                id="mortgage_balance"
                name="mortgage_balance"
                type="number"
                step="1000"
                defaultValue={l.mortgage_balance ?? ""}
                placeholder="0 if free and clear"
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
            <SaveAndCollapseButton className="focus-gold col-span-2 mt-1 self-start rounded-full bg-gold px-5 py-2 text-xs font-semibold text-ink hover:bg-gold-light">
              Save Underwriting
            </SaveAndCollapseButton>
          </form>

          <div className="mt-5 border-t border-ink/10 pt-4">
            <h3 className="text-sm font-semibold text-ink">Comparable Sales</h3>
            {comps.length > 0 ? (
              <>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-xs">
                    <thead>
                      <tr className="text-ink/40">
                        <th className="pb-1.5 pr-3 font-semibold">Address</th>
                        <th className="pb-1.5 pr-3 font-semibold">Sale Price</th>
                        <th className="pb-1.5 pr-3 font-semibold">Sale Date</th>
                        <th className="pb-1.5 pr-3 font-semibold">Bd/Ba</th>
                        <th className="pb-1.5 pr-3 font-semibold">Sq Ft</th>
                        <th className="pb-1.5 pr-3 font-semibold">Dist.</th>
                        <th className="pb-1.5 pr-3 font-semibold">Rating</th>
                        <th className="pb-1.5"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {comps.map((c) => (
                        <tr key={c.id} className="border-t border-ink/5">
                          <td className="py-1.5 pr-3 text-ink">{c.address}</td>
                          <td className="py-1.5 pr-3 font-semibold text-ink">{c.sale_price ? `$${c.sale_price.toLocaleString()}` : "—"}</td>
                          <td className="py-1.5 pr-3 text-ink/60">
                            {c.sale_date ? (
                              <>
                                {formatDateOnly(c.sale_date)}
                                <span className="block text-[10px] text-ink/35">{formatRelativeTime(c.sale_date)}</span>
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-1.5 pr-3 text-ink/60">{c.bedrooms ?? "—"}/{c.bathrooms ?? "—"}</td>
                          <td className="py-1.5 pr-3 text-ink/60">{c.square_feet?.toLocaleString() ?? "—"}</td>
                          <td className="py-1.5 pr-3 text-ink/60">{c.distance_miles ? `${c.distance_miles} mi` : "—"}</td>
                          <td className="py-1.5 pr-3">
                            {c.comp_rating && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  c.comp_rating === "Strong" ? "bg-emerald-100 text-emerald-700" : c.comp_rating === "Fair" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                                }`}
                              >
                                {c.comp_rating}
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 text-right">
                            <form action={deleteComp.bind(null, l.id, c.id)}>
                              <button type="submit" className="focus-gold text-[11px] font-semibold text-red-400 hover:text-red-600">
                                Remove
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-[11px] text-ink/40">
                  Avg sale price: <strong className="text-ink/60">${Math.round(avgCompPrice).toLocaleString()}</strong> · Median: <strong className="text-ink/60">${Math.round(medianCompPrice).toLocaleString()}</strong>
                  {avgPricePerSqft ? (
                    <>
                      {" "}
                      · Avg $/sq ft: <strong className="text-ink/60">${avgPricePerSqft.toFixed(0)}</strong>
                    </>
                  ) : null}
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs text-ink/40">No comps added yet.</p>
            )}

            <form action={addComp.bind(null, l.id)} className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <input name="address" placeholder="Comp address *" required className="focus-gold col-span-2 rounded-lg border border-ink/15 px-2.5 py-1.5 text-xs sm:col-span-1" />
              <input name="sale_price" type="number" placeholder="Sale price" className="focus-gold rounded-lg border border-ink/15 px-2.5 py-1.5 text-xs" />
              <input name="sale_date" type="date" className="focus-gold rounded-lg border border-ink/15 px-2.5 py-1.5 text-xs" />
              <input name="bedrooms" type="number" placeholder="Beds" className="focus-gold rounded-lg border border-ink/15 px-2.5 py-1.5 text-xs" />
              <input name="bathrooms" type="number" step="0.5" placeholder="Baths" className="focus-gold rounded-lg border border-ink/15 px-2.5 py-1.5 text-xs" />
              <input name="square_feet" type="number" placeholder="Sq ft" className="focus-gold rounded-lg border border-ink/15 px-2.5 py-1.5 text-xs" />
              <input name="lot_size" placeholder="Lot size" className="focus-gold rounded-lg border border-ink/15 px-2.5 py-1.5 text-xs" />
              <input name="distance_miles" type="number" step="0.1" placeholder="Distance (mi)" className="focus-gold rounded-lg border border-ink/15 px-2.5 py-1.5 text-xs" />
              <select name="comp_rating" defaultValue="" className="focus-gold rounded-lg border border-ink/15 px-2.5 py-1.5 text-xs">
                <option value="">Rating —</option>
                <option value="Strong">Strong</option>
                <option value="Fair">Fair</option>
                <option value="Weak">Weak</option>
              </select>
              <input name="condition" placeholder="Condition" className="focus-gold rounded-lg border border-ink/15 px-2.5 py-1.5 text-xs" />
              <input name="notes" placeholder="Notes" className="focus-gold col-span-2 rounded-lg border border-ink/15 px-2.5 py-1.5 text-xs sm:col-span-2" />
              <button type="submit" className="focus-gold col-span-2 rounded-full bg-forest px-4 py-1.5 text-xs font-semibold text-white hover:bg-forest/90 sm:col-span-1">
                + Add Comp
              </button>
            </form>
            <p className="mt-2 text-[11px] text-ink/35">
              Manual comps only — no live comparable-sales data source is connected. Wire up a property-data API later and imported comps will show separately from these.
            </p>
          </div>

          <div className="mt-5 border-t border-ink/10 pt-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-ink">Repair Estimate Breakdown</h3>
                <p className="mt-1 text-xs text-ink/40">
                  Enter a cost per category — the total replaces &quot;Repair Estimate ($)&quot; above automatically.
                </p>
              </div>
              <form action={estimateRepairsWithAIWithId} className="w-full shrink-0 sm:w-auto">
                <details className="group">
                  <summary className="focus-gold cursor-pointer list-none rounded-full border border-violet-300 bg-violet-50 px-4 py-1.5 text-center text-xs font-semibold text-violet-700 hover:bg-violet-100">
                    ✨ Estimate with AI
                  </summary>
                  <div className="mt-2 w-full rounded-lg border border-violet-200 bg-violet-50/60 p-4 sm:w-[440px]">
                    <p className="text-xs font-medium text-violet-700">
                      Check which repairs actually apply — AI will estimate only these, leaving every other category untouched:
                    </p>
                    <div className="mt-3 grid max-h-80 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                      {[...REPAIR_CATEGORIES, ...customRepairCategories].map((category) => (
                        <label
                          key={category}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-violet-200 bg-white px-3 py-3 text-sm font-medium text-ink/80 transition-colors has-[:checked]:border-violet-500 has-[:checked]:bg-violet-100"
                        >
                          <input
                            type="checkbox"
                            name="ai_categories"
                            value={category}
                            className="focus-gold h-6 w-6 shrink-0 rounded border-2 border-violet-300 text-violet-600"
                          />
                          {category}
                        </label>
                      ))}
                    </div>
                    <SubmitButton
                      pendingLabel="Estimating…"
                      className="focus-gold mt-3 w-full rounded-full bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-70"
                    >
                      Estimate Selected →
                    </SubmitButton>
                  </div>
                </details>
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
              {customRepairCategories.map((category) => (
                <div key={category}>
                  <label htmlFor={`repair_${category}`} className="text-xs font-medium text-ink/60">
                    {category} <span className="text-ink/30">(custom)</span>
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
              <div className="col-span-2 rounded-lg border border-dashed border-ink/15 p-2 sm:col-span-3">
                <p className="text-xs font-medium text-ink/60">+ Add Repair Item</p>
                <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <input name="repair_new_name" placeholder="Category name" className="focus-gold rounded-lg border border-ink/15 px-3 py-1.5 text-sm sm:col-span-2" />
                  <input name="repair_new_cost" type="number" step="100" min="0" placeholder="Cost" className="focus-gold rounded-lg border border-ink/15 px-3 py-1.5 text-sm" />
                  <input name="repair_new_notes" placeholder="Notes (optional)" className="focus-gold rounded-lg border border-ink/15 px-3 py-1.5 text-sm" />
                </div>
              </div>
              <SaveAndCollapseButton className="focus-gold col-span-2 mt-1 self-end rounded-full bg-forest px-5 py-2 text-xs font-semibold text-white hover:bg-forest/90 sm:col-span-3">
                Save Repair Breakdown
              </SaveAndCollapseButton>
            </form>
          </div>
          </CollapsiblePanel>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Panel title="Seller">
            <Row label="Name" value={formatLeadName(l.first_name, l.last_name)} />
            <Row
              label="Phone"
              value={
                l.phone ? (
                  <div className="flex flex-wrap gap-3">
                    <span>{l.phone}</span>
                    <a href={`tel:${l.phone.replace(/\D/g, "")}`} className="text-gold-dark hover:underline">
                      Call
                    </a>
                    <a href={`sms:${l.phone.replace(/\D/g, "")}`} className="text-gold-dark hover:underline">
                      Text
                    </a>
                  </div>
                ) : (
                  <span className="text-ink/40">Not provided</span>
                )
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

          <Panel title="Photos & Videos">
            <LeadPhotoGallery
              photos={photos.filter((p) => Boolean(p.url)).map((p) => ({ id: p.id, url: p.url as string }))}
              gridClassName="grid grid-cols-3 gap-2 sm:grid-cols-4"
            />
            {videos.length > 0 && (
              <div className={`grid grid-cols-2 gap-2 sm:grid-cols-3 ${photos.length > 0 ? "mt-3" : ""}`}>
                {videos.map((v) =>
                  v.url ? (
                    <video
                      key={v.id}
                      src={v.url}
                      controls
                      className="crm-water-hover aspect-video w-full rounded-lg bg-ink/5 object-cover"
                    />
                  ) : (
                    <div key={v.id} className="flex aspect-video items-center justify-center rounded-lg bg-ink/5 text-xs text-ink/40">
                      Link expired
                    </div>
                  )
                )}
              </div>
            )}
            {photos.length === 0 && videos.length === 0 && (
              <p className="text-sm text-ink/40">No photos or videos yet — add some below.</p>
            )}
            <LeadMediaUploader leadId={params.id} />
          </Panel>

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
                  <label className="mt-1.5 flex items-center gap-1.5 text-xs text-ink/50">
                    <input type="checkbox" name="motivation_override" value="true" defaultChecked={l.motivation_override} className="focus-gold rounded" />
                    Manual override (don&apos;t let the timeline auto-calculate this)
                  </label>
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
              {l.pipeline_stage === "Dead / Lost" && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-red-500">Dead / Lost Reason</p>
                  <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <select
                      name="dead_reason"
                      defaultValue={l.dead_reason ?? ""}
                      className="focus-gold rounded-lg border border-red-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">—</option>
                      {DEAD_REASONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <input
                      name="dead_reason_note"
                      defaultValue={l.dead_reason_note ?? ""}
                      placeholder="Optional note"
                      className="focus-gold rounded-lg border border-red-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}
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

          {/* No crm-water-hover here either, same reasoning as the Underwriting card above. */}
          <div id="activity" className="scroll-mt-24 rounded-xl bg-white p-5 shadow-sm">
            <CollapsiblePanel
              title="Activity"
              subtitle="Calls, texts, notes, and system history for this lead."
              anchorId="activity"
              summary={
                <div className="flex flex-col gap-2 text-sm">
                  {activity && activity.length > 0 ? (
                    <>
                      <p className="text-ink">{activity[0].action}</p>
                      <p className="text-xs text-ink/40">
                        {activity[0].actor_type === "ai" ? "AI" : "Team"} · {formatDate(activity[0].created_at)}
                      </p>
                      {activity.length > 1 && (
                        <p className="mt-1 text-[11px] text-ink/35">
                          +{activity.length - 1} more entr{activity.length - 1 === 1 ? "y" : "ies"} — click to see full history and add a note.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-ink/40">No activity logged yet — click to add one.</p>
                  )}
                </div>
              }
            >
              <form
                action={async (formData: FormData) => {
                  "use server";
                  const note = String(formData.get("note") ?? "").trim();
                  if (note) await logActivity(params.id, null, note);
                }}
                className="mt-3 flex flex-col gap-2"
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
            </CollapsiblePanel>
          </div>
        </div>
      </div>
    </div>
  );
}

const FOLLOW_UP_STATUS_TINT: Record<string, string> = {
  Overdue: "bg-red-100 text-red-700",
  "Due Today": "bg-amber-100 text-amber-700",
  Upcoming: "bg-sky-100 text-sky-700",
  Completed: "bg-emerald-100 text-emerald-700",
  "No Follow-Up": "bg-ink/5 text-ink/40",
};

/**
 * The follow-up date is a DATE only (never a time) per the correction —
 * quick-pick buttons just write a computed YYYY-MM-DD, and "Complete"
 * stamps follow_up_completed_at without touching the date so what was due
 * stays visible as history. Status (Overdue/Due Today/Upcoming/Completed/
 * No Follow-Up) is derived, never stored, so it can never drift out of
 * sync with today's actual date.
 */
function FollowUpPanel({ lead }: { lead: SellerSubmission }) {
  const status = getFollowUpStatus(lead);
  const setFollowUpWithId = setFollowUp.bind(null, lead.id);
  const setFollowUpFromFormWithId = setFollowUpFromForm.bind(null, lead.id);
  const completeFollowUpWithId = completeFollowUp.bind(null, lead.id);

  // Which quick-pick button (if any) is actually in effect right now, so
  // that button — and only that one — gets a filled/highlighted look
  // instead of every button always looking the same regardless of what's
  // selected. Derived straight from the lead's own stored fields (never a
  // separate "which one is checked" flag), so it can't drift out of sync:
  // clicking a different one changes next_follow_up_date/completed_at,
  // which is what this reads, so the highlight always moves to match.
  const isCompleted = status === "Completed";
  const isNoFollowUp = !isCompleted && !lead.next_follow_up_date;
  const activeQuickPickDate = isCompleted || isNoFollowUp ? null : lead.next_follow_up_date;

  const quickPickClass = (active: boolean) =>
    active
      ? "focus-gold rounded-full border border-gold-dark bg-gold px-3 py-1.5 text-xs font-bold text-ink disabled:opacity-70"
      : "focus-gold rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-70";

  return (
    // No crm-water-hover here — this card is mostly clickable quick-pick
    // buttons, and that hover-lift/rotate/scale animation was exactly what
    // made a nearby "Hide details" button unreliable to click on desktop
    // (see the Underwriting card above); the same risk applies here.
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-ink">Follow-Up</h2>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${FOLLOW_UP_STATUS_TINT[status]}`}>
          {status === "Overdue" && lead.next_follow_up_date ? `Overdue · ${daysOverdue(lead.next_follow_up_date)}d` : status}
        </span>
      </div>

      <p className="mt-2 text-sm text-ink/60">
        {lead.next_follow_up_date ? (
          <>
            Next follow-up: <strong className="text-ink">{formatDateOnly(lead.next_follow_up_date)}</strong>
            {lead.follow_up_type ? ` · ${lead.follow_up_type}` : ""}
          </>
        ) : (
          "No follow-up scheduled."
        )}
        {lead.follow_up_notes && <span className="mt-1 block text-xs text-ink/40">{lead.follow_up_notes}</span>}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <form action={setFollowUpWithId.bind(null, dateOffset(0), lead.follow_up_type, lead.follow_up_notes)}>
          <SubmitButton pendingLabel="Today…" className={quickPickClass(activeQuickPickDate === dateOffset(0))}>Today</SubmitButton>
        </form>
        <form action={setFollowUpWithId.bind(null, dateOffset(1), lead.follow_up_type, lead.follow_up_notes)}>
          <SubmitButton pendingLabel="Tomorrow…" className={quickPickClass(activeQuickPickDate === dateOffset(1))}>Tomorrow</SubmitButton>
        </form>
        <form action={setFollowUpWithId.bind(null, dateOffset(3), lead.follow_up_type, lead.follow_up_notes)}>
          <SubmitButton pendingLabel="3 Days…" className={quickPickClass(activeQuickPickDate === dateOffset(3))}>3 Days</SubmitButton>
        </form>
        <form action={setFollowUpWithId.bind(null, dateOffset(7), lead.follow_up_type, lead.follow_up_notes)}>
          <SubmitButton pendingLabel="7 Days…" className={quickPickClass(activeQuickPickDate === dateOffset(7))}>7 Days</SubmitButton>
        </form>
        <form action={completeFollowUpWithId}>
          <SubmitButton
            pendingLabel="…"
            className={
              isCompleted
                ? "focus-gold rounded-full bg-forest px-3 py-1.5 text-xs font-bold text-white disabled:opacity-70"
                : "focus-gold rounded-full border border-forest/30 px-3 py-1.5 text-xs font-bold text-forest hover:bg-forest/10 disabled:opacity-70"
            }
          >
            ✓ Complete
          </SubmitButton>
        </form>
        <form action={setFollowUpWithId.bind(null, null, null, null)}>
          <SubmitButton pendingLabel="…" className={quickPickClass(isNoFollowUp)}>No Follow-Up</SubmitButton>
        </form>
      </div>

      <form action={setFollowUpFromFormWithId} className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input name="date" type="date" defaultValue={lead.next_follow_up_date ?? ""} className="focus-gold rounded-lg border border-ink/15 px-3 py-1.5 text-sm" />
        <select name="type" defaultValue={lead.follow_up_type ?? ""} className="focus-gold rounded-lg border border-ink/15 px-3 py-1.5 text-sm">
          <option value="">Type —</option>
          {FOLLOW_UP_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input name="notes" defaultValue={lead.follow_up_notes ?? ""} placeholder="Notes" className="focus-gold col-span-2 rounded-lg border border-ink/15 px-3 py-1.5 text-sm sm:col-span-1" />
        <button type="submit" className="focus-gold rounded-full bg-gold px-4 py-1.5 text-xs font-semibold text-ink hover:bg-gold-light">
          Save Custom Date
        </button>
      </form>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="crm-water-hover rounded-xl bg-white p-5 shadow-sm">
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
