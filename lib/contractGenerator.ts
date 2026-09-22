import { DEFAULT_PURCHASE_AGREEMENT_TEMPLATE } from "./templates/purchaseAgreement";
import { DEAL_SUMMARY_TEMPLATE, BUYER_PACKAGE_TEMPLATE } from "./templates/dealDocuments";
import type { Deal, SellerSubmission, CashBuyer, TitleCompany, LeadComp } from "./types";
import { formatLeadName } from "./utils";

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

export interface BuyerPackageSections {
  overview: boolean;
  numbers: boolean;
  photos: boolean;
  comps: boolean;
}

/**
 * The buyer-facing package deliberately omits internal numbers a buyer has
 * no business seeing (assignment fee, MAO, purchase price) — only the
 * property facts and the asking/assignment price go out. `contactLine`
 * lets the caller customize who the buyer should reach out to.
 *
 * Overview / Numbers / Photos / Comps are each opt-in per send via
 * `sections` — the admin checks which apply on the deal page before
 * generating, so (for example) a buyer package can go out with just
 * photos and a contact line, or with the full breakdown, without a
 * separate template for every combination. `photoUrls` are already-signed
 * URLs (see the caller) and `comps` are that lead's saved comparable
 * sales; both are simply omitted from the document when their section is
 * unchecked or there's nothing to show.
 */
export function mergeBuyerPackage(
  deal: Deal,
  lead: SellerSubmission,
  contactLine: string,
  sections: BuyerPackageSections,
  photoUrls: string[] = [],
  comps: LeadComp[] = []
): string {
  const overviewSection = sections.overview
    ? `<h2>Overview</h2>
<p><strong>Property Type:</strong> ${lead.property_type}</p>
<p><strong>Beds / Baths / Sq Ft:</strong> ${lead.bedrooms ?? "—"} / ${lead.bathrooms ?? "—"} / ${lead.square_feet ?? "—"}</p>
<p><strong>Year Built:</strong> ${lead.year_built ?? "—"}</p>
<p><strong>Condition:</strong> ${lead.condition}</p>`
    : "";

  const askingPrice =
    deal.exit_strategy === "Wholesale" || deal.exit_strategy === "Assignment"
      ? deal.assignment_fee != null && deal.purchase_price != null
        ? `$${(deal.purchase_price + deal.assignment_fee).toLocaleString()}`
        : "Contact for pricing"
      : deal.purchase_price != null
      ? `$${deal.purchase_price.toLocaleString()}`
      : "Contact for pricing";

  const numbersSection = sections.numbers
    ? `<h2>Numbers</h2>
<p><strong>ARV Estimate:</strong> ${deal.arv_estimate != null ? `$${deal.arv_estimate.toLocaleString()}` : "Contact for details"}</p>
<p><strong>Estimated Repairs:</strong> ${deal.estimated_repairs != null ? `$${deal.estimated_repairs.toLocaleString()}` : "Contact for details"}</p>
<p><strong>Asking / Assignment Price:</strong> ${askingPrice}</p>`
    : "";

  const photosSection =
    sections.photos && photoUrls.length > 0
      ? `<h2>Photos</h2>
<div style="display:flex;flex-wrap:wrap;gap:8px;">${photoUrls
          .map((url) => `<img src="${url}" style="width:180px;height:135px;object-fit:cover;border-radius:6px;" alt="Property photo" />`)
          .join("")}</div>`
      : "";

  const compsSection =
    sections.comps && comps.length > 0
      ? `<h2>Comparable Sales</h2>
<table style="width:100%;border-collapse:collapse;font-size:12px;">
<thead><tr style="text-align:left;border-bottom:1px solid #ccc;"><th>Address</th><th>Sale Price</th><th>Beds/Baths</th><th>Sq Ft</th></tr></thead>
<tbody>${comps
          .map(
            (c) =>
              `<tr style="border-bottom:1px solid #eee;"><td>${c.address}</td><td>${
                c.sale_price != null ? `$${c.sale_price.toLocaleString()}` : "—"
              }</td><td>${c.bedrooms ?? "—"}/${c.bathrooms ?? "—"}</td><td>${c.square_feet?.toLocaleString() ?? "—"}</td></tr>`
          )
          .join("")}</tbody>
</table>`
      : "";

  return fillTemplate(BUYER_PACKAGE_TEMPLATE, {
    today: new Date().toLocaleDateString("en-US"),
    property_address: lead.property_address,
    property_city: lead.city,
    property_state: lead.state,
    property_zip: lead.zip,
    overview_section: overviewSection,
    numbers_section: numbersSection,
    photos_section: photosSection,
    comps_section: compsSection,
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
    seller_name: formatLeadName(lead.first_name, lead.last_name),
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
