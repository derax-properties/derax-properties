/**
 * Default Purchase Agreement template. Every {{placeholder}} is filled in
 * by lib/contractGenerator.ts from the deal/lead/buyer records. This is a
 * plain-language starting point, not a substitute for review by a Georgia
 * real estate attorney before it's used on a real deal.
 */
export const DEFAULT_PURCHASE_AGREEMENT_TEMPLATE = `
<h1>Real Estate Purchase & Sale Agreement</h1>
<p>This agreement is entered into as of {{today}} between:</p>
<p><strong>Seller:</strong> {{seller_name}}</p>
<p><strong>Buyer:</strong> {{buyer_name}}{{buyer_company_line}}</p>

<h2>1. Property</h2>
<p>The property located at <strong>{{property_address}}, {{property_city}}, {{property_state}} {{property_zip}}</strong> ("the Property").</p>

<h2>2. Purchase Price</h2>
<p>The total purchase price for the Property is <strong>{{purchase_price}}</strong>, payable in cash at closing.</p>

<h2>3. Earnest Money</h2>
<p>Buyer shall deposit earnest money as agreed by both parties with the title company or escrow agent named below.</p>

<h2>4. Closing</h2>
<p>Closing shall take place on or before <strong>{{closing_date}}</strong>, at {{title_company_name}}, or such other date/location as mutually agreed in writing.</p>

<h2>5. Condition of Property</h2>
<p>The Property is being sold "AS-IS, WHERE-IS" with no warranties, express or implied, as to condition.</p>

<h2>6. Assignment</h2>
<p>{{assignment_clause}}</p>

<h2>7. Signatures</h2>
<p>Seller: _______________________________ Date: ______________</p>
<p>Buyer: _______________________________ Date: ______________</p>
`;
