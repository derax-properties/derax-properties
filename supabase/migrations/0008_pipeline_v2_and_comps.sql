-- =============================================================================
-- 0008_pipeline_v2_and_comps.sql
--
-- Structural pipeline correction requested by the owner: pipeline_stage,
-- lead_source, lead_type, and motivation must stay independent fields (they
-- already were), but the pipeline itself needs two more real stages
-- (Negotiating, Disposition) and "Dead" needs to become "Dead / Lost" with a
-- required reason — matching the acquisitions workflow rather than a
-- flat kanban of mixed concepts. Auction moves from being a lead_source
-- value to a lead_type value, since "how a lead was found" (Public
-- Records, Website, Referral, ...) and "what kind of distressed situation
-- it is" (Auction, Pre-Foreclosure, ...) are different questions.
--
-- Also adds `lead_comps`: structured comparable sales (one row per comp,
-- same one-row-per-item pattern as repair_items/buyer_zip_codes) so the
-- underwriting workspace can show a real comps table with relative sale
-- age ("3 months ago") instead of the old single `comps_note` free-text
-- field, which is kept as-is for any general underwriting narrative.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- pipeline_stage: add Negotiating + Disposition, rename Dead -> Dead / Lost
-- ---------------------------------------------------------------------------
update seller_submissions set pipeline_stage = 'Dead / Lost' where pipeline_stage = 'Dead';

alter table seller_submissions drop constraint if exists seller_submissions_pipeline_stage_check;
alter table seller_submissions add constraint seller_submissions_pipeline_stage_check
  check (pipeline_stage in (
    'New Lead', 'Contacted', 'Qualified', 'Offer Made', 'Negotiating',
    'Under Contract', 'Disposition', 'Closed', 'Dead / Lost'
  ));

alter table seller_submissions add column if not exists dead_reason text;
alter table seller_submissions add column if not exists dead_reason_note text;
alter table seller_submissions drop constraint if exists seller_submissions_dead_reason_check;
alter table seller_submissions add constraint seller_submissions_dead_reason_check
  check (dead_reason is null or dead_reason in (
    'Price Too High', 'Seller Not Motivated', 'Seller Changed Mind', 'Bad Property',
    'Numbers Don''t Work', 'Could Not Reach Seller', 'Seller Chose Another Buyer',
    'Property Sold', 'Duplicate Lead', 'Not Interested', 'Other'
  ));

-- ---------------------------------------------------------------------------
-- lead_source: Auction removed (now a lead_type); add the requested sources.
-- Any existing "Auction" source lead becomes lead_type='Auction' so it isn't
-- silently reclassified as something else.
-- ---------------------------------------------------------------------------
update seller_submissions set lead_type = 'Auction' where lead_source = 'Auction' and (lead_type is null or lead_type = 'Off-Market');
update seller_submissions set lead_source = 'Other' where lead_source = 'Auction';

alter table seller_submissions drop constraint if exists seller_submissions_lead_source_check;
alter table seller_submissions add constraint seller_submissions_lead_source_check
  check (lead_source in (
    'Website', 'VA Entry', 'Self-Entered', 'Cold Call', 'FSBO', 'Referral',
    'Public Records', 'Real Estate Agent', 'Direct Mail', 'Other'
  ));

-- ---------------------------------------------------------------------------
-- lead_type: expand to the full distressed-situation list.
-- ---------------------------------------------------------------------------
alter table seller_submissions drop constraint if exists seller_submissions_lead_type_check;
alter table seller_submissions add constraint seller_submissions_lead_type_check
  check (lead_type in (
    'Off-Market', 'On-Market', 'Trustee Sale', 'Probate', 'Pre-Foreclosure', 'Auction',
    'Tax Delinquent', 'Vacant', 'Absentee Owner', 'Tired Landlord', 'Divorce',
    'Code Violation', 'FSBO', 'Inherited Property', 'Other'
  ));

-- ---------------------------------------------------------------------------
-- motivation_level: add Unknown, and a separate override flag so an
-- automatic timeline->motivation calculation never silently overwrites a
-- value the admin/VA deliberately chose by hand.
-- ---------------------------------------------------------------------------
alter table seller_submissions drop constraint if exists seller_submissions_motivation_level_check;
alter table seller_submissions add constraint seller_submissions_motivation_level_check
  check (motivation_level in ('Hot', 'Warm', 'Cold', 'Unknown'));

alter table seller_submissions add column if not exists motivation_override boolean not null default false;

-- ---------------------------------------------------------------------------
-- repair_items: optional per-line note, requested alongside the expanded
-- REPAIR_CATEGORIES list and the "+ Add Repair Item" custom-category flow
-- (category is already free text, so no constraint change needed there).
-- ---------------------------------------------------------------------------
alter table repair_items add column if not exists notes text;

-- ---------------------------------------------------------------------------
-- lead_comps — structured comparable sales for the underwriting workspace.
-- ---------------------------------------------------------------------------
create table if not exists lead_comps (
  id uuid primary key default gen_random_uuid(),
  seller_submission_id uuid not null references seller_submissions(id) on delete cascade,
  address text not null,
  sale_price numeric,
  sale_date date,
  bedrooms numeric,
  bathrooms numeric,
  square_feet numeric,
  lot_size text,
  distance_miles numeric,
  condition text,
  comp_rating text check (comp_rating is null or comp_rating in ('Strong', 'Fair', 'Weak')),
  notes text,
  source text not null default 'manual' check (source in ('manual', 'imported')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lead_comps_seller_submission on lead_comps(seller_submission_id);

alter table lead_comps enable row level security;

create policy "Owners/Admins can view comps" on lead_comps
  for select using (has_full_crm_access());
create policy "Owners/Admins can add comps" on lead_comps
  for insert with check (has_full_crm_access());
create policy "Owners/Admins can update comps" on lead_comps
  for update using (has_full_crm_access());
create policy "Owners/Admins can delete comps" on lead_comps
  for delete using (has_full_crm_access());
