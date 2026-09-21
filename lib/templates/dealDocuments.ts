/**
 * Deal Summary and Buyer Deal Package templates. Same {{placeholder}}
 * mail-merge approach as the Purchase Agreement (see contractGenerator.ts)
 * — no PDF-rendering package is installed in this sandbox, so these
 * generate as clean, print-ready HTML.
 */

export const DEAL_SUMMARY_TEMPLATE = `
<h1>Deal Summary</h1>
<p><strong>Reference:</strong> {{reference_number}}</p>
<p><strong>Property:</strong> {{property_address}}, {{property_city}}, {{property_state}} {{property_zip}}</p>

<h2>Numbers</h2>
<p><strong>ARV Estimate:</strong> {{arv_estimate}}</p>
<p><strong>Estimated Repairs:</strong> {{estimated_repairs}}</p>
<p><strong>Purchase Price:</strong> {{purchase_price}}</p>
<p><strong>Exit Strategy:</strong> {{exit_strategy}}</p>
<p><strong>Assignment Fee:</strong> {{assignment_fee}}</p>

<h2>Status</h2>
<p><strong>Stage:</strong> {{stage}}</p>
<p><strong>Closing Date:</strong> {{closing_date}}</p>
<p><strong>Cash Buyer:</strong> {{buyer_name}}</p>
<p><strong>Title Company:</strong> {{title_company_name}}</p>

<p style="margin-top:24px;font-size:11px;color:#777;">Generated {{today}} — internal use only.</p>
`;

/**
 * The buyer package's Overview/Numbers/Photos/Comps sections are each
 * optional — the admin picks which to include per send (see the
 * "PDF-inclusion checkboxes" on the deal page), so each placeholder below
 * is filled with either that section's full HTML block or an empty string
 * rather than always being present. Only Contact is always shown.
 */
export const BUYER_PACKAGE_TEMPLATE = `
<h1>Property Package</h1>
<p><strong>{{property_address}}, {{property_city}}, {{property_state}} {{property_zip}}</strong></p>
{{overview_section}}
{{numbers_section}}
{{photos_section}}
{{comps_section}}
<h2>Contact</h2>
<p>{{contact_line}}</p>

<p style="margin-top:24px;font-size:11px;color:#777;">Prepared {{today}} by DERAX. Buyer to verify all figures independently.</p>
`;
