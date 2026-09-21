"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { mergePurchaseAgreement, mergeDealSummary, mergeBuyerPackage, wrapAsPrintableDocument } from "@/lib/contractGenerator";
import { getEsignProvider, type EsignStatus } from "@/lib/esign";
import { getSignedUrl } from "@/lib/storage";
import { getCurrentAdminProfile } from "@/lib/supabase/profile";
import type { Deal, SellerSubmission, CashBuyer, TitleCompany, LeadComp, DocumentSignerStatus } from "@/lib/types";

/**
 * Creates a deal from a lead. Nothing here contacts a buyer, sends a
 * document, or picks an exit strategy — that all happens as explicit
 * follow-up actions once the deal exists.
 */
export async function createDeal(sellerSubmissionId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("deals")
    .insert({ seller_submission_id: sellerSubmissionId, stage: "Contract Sent" })
    .select("id")
    .single();

  if (error || !data) return;

  revalidatePath(`/admin/leads/${sellerSubmissionId}`);
  revalidatePath("/admin/deals");
  redirect(`/admin/deals/${data.id}`);
}

export async function updateDeal(dealId: string, formData: FormData) {
  const supabase = createServerSupabaseClient();

  const toNumberOrNull = (key: string) => {
    const v = formData.get(key);
    if (typeof v !== "string" || v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const payload: Record<string, unknown> = {
    exit_strategy: String(formData.get("exit_strategy") ?? "") || null,
    purchase_price: toNumberOrNull("purchase_price"),
    assignment_fee: toNumberOrNull("assignment_fee"),
    estimated_repairs: toNumberOrNull("estimated_repairs"),
    arv_estimate: toNumberOrNull("arv_estimate"),
    stage: String(formData.get("stage") ?? "Contract Sent"),
    closing_date: String(formData.get("closing_date") ?? "") || null,
    cash_buyer_id: String(formData.get("cash_buyer_id") ?? "") || null,
    title_company_id: String(formData.get("title_company_id") ?? "") || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    updated_at: new Date().toISOString(),
  };

  await supabase.from("deals").update(payload).eq("id", dealId);

  const { data: deal } = await supabase.from("deals").select("seller_submission_id").eq("id", dealId).maybeSingle();

  revalidatePath(`/admin/deals/${dealId}`);
  revalidatePath("/admin/deals");
  if (deal?.seller_submission_id) revalidatePath(`/admin/leads/${deal.seller_submission_id}`);
}

const GENERATED_DOCS_BUCKET = process.env.SUPABASE_GENERATED_DOCS_BUCKET || "generated-documents";

/**
 * Generates a Purchase Agreement from the deal's current numbers and
 * stores it. This is an explicit admin action — it never fires on its own
 * when a deal's fields change, and it never sends anything to the seller
 * or buyer by itself (see sendForSignature below, also explicit).
 */
export async function generatePurchaseAgreement(dealId: string) {
  const admin = createAdminSupabaseClient();

  const { data: deal } = await admin
    .from("deals")
    .select("*, seller_submissions(*)")
    .eq("id", dealId)
    .single();
  if (!deal) return { error: "Deal not found." };

  const lead = deal.seller_submissions as SellerSubmission | null;
  if (!lead) return { error: "This deal has no linked lead." };

  const [{ data: buyer }, { data: titleCompany }] = await Promise.all([
    deal.cash_buyer_id ? admin.from("cash_buyers").select("*").eq("id", deal.cash_buyer_id).maybeSingle() : Promise.resolve({ data: null }),
    deal.title_company_id
      ? admin.from("title_companies").select("*").eq("id", deal.title_company_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const bodyHtml = mergePurchaseAgreement(
    deal as Deal,
    lead,
    (buyer as CashBuyer | null) ?? null,
    (titleCompany as TitleCompany | null) ?? null
  );
  const fullHtml = wrapAsPrintableDocument(`Purchase Agreement — ${lead.property_address}`, bodyHtml);

  const path = `${dealId}/purchase-agreement-${Date.now()}.html`;
  const { error: uploadError } = await admin.storage
    .from(GENERATED_DOCS_BUCKET)
    .upload(path, fullHtml, { contentType: "text/html", upsert: false });
  if (uploadError) return { error: "Could not save the generated document." };

  const profile = await getCurrentAdminProfile();
  await admin.from("generated_documents").insert({
    deal_id: dealId,
    document_type: "Purchase Agreement",
    storage_path: path,
    esign_status: "Not Sent",
    generated_by: profile?.id ?? null,
  });

  await admin.from("activity_log").insert({
    deal_id: dealId,
    actor_id: profile?.id ?? null,
    actor_type: "user",
    action: "Generated Purchase Agreement",
  });

  revalidatePath(`/admin/deals/${dealId}`);
  return {};
}

/**
 * Records that a document was sent for signature. Uses whatever provider
 * lib/esign.ts is configured with (a manual stub today — see that file);
 * this is always triggered by an explicit click, never automatically.
 */
export async function sendForSignature(documentId: string, dealId: string, formData: FormData) {
  const signerEmail = String(formData.get("signer_email") ?? "").trim() || null;
  const admin = createAdminSupabaseClient();
  const { data: doc } = await admin.from("generated_documents").select("storage_path").eq("id", documentId).maybeSingle();

  const provider = getEsignProvider();
  const { envelopeId } = await provider.send(doc?.storage_path ?? "", signerEmail);

  await admin
    .from("generated_documents")
    .update({ esign_status: "Sent", esign_provider: provider.name, esign_envelope_id: envelopeId })
    .eq("id", documentId);

  const profile = await getCurrentAdminProfile();
  await admin.from("activity_log").insert({
    deal_id: dealId,
    actor_id: profile?.id ?? null,
    actor_type: "user",
    action: `Marked document sent for signature${signerEmail ? ` to ${signerEmail}` : ""}`,
  });

  revalidatePath(`/admin/deals/${dealId}`);
}

async function loadDealBundle(dealId: string) {
  const admin = createAdminSupabaseClient();
  const { data: deal } = await admin.from("deals").select("*, seller_submissions(*)").eq("id", dealId).single();
  if (!deal) return null;
  const lead = deal.seller_submissions as SellerSubmission | null;
  if (!lead) return null;

  const [{ data: buyer }, { data: titleCompany }] = await Promise.all([
    deal.cash_buyer_id ? admin.from("cash_buyers").select("*").eq("id", deal.cash_buyer_id).maybeSingle() : Promise.resolve({ data: null }),
    deal.title_company_id
      ? admin.from("title_companies").select("*").eq("id", deal.title_company_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return { admin, deal: deal as Deal, lead, buyer: (buyer as CashBuyer | null) ?? null, titleCompany: (titleCompany as TitleCompany | null) ?? null };
}

async function saveGeneratedDocument(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  dealId: string,
  documentType: "Purchase Agreement" | "Deal Summary PDF" | "Buyer Deal Package PDF",
  title: string,
  bodyHtml: string
) {
  const fullHtml = wrapAsPrintableDocument(title, bodyHtml);
  const path = `${dealId}/${documentType.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.html`;
  const { error } = await admin.storage.from(GENERATED_DOCS_BUCKET).upload(path, fullHtml, { contentType: "text/html", upsert: false });
  if (error) return { error: "Could not save the generated document." };

  const profile = await getCurrentAdminProfile();
  await admin.from("generated_documents").insert({
    deal_id: dealId,
    document_type: documentType,
    storage_path: path,
    esign_status: documentType === "Purchase Agreement" ? "Not Sent" : null,
    generated_by: profile?.id ?? null,
  });
  await admin.from("activity_log").insert({
    deal_id: dealId,
    actor_id: profile?.id ?? null,
    actor_type: "user",
    action: `Generated ${documentType}`,
  });
  return {};
}

export async function generateDealSummary(dealId: string) {
  const bundle = await loadDealBundle(dealId);
  if (!bundle) return { error: "Deal or lead not found." };
  const bodyHtml = mergeDealSummary(bundle.deal, bundle.lead, bundle.buyer, bundle.titleCompany);
  const result = await saveGeneratedDocument(bundle.admin, dealId, "Deal Summary PDF", `Deal Summary — ${bundle.lead.property_address}`, bodyHtml);
  revalidatePath(`/admin/deals/${dealId}`);
  return result;
}

/**
 * The Buyer Deal Package intentionally never includes internal numbers
 * (assignment fee, MAO, purchase price) — see mergeBuyerPackage. The
 * contact line defaults to the DERAX acquisitions line; pass a custom one
 * via formData to customize it per send, per the plan's "customizable
 * Buyer Deal Package" requirement.
 *
 * Which sections go in (Overview, Numbers, Photos, Comps) are checkboxes
 * on the deal page, read here from formData — so the same "Buyer Package"
 * button can produce anything from a bare contact line to the full
 * breakdown with photos and comps, per send, without a separate template
 * for each combination. Photo URLs embedded in the generated HTML are
 * signed for 7 days rather than the usual short-lived default, since this
 * document is meant to be opened by a buyer well after it's generated —
 * they'll need regenerating past that window.
 */
export async function generateBuyerPackage(dealId: string, formData: FormData) {
  const bundle = await loadDealBundle(dealId);
  if (!bundle) return { error: "Deal or lead not found." };
  const contactLine =
    String(formData.get("contact_line") ?? "").trim() ||
    `Contact DERAX Acquisitions to discuss this property: ${process.env.NOTIFICATION_EMAIL ?? "acquisitions@deraxproperties.com"}`;

  const sections = {
    overview: formData.get("include_overview") === "on",
    numbers: formData.get("include_numbers") === "on",
    photos: formData.get("include_photos") === "on",
    comps: formData.get("include_comps") === "on",
  };

  let photoUrls: string[] = [];
  if (sections.photos) {
    const { data: photoRows } = await bundle.admin
      .from("seller_property_photos")
      .select("storage_path")
      .eq("submission_id", bundle.lead.id);
    const photoBucket = process.env.SUPABASE_SELLER_PHOTOS_BUCKET || "seller-photos";
    photoUrls = (
      await Promise.all(
        (photoRows ?? []).map((p) => getSignedUrl(photoBucket, p.storage_path, 60 * 60 * 24 * 7))
      )
    ).filter((u): u is string => Boolean(u));
  }

  let comps: LeadComp[] = [];
  if (sections.comps) {
    const { data: compRows } = await bundle.admin
      .from("lead_comps")
      .select("*")
      .eq("seller_submission_id", bundle.lead.id)
      .order("sale_date", { ascending: false });
    comps = (compRows as LeadComp[]) ?? [];
  }

  const bodyHtml = mergeBuyerPackage(bundle.deal, bundle.lead, contactLine, sections, photoUrls, comps);
  const result = await saveGeneratedDocument(bundle.admin, dealId, "Buyer Deal Package PDF", `Property Package — ${bundle.lead.property_address}`, bodyHtml);
  revalidatePath(`/admin/deals/${dealId}`);
  return result;
}

/**
 * The plan's "one-click deal workflow": a single explicit action that
 * generates the Purchase Agreement and advances the stage together,
 * instead of making the admin click through both separately. It's still
 * one deliberate click, not something that fires on its own — and it
 * never sends anything or contacts anyone by itself.
 */
export async function runOneClickWorkflow(dealId: string) {
  const bundle = await loadDealBundle(dealId);
  if (!bundle) return { error: "Deal or lead not found." };

  const bodyHtml = mergePurchaseAgreement(bundle.deal, bundle.lead, bundle.buyer, bundle.titleCompany);
  const docResult = await saveGeneratedDocument(
    bundle.admin,
    dealId,
    "Purchase Agreement",
    `Purchase Agreement — ${bundle.lead.property_address}`,
    bodyHtml
  );
  if (docResult.error) return docResult;

  if (bundle.deal.stage === "Contract Sent") {
    await bundle.admin.from("deals").update({ stage: "Contract Sent", updated_at: new Date().toISOString() }).eq("id", dealId);
  }

  revalidatePath(`/admin/deals/${dealId}`);
  return {};
}

export async function updateDocumentEsignStatus(documentId: string, dealId: string, status: EsignStatus) {
  const supabase = createServerSupabaseClient();
  await supabase.from("generated_documents").update({ esign_status: status }).eq("id", documentId);

  const profile = await getCurrentAdminProfile();
  await supabase.from("activity_log").insert({
    deal_id: dealId,
    actor_id: profile?.id ?? null,
    actor_type: "user",
    action: `Marked document as ${status}`,
  });

  revalidatePath(`/admin/deals/${dealId}`);
}

/**
 * Adds a named signer to a document, appended after whoever's already on
 * it (sign_order = current max + 1) — this is what turns a document from
 * the plain single esign_status above into a document with a real signing
 * order (e.g. seller signs first, then buyer).
 */
export async function addDocumentSigner(documentId: string, dealId: string, formData: FormData) {
  const signerName = String(formData.get("signer_name") ?? "").trim();
  if (!signerName) return;
  const signerRole = String(formData.get("signer_role") ?? "").trim() || null;
  const signerEmail = String(formData.get("signer_email") ?? "").trim() || null;

  const supabase = createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("document_signers")
    .select("sign_order")
    .eq("document_id", documentId)
    .order("sign_order", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.sign_order ?? 0) + 1;

  await supabase.from("document_signers").insert({
    document_id: documentId,
    signer_name: signerName,
    signer_role: signerRole,
    signer_email: signerEmail,
    sign_order: nextOrder,
  });

  const profile = await getCurrentAdminProfile();
  await supabase.from("activity_log").insert({
    deal_id: dealId,
    actor_id: profile?.id ?? null,
    actor_type: "user",
    action: `Added signer #${nextOrder}: ${signerName}${signerRole ? ` (${signerRole})` : ""}`,
  });

  revalidatePath(`/admin/deals/${dealId}`);
}

/**
 * Moves one signer's status forward. Enforces the signing order: a signer
 * can only leave "Not Sent" once every signer ahead of them (lower
 * sign_order, same document) is already "Signed" — mirroring what the UI
 * already disables, so a stale page can't skip the order. There's no real
 * e-sign vendor behind this (see lib/esign.ts) — this is the CRM's own
 * tracked sequence, moved forward by an explicit admin click each time.
 */
export async function updateSignerStatus(signerId: string, documentId: string, dealId: string, status: DocumentSignerStatus) {
  const supabase = createServerSupabaseClient();

  if (status !== "Not Sent") {
    const { data: signer } = await supabase.from("document_signers").select("sign_order").eq("id", signerId).maybeSingle();
    if (signer) {
      const { data: earlierSigners } = await supabase
        .from("document_signers")
        .select("status")
        .eq("document_id", documentId)
        .lt("sign_order", signer.sign_order);
      const blocked = (earlierSigners ?? []).some((s) => s.status !== "Signed");
      if (blocked) return;
    }
  }

  await supabase.from("document_signers").update({ status, updated_at: new Date().toISOString() }).eq("id", signerId);

  const profile = await getCurrentAdminProfile();
  await supabase.from("activity_log").insert({
    deal_id: dealId,
    actor_id: profile?.id ?? null,
    actor_type: "user",
    action: `Signer status updated to ${status}`,
  });

  revalidatePath(`/admin/deals/${dealId}`);
}

export async function removeDocumentSigner(signerId: string, documentId: string, dealId: string) {
  const supabase = createServerSupabaseClient();
  await supabase.from("document_signers").delete().eq("id", signerId);
  revalidatePath(`/admin/deals/${dealId}`);
}
