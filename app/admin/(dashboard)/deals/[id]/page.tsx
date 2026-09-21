import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Deal, CashBuyer, TitleCompany, DealStage } from "@/lib/types";
import { recommendExitStrategy, calculateWholesaleProfit, calculateFixFlipProfit } from "@/lib/profitAnalysis";
import { getSignedUrl } from "@/lib/storage";
import type { GeneratedDocument, DocumentSigner } from "@/lib/types";
import {
  updateDeal,
  generatePurchaseAgreement,
  generateDealSummary,
  generateBuyerPackage,
  runOneClickWorkflow,
  sendForSignature,
  updateDocumentEsignStatus,
  addDocumentSigner,
  updateSignerStatus,
  removeDocumentSigner,
} from "../actions";

export const metadata = { title: "Deal Detail — DERAX CRM", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const STAGES: DealStage[] = [
  "Contract Sent",
  "Contract Signed",
  "Under Contract",
  "Buyer Assigned",
  "Closing Scheduled",
  "Closed",
  "Fell Through",
];
const EXIT_STRATEGIES = ["Wholesale", "Assignment", "Double Close", "Fix & Flip", "Buy & Hold"];

export default async function DealDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();

  const { data: deal } = await supabase
    .from("deals")
    .select("*, seller_submissions(reference_number, property_address, city, state, zip, asking_price)")
    .eq("id", params.id)
    .single();
  if (!deal) notFound();
  const d = deal as Deal & {
    seller_submissions: { reference_number: string; property_address: string; city: string; state: string; zip: string; asking_price: string | null } | null;
  };

  const [{ data: buyers }, { data: titleCompanies }] = await Promise.all([
    supabase.from("cash_buyers").select("*").eq("status", "Active").order("full_name"),
    supabase.from("title_companies").select("*").eq("status", "Active").order("company_name"),
  ]);

  const { data: documents } = await supabase
    .from("generated_documents")
    .select("*")
    .eq("deal_id", params.id)
    .order("created_at", { ascending: false });

  const GENERATED_DOCS_BUCKET = process.env.SUPABASE_GENERATED_DOCS_BUCKET || "generated-documents";
  const documentIds = ((documents as GeneratedDocument[]) ?? []).map((doc) => doc.id);
  const { data: allSigners } =
    documentIds.length > 0
      ? await supabase.from("document_signers").select("*").in("document_id", documentIds).order("sign_order", { ascending: true })
      : { data: [] as DocumentSigner[] };

  const documentsWithUrls = await Promise.all(
    ((documents as GeneratedDocument[]) ?? []).map(async (doc) => ({
      ...doc,
      url: doc.storage_path ? await getSignedUrl(GENERATED_DOCS_BUCKET, doc.storage_path) : null,
      signers: ((allSigners as DocumentSigner[]) ?? []).filter((s) => s.document_id === doc.id),
    }))
  );

  const { data: activity } = await supabase
    .from("activity_log")
    .select("*")
    .eq("deal_id", params.id)
    .order("created_at", { ascending: false });

  const updateDealWithId = updateDeal.bind(null, params.id);

  // These four actions return { error?: string } for potential future
  // inline error display, but a <form action={...}> must be a function
  // that returns void — wrapping each discards the return value so the
  // types line up without changing what the action actually does.
  async function generatePurchaseAgreementWithId() {
    "use server";
    await generatePurchaseAgreement(params.id);
  }
  async function generateDealSummaryWithId() {
    "use server";
    await generateDealSummary(params.id);
  }
  async function generateBuyerPackageWithId(formData: FormData) {
    "use server";
    await generateBuyerPackage(params.id, formData);
  }
  async function runOneClickWorkflowWithId() {
    "use server";
    await runOneClickWorkflow(params.id);
  }

  const recommendation = recommendExitStrategy({
    arvEstimate: d.arv_estimate,
    estimatedRepairs: d.estimated_repairs,
    purchasePrice: d.purchase_price,
    assignmentFee: d.assignment_fee,
    exitStrategy: d.exit_strategy as any,
  });

  let profitLine: string | null = null;
  if (d.purchase_price != null && d.assignment_fee != null && (d.exit_strategy === "Wholesale" || d.exit_strategy === "Assignment")) {
    const profit = calculateWholesaleProfit(d.purchase_price, d.assignment_fee);
    profitLine = `Wholesale/assignment profit: $${profit.toLocaleString()} (the assignment fee).`;
  } else if (d.arv_estimate != null && d.purchase_price != null && d.exit_strategy === "Fix & Flip") {
    const { profit, holdingCosts, sellingCosts } = calculateFixFlipProfit(
      d.arv_estimate,
      d.purchase_price,
      d.estimated_repairs ?? 0
    );
    profitLine = `Estimated flip profit: $${Math.round(profit).toLocaleString()} (after ~$${Math.round(
      holdingCosts
    ).toLocaleString()} holding + $${Math.round(sellingCosts).toLocaleString()} selling costs).`;
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">
        {d.seller_submissions?.reference_number}
      </p>
      <h1 className="font-display text-2xl font-semibold text-ink">
        {d.seller_submissions?.property_address ?? "Deal"}
      </h1>
      {d.seller_submissions && (
        <p className="text-sm text-ink/50">
          {d.seller_submissions.city}, {d.seller_submissions.state} {d.seller_submissions.zip}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-ink">Disposition Suggestion</h2>
            <p className="mt-1 text-xs text-ink/40">
              A rule-based suggestion, not an automatic decision — you always pick the exit strategy below.
            </p>
            {recommendation.suggestedStrategy && (
              <p className="mt-3 text-sm font-semibold text-emerald-700">
                Suggested: {recommendation.suggestedStrategy}
                {recommendation.spread != null && ` · Spread to 70% MAO: $${Math.round(recommendation.spread).toLocaleString()}`}
              </p>
            )}
            <ul className="mt-2 flex flex-col gap-1 text-xs text-ink/60">
              {recommendation.reasons.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
            {profitLine && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800">{profitLine}</p>}
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold text-ink">Documents</h2>
              <form action={runOneClickWorkflowWithId}>
                <button
                  type="submit"
                  className="focus-gold rounded-full bg-gold px-4 py-1.5 text-xs font-semibold text-ink hover:bg-gold-light"
                >
                  One-Click: Generate Agreement
                </button>
              </form>
            </div>
            <p className="mt-1 text-xs text-ink/40">
              Generated as printable HTML documents (open one and use your browser&apos;s Print → Save as
              PDF). E-signature status is tracked manually here until a real e-sign provider is
              connected — see lib/esign.ts.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <form action={generatePurchaseAgreementWithId}>
                <button type="submit" className="focus-gold rounded-full border border-gold px-3 py-1.5 text-xs font-semibold text-gold-dark hover:bg-gold hover:text-ink">
                  Purchase Agreement
                </button>
              </form>
              <form action={generateDealSummaryWithId}>
                <button type="submit" className="focus-gold rounded-full border border-gold px-3 py-1.5 text-xs font-semibold text-gold-dark hover:bg-gold hover:text-ink">
                  Deal Summary
                </button>
              </form>
              <form action={generateBuyerPackageWithId} className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-1">
                  <input
                    name="contact_line"
                    type="text"
                    placeholder="Custom contact line (optional)"
                    className="focus-gold rounded-lg border border-ink/15 px-2 py-1 text-xs"
                  />
                  <button type="submit" className="focus-gold rounded-full border border-gold px-3 py-1.5 text-xs font-semibold text-gold-dark hover:bg-gold hover:text-ink">
                    Buyer Package
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 pl-0.5 text-[11px] text-ink/50">
                  <span className="font-semibold uppercase tracking-wide text-ink/35">Include:</span>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" name="include_overview" defaultChecked className="h-3 w-3 rounded" />
                    Overview
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" name="include_numbers" defaultChecked className="h-3 w-3 rounded" />
                    Numbers
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" name="include_photos" className="h-3 w-3 rounded" />
                    Photos
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" name="include_comps" className="h-3 w-3 rounded" />
                    Comps
                  </label>
                </div>
              </form>
            </div>

            <ul className="mt-4 flex flex-col gap-3">
              {documentsWithUrls.map((doc) => (
                <li key={doc.id} className="rounded-lg border border-ink/10 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-ink">{doc.document_type}</p>
                      <p className="text-xs text-ink/40">{new Date(doc.created_at).toLocaleString()}</p>
                    </div>
                    {doc.url ? (
                      <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-gold-dark hover:underline">
                        Open
                      </a>
                    ) : (
                      <span className="text-xs text-ink/30">Link expired</span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-xs font-semibold " +
                        (doc.esign_status === "Signed"
                          ? "bg-emerald-100 text-emerald-700"
                          : doc.esign_status === "Sent" || doc.esign_status === "Viewed"
                          ? "bg-amber-100 text-amber-700"
                          : doc.esign_status === "Declined" || doc.esign_status === "Voided"
                          ? "bg-red-100 text-red-700"
                          : "bg-ink/10 text-ink/50")
                      }
                    >
                      {doc.esign_status ?? "Not Sent"}
                    </span>

                    {(doc.esign_status === "Not Sent" || !doc.esign_status) && (
                      <form action={sendForSignature.bind(null, doc.id, params.id)} className="flex items-center gap-1">
                        <input
                          name="signer_email"
                          type="email"
                          placeholder="Signer email (optional)"
                          className="focus-gold rounded-lg border border-ink/15 px-2 py-1 text-xs"
                        />
                        <button type="submit" className="text-xs font-semibold text-gold-dark hover:underline">
                          Mark Sent
                        </button>
                      </form>
                    )}
                    {doc.esign_status === "Sent" && (
                      <>
                        <form action={updateDocumentEsignStatus.bind(null, doc.id, params.id, "Viewed")}>
                          <button type="submit" className="text-xs font-semibold text-ink/60 hover:underline">Mark Viewed</button>
                        </form>
                        <form action={updateDocumentEsignStatus.bind(null, doc.id, params.id, "Signed")}>
                          <button type="submit" className="text-xs font-semibold text-emerald-700 hover:underline">Mark Signed</button>
                        </form>
                        <form action={updateDocumentEsignStatus.bind(null, doc.id, params.id, "Declined")}>
                          <button type="submit" className="text-xs font-semibold text-red-600 hover:underline">Mark Declined</button>
                        </form>
                      </>
                    )}
                    {doc.esign_status === "Viewed" && (
                      <>
                        <form action={updateDocumentEsignStatus.bind(null, doc.id, params.id, "Signed")}>
                          <button type="submit" className="text-xs font-semibold text-emerald-700 hover:underline">Mark Signed</button>
                        </form>
                        <form action={updateDocumentEsignStatus.bind(null, doc.id, params.id, "Declined")}>
                          <button type="submit" className="text-xs font-semibold text-red-600 hover:underline">Mark Declined</button>
                        </form>
                      </>
                    )}
                  </div>

                  <div className="mt-2.5 rounded-lg border border-ink/10 bg-cream/30 p-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-ink/35">
                      Signers, in order {doc.signers.length > 1 ? "— each waits for the one before to sign" : ""}
                    </p>
                    {doc.signers.length === 0 && (
                      <p className="mt-1 text-xs text-ink/30">
                        No named signers — use the status above for a single-signer document, or add signers below for a signing order (e.g. seller then buyer).
                      </p>
                    )}
                    <ol className="mt-1.5 flex flex-col gap-1.5">
                      {doc.signers.map((signer, idx) => {
                        const canSend = doc.signers.slice(0, idx).every((s) => s.status === "Signed");
                        return (
                          <li key={signer.id} className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                            <span>
                              <span className="font-semibold text-ink/70">
                                #{signer.sign_order} {signer.signer_name}
                              </span>
                              {signer.signer_role && <span className="text-ink/40"> · {signer.signer_role}</span>}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span
                                className={
                                  "rounded-full px-2 py-0.5 text-[10px] font-bold " +
                                  (signer.status === "Signed"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : signer.status === "Sent" || signer.status === "Viewed"
                                    ? "bg-amber-100 text-amber-700"
                                    : signer.status === "Declined"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-ink/10 text-ink/50")
                                }
                              >
                                {signer.status}
                              </span>
                              {signer.status === "Not Sent" && canSend && (
                                <form action={updateSignerStatus.bind(null, signer.id, doc.id, params.id, "Sent")}>
                                  <button type="submit" className="font-semibold text-gold-dark hover:underline">Send</button>
                                </form>
                              )}
                              {signer.status === "Not Sent" && !canSend && (
                                <span className="text-ink/30" title="Waiting on an earlier signer to sign first">Waiting…</span>
                              )}
                              {(signer.status === "Sent" || signer.status === "Viewed") && (
                                <>
                                  {signer.status === "Sent" && (
                                    <form action={updateSignerStatus.bind(null, signer.id, doc.id, params.id, "Viewed")}>
                                      <button type="submit" className="font-semibold text-ink/60 hover:underline">Viewed</button>
                                    </form>
                                  )}
                                  <form action={updateSignerStatus.bind(null, signer.id, doc.id, params.id, "Signed")}>
                                    <button type="submit" className="font-semibold text-emerald-700 hover:underline">Signed</button>
                                  </form>
                                  <form action={updateSignerStatus.bind(null, signer.id, doc.id, params.id, "Declined")}>
                                    <button type="submit" className="font-semibold text-red-600 hover:underline">Declined</button>
                                  </form>
                                </>
                              )}
                              <form action={removeDocumentSigner.bind(null, signer.id, doc.id, params.id)}>
                                <button type="submit" title="Remove signer" className="font-semibold text-ink/30 hover:text-red-600">
                                  ×
                                </button>
                              </form>
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                    <form action={addDocumentSigner.bind(null, doc.id, params.id)} className="mt-2 flex flex-wrap items-center gap-1">
                      <input name="signer_name" placeholder="Signer name" className="focus-gold rounded-lg border border-ink/15 px-2 py-1 text-xs" />
                      <input name="signer_role" placeholder="Role (e.g. Seller)" className="focus-gold rounded-lg border border-ink/15 px-2 py-1 text-xs" />
                      <input name="signer_email" type="email" placeholder="Email (optional)" className="focus-gold rounded-lg border border-ink/15 px-2 py-1 text-xs" />
                      <button
                        type="submit"
                        className="focus-gold rounded-full border border-gold px-2.5 py-1 text-xs font-semibold text-gold-dark hover:bg-gold hover:text-ink"
                      >
                        + Add Signer
                      </button>
                    </form>
                  </div>
                </li>
              ))}
              {documentsWithUrls.length === 0 && <p className="text-sm text-ink/40">No documents generated yet.</p>}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-ink">Deal Terms</h2>
            <form action={updateDealWithId} className="mt-3 flex flex-col gap-3">
              <div>
                <label className="text-sm font-medium text-ink/70">Stage</label>
                <select name="stage" defaultValue={d.stage} className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm">
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-ink/70">Exit Strategy</label>
                <select name="exit_strategy" defaultValue={d.exit_strategy ?? ""} className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm">
                  <option value="">—</option>
                  {EXIT_STRATEGIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-ink/60">ARV Estimate</label>
                  <input name="arv_estimate" type="number" defaultValue={d.arv_estimate ?? ""} className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink/60">Est. Repairs</label>
                  <input name="estimated_repairs" type="number" defaultValue={d.estimated_repairs ?? ""} className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink/60">Purchase Price</label>
                  <input name="purchase_price" type="number" defaultValue={d.purchase_price ?? ""} className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink/60">Assignment Fee</label>
                  <input name="assignment_fee" type="number" defaultValue={d.assignment_fee ?? ""} className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-ink/70">Closing Date</label>
                <input name="closing_date" type="date" defaultValue={d.closing_date ?? ""} className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink/70">Cash Buyer</label>
                <select name="cash_buyer_id" defaultValue={d.cash_buyer_id ?? ""} className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm">
                  <option value="">Unassigned</option>
                  {((buyers as CashBuyer[]) ?? []).map((b) => (
                    <option key={b.id} value={b.id}>{b.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-ink/70">Title Company</label>
                <select name="title_company_id" defaultValue={d.title_company_id ?? ""} className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm">
                  <option value="">Unassigned</option>
                  {((titleCompanies as TitleCompany[]) ?? []).map((t) => (
                    <option key={t.id} value={t.id}>{t.company_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-ink/70">Notes</label>
                <textarea name="notes" defaultValue={d.notes ?? ""} rows={3} className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" />
              </div>
              <button type="submit" className="focus-gold rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold-light">
                Save Deal
              </button>
            </form>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-ink">Activity History</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {((activity as { id: string; action: string; actor_type: string; created_at: string }[]) ?? []).map((entry) => (
                <li key={entry.id} className="border-b border-ink/5 pb-2 text-xs last:border-0">
                  <p className="text-ink">{entry.action}</p>
                  <p className="text-ink/40">
                    {entry.actor_type === "ai" ? "AI" : "Team"} · {new Date(entry.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
              {(!activity || activity.length === 0) && <li className="text-xs text-ink/40">No activity yet.</li>}
            </ul>
          </div>

          {d.seller_submission_id && (
            <Link
              href={`/admin/leads/${d.seller_submission_id}`}
              className="focus-gold text-center text-sm font-semibold text-gold-dark hover:underline"
            >
              ← Back to lead
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
