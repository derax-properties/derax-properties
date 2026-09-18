-- =============================================================================
-- Sample properties for local development / demoing the homepage and
-- /properties page before real inventory is entered through the admin
-- dashboard. Safe to skip in production — the site works fine with zero
-- rows (Featured Properties simply shows nothing until you add listings).
-- =============================================================================

insert into properties (
  slug, title, address_line, city, state, zip, price, bedrooms, bathrooms,
  square_feet, year_built, property_type, strategy, status, badge,
  description, highlights
) values
  (
    'houston-tx-fix-and-flip-sample',
    'Sample Fix & Flip Opportunity',
    null, 'Houston', 'TX', '77002', 85000, 3, 1, 1350, 1968,
    'Single Family', 'Fix & Flip', 'Available', 'Fix & Flip',
    'Sample listing for demonstration. A single-family home in a growing Houston submarket with strong comparable resale values after renovation.',
    array['Below-market acquisition price', 'Strong resale comps in the area', 'Estimated light-to-moderate rehab scope']
  ),
  (
    'atlanta-ga-investment-sample',
    'Sample Investment Property',
    null, 'Atlanta', 'GA', '30310', 125000, 4, 2, 1820, 1975,
    'Single Family', 'Buy & Hold', 'Available', 'Investment',
    'Sample listing for demonstration. A four-bedroom property suited to a long-term rental hold in an in-demand Atlanta neighborhood.',
    array['Positive projected cash flow', 'Established rental demand nearby', 'Recently occupied, tenant-ready condition']
  ),
  (
    'dallas-tx-wholesale-sample',
    'Sample Wholesale Deal',
    null, 'Dallas', 'TX', '75216', 72000, 2, 1, 1100, 1959,
    'Single Family', 'Wholesale', 'Available', 'Wholesale Deal',
    'Sample listing for demonstration. An off-market wholesale assignment opportunity for an investor ready to move quickly.',
    array['Assignable contract', 'Priced for a fast close', 'As-is condition']
  ),
  (
    'columbus-oh-build-and-hold-sample',
    'Sample Build & Hold Property',
    null, 'Columbus', 'OH', '43204', 110000, 3, 2, 1600, 1982,
    'Single Family', 'Buy & Hold', 'Available', 'Build & Hold',
    'Sample listing for demonstration. A solidly-built property with room to add value and hold for long-term appreciation.',
    array['Stable neighborhood fundamentals', 'Room for value-add improvements', 'Long-term hold candidate']
  )
on conflict (slug) do nothing;
