import { DEFAULT_PURCHASE_AGREEMENT_TEMPLATE } from "./templates/purchaseAgreement";
import { DEAL_SUMMARY_TEMPLATE, BUYER_PACKAGE_TEMPLATE } from "./templates/dealDocuments";
import type { Deal, SellerSubmission, CashBuyer, TitleCompany } from "./types";

function fillTemplate(template: string, values: Record<string, string>): string {
  let merged = template;
  for (const [key, value] of Object.entries(values)) {
    merged = merged.split(`{{${key}}}`).join(value);
  }
  return merged;
}

export function mergeDealSummary(deal: Deal, lead: SellerSubmission, buyer: CashBuyer | null, titleCompany: TitleCompany | null): string {
  return fillTemplate(DEAL_SUMMARY_TEMPLATE, {
    today: new Date().toLocaleDateString("en-US"),
    reference_number: lead.reference_number,
    property_address: lead.property_address,
    property_city: lead.city,
    property_state: lead.state,
    property_zip: lead.zip,
    arv_estimate: deal.arv_estimate != null ? `$${deal.arv_estimate.toLocaleString()}` : "Not set",
    estimated_repairs: deal.estimated_repairs != null ? `$${deal.estimated_repairs.toLocaleString()}` : "Not set",
    purchase_price: deal.purchase_price != null ? `$${deal.purchase_price.toLocaleString()}` : "Not set",
    exit_strategy: deal.exit_strategy ?? "Not set",
    assignment_fee: deal.assignment_fee != null ? `$${deal.assignment_fee.toLocaleString()}` : "Not set",
    stage: deal.stage,
    closing_date: deal.closing_date ? new Date(deal.closing_date).toLocaleDateString("en-US") : "Not scheduled",
    buyer_name: buyer?.full_name ?? "Unassigned",
    title_company_name: titleCompany?.company_name ?? "Unassigned",
  });
}

/**
 * The buyer-facing package deliberately omits internal numbers a buyer has
 * no business seeing (assignment fee, MAO, purchase price) — only the
 * property facts and the asking/assignment price go out. `contactLine`
 * lets the caller customize who the buyer should reach out to.
 */
export function mergeBuyerPackage(deal: Deal, lead: SellerSubmission, contactLine: string): string {
  return fillTemplate(BUYER_PACKAGE_TEMPLATE, {
    today: new Date().toLocaleDateString("en-US"),
    property_address: lead.property_address,
    property_city: lead.city,
    property_state: lead.state,
    property_zip: lead.zip,
    property_type: lead.property_type,
    beds_baths_sqft: `${lead.bedrooms ?? "—"} / ${lead.bathrooms ?? "—"} / ${lead.square_feet ?? "—"}`,
    year_built: String(lead.year_built ?? "—"),
    condition: lead.condition,
    arv_estimate: deal.arv_estimate != null ? `$${deal.arv_estimate.toLocaleString()}` : "Contact for details",
    estimated_repairs: deal.estimated_repairs != null ? `$${deal.estimated_repairs.toLocaleString()}` : "Contact for details",
    asking_price:
      deal.exit_strategy === "Wholesale" || deal.exit_strategy === "Assignment"
        ? deal.assignment_fee != null && deal.purchase_price != null
          ? `$${(deal.purchase_price + deal.assignment_fee).toLocaleString()}`
          : "Contact for pricing"
        : deal.purchase_price != null
        ? `$${deal.purchase_price.toLocaleString()}`
        : "Contact for pricing",
    contact_line: contactLine,
  });
}

/**
 * Simple {{placeholder}} mail-merge — no external template-processing
 * package is installed in this environment, so this stays dependency-free.
 * A real contract_templates row's `field_map` (jsonb) can extend this with
 * its own placeholder -> value mapping; this function always fills the
 * built-in fields first, then applies any custom ones on top.
 */
export function mergePurchaseAgreement(
  deal: Deal,
  lead: SellerSubmission,
  buyer: CashBuyer | null,
  titleCompany: TitleCompany | null,
  extraFieldMap: Record<string, string> = {}
): string {
  const values: Record<string, string> = {
    today: new Date().toLocaleDateString("en-US"),
    seller_name: `${lead.first_name} ${lead.last_name}`,
    buyer_name: buyer?.full_name ?? "_______________________",
    buyer_company_line: buyer?.company_name ? ` (${buyer.company_name})` : "",
    property_address: lead.property_address,
    property_city: lead.city,
    property_state: lead.state,
    property_zip: lead.zip,
    purchase_price: deal.purchase_price != null ? `$${deal.purchase_price.toLocaleString()}` : "_______________",
    closing_date: deal.closing_date ? new Date(deal.closing_date).toLocaleDateString("en-US") : "_______________",
    title_company_name: titleCompany?.company_name ?? "a title company to be named",
    assignment_clause:
      deal.exit_strategy === "Wholesale" || deal.exit_strategy === "Assignment"
        ? "Buyer reserves the right to assign this Agreement to another party without Seller's further consent."
        : "This Agreement may not be assigned without the written consent of both parties.",
    ...extraFieldMap,
  };

  let merged = DEFAULT_PURCHASE_AGREEMENT_TEMPLATE;
  for (const [key, value] of Object.entries(values)) {
    merged = merged.split(`{{${key}}}`).join(value);
  }
  return merged;
}

/**
 * Wraps merged contract HTML in a minimal printable document. Server-side
 * binary PDF generation would need a package like pdfkit or puppeteer,
 * which this sandbox couldn't install (no package-registry access) or
 * verify — so documents are generated as clean, styled HTML that opens in
 * any browser and prints to PDF with "Print > Save as PDF". Swapping in a
 * real PDF renderer later only means changing where this HTML is sent.
 */
export function wrapAsPrintableDocument(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; color: #1a1a1a; line-height: 1.6; }
  h1 { font-size: 22px; } h2 { font-size: 15px; margin-top: 24px; }
  p { font-size: 13px; }
  @media print { body { margin: 0.5in; } }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}
