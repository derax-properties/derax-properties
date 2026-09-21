-- =============================================================================
-- DERAX CRM — Phase 1 foundation migration
-- Additive only: no existing table is dropped, renamed, or has a column
-- removed. Run this AFTER schema.sql + policies.sql on an existing project.
-- Safe to re-run (every statement is guarded with IF NOT EXISTS / OR REPLACE).
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 0. Reference number format: the plan calls for DRX-XXXXXX (six digits,
--    no year segment). Existing DP-YYYY-XXXXXX values on old rows are left
--    exactly as they are — only new submissions get the new format.
-- ---------------------------------------------------------------------------
create or replace function generate_reference_number()
returns text
language plpgsql
as $$
declare
  candidate text;
  exists_already boolean;
begin
  loop
    candidate := 'DRX-' || lpad(floor(random() * 1000000)::text, 6, '0');
    select exists(
      select 1 from seller_submissions where reference_number = candidate
    ) into exists_already;
    exit when not exists_already;
  end loop;
  return candidate;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Roles: allow "va" alongside admin/owner, and make VA removal
--    non-destructive — a deleted VA's assigned leads fall back to
--    unassigned instead of being blocked or cascaded away.
-- ---------------------------------------------------------------------------
alter table admin_profiles drop constraint if exists admin_profiles_role_check;
alter table admin_profiles add constraint admin_profiles_role_check
  check (role in ('owner', 'admin', 'va'));

alter table admin_profiles add column if not exists invited_by uuid references admin_profiles(id) on delete set null;
alter table admin_profiles add column if not exists invited_at timestamptz;
alter table admin_profiles add column if not exists deactivated_at timestamptz;

alter table seller_submissions drop constraint if exists seller_submissions_assigned_to_fkey;
alter table seller_submissions add constraint seller_submissions_assigned_to_fkey
  foreign key (assigned_to) references admin_profiles(id) on delete set null;

-- ---------------------------------------------------------------------------
-- 2. Lead pipeline fields — kept as distinct columns, never flattened into
--    one status/notes string. `status` (existing) stays the coarse funnel
--    stage; these add the finer-grained fields the plan calls for.
-- ---------------------------------------------------------------------------
alter table seller_submissions add column if not exists lead_source text
  check (lead_source in ('Website', 'VA Entry', 'Self-Entered', 'Auction', 'Referral', 'Other'));
alter table seller_submissions add column if not exists lead_type text
  check (lead_type in ('Off-Market', 'On-Market', 'Trustee Sale', 'Probate', 'Pre-Foreclosure', 'Other'));
alter table seller_submissions add column if not exists pipeline_stage text
  check (pipeline_stage in ('New Lead', 'Contacted', 'Qualified', 'Offer Made', 'Under Contract', 'Closed', 'Dead'));
alter table seller_submissions add column if not exists motivation_level text
  check (motivation_level in ('Hot', 'Warm', 'Cold'));
alter table seller_submissions add column if not exists best_callback_time text;
alter table seller_submissions add column if not exists preferred_contact_methods text[] default '{}';

-- structured address fields for the single-field autocomplete (Batch 6 /
-- sections 57-61): parsed automatically, never asked of the seller directly.
alter table seller_submissions add column if not exists formatted_address text;
alter table seller_submissions add column if not exists latitude numeric;
alter table seller_submissions add column if not exists longitude numeric;
alter table seller_submissions add column if not exists place_id text;
alter table seller_submissions add column if not exists address_country text default 'US';
alter table seller_submissions add column if not exists address_confidence text
  check (address_confidence in ('high', 'medium', 'low', 'unresolved'));

-- Duplicate flagging (never silent auto-merge, never silent auto-drop): a
-- new submission that matches an existing one by phone/email/address is
-- still saved as its own row, just linked here so an admin can review and
-- decide what to do with it.
alter table seller_submissions add column if not exists possible_duplicate_of uuid
  references seller_submissions(id) on delete set null;

create index if not exists idx_seller_submissions_pipeline_stage on seller_submissions(pipeline_stage);
create index if not exists idx_seller_submissions_motivation on seller_submissions(motivation_level);
create index if not exists idx_seller_submissions_assigned_to on seller_submissions(assigned_to);

-- ---------------------------------------------------------------------------
-- 3. Cash buyers, their ZIP coverage, and investment criteria
--    (each kept in its own table — never flattened into one row/string).
-- ---------------------------------------------------------------------------
create table if not exists cash_buyers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  company_name text,
  phone text,
  email text,
  buyer_type text check (buyer_type in ('Fix & Flip', 'Buy & Hold', 'Wholesaler', 'Developer', 'Other')),
  proof_of_funds_on_file boolean not null default false,
  notes text,
  status text not null default 'Active' check (status in ('Active', 'Inactive', 'Do Not Contact'))
);

create table if not exists buyer_zip_codes (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references cash_buyers(id) on delete cascade,
  zip text not null,
  unique (buyer_id, zip)
);
create index if not exists idx_buyer_zip_codes_zip on buyer_zip_codes(zip);

create table if not exists buyer_investment_criteria (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references cash_buyers(id) on delete cascade,
  property_type text,
  min_price numeric,
  max_price numeric,
  min_bedrooms integer,
  min_bathrooms numeric,
  min_sqft integer,
  max_repair_budget numeric,
  preferred_strategy text check (preferred_strategy in ('Fix & Flip', 'Buy & Hold', 'Wholesale', 'Development', 'Land')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Title companies
-- ---------------------------------------------------------------------------
create table if not exists title_companies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company_name text not null,
  contact_name text,
  phone text,
  email text,
  states_covered text[] default '{}',
  notes text,
  status text not null default 'Active' check (status in ('Active', 'Inactive'))
);

-- ---------------------------------------------------------------------------
-- 5. Deals — the closing tracker. Both buyer and title-company links are
--    non-destructive (ON DELETE SET NULL): removing a buyer or title
--    company from the database never deletes or blocks a deal record.
-- ---------------------------------------------------------------------------
create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  seller_submission_id uuid references seller_submissions(id) on delete set null,
  cash_buyer_id uuid references cash_buyers(id) on delete set null,
  title_company_id uuid references title_companies(id) on delete set null,
  exit_strategy text check (exit_strategy in ('Wholesale', 'Assignment', 'Double Close', 'Fix & Flip', 'Buy & Hold')),
  purchase_price numeric,
  assignment_fee numeric,
  estimated_repairs numeric,
  arv_estimate numeric,
  stage text not null default 'Contract Sent' check (stage in (
    'Contract Sent', 'Contract Signed', 'Under Contract', 'Buyer Assigned',
    'Closing Scheduled', 'Closed', 'Fell Through'
  )),
  closing_date date,
  notes text
);
create index if not exists idx_deals_stage on deals(stage);
create index if not exists idx_deals_seller_submission_id on deals(seller_submission_id);

-- ---------------------------------------------------------------------------
-- 6. Contract templates + generated documents
-- ---------------------------------------------------------------------------
create table if not exists contract_templates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  description text,
  field_map jsonb not null default '{}',
  storage_path text not null,
  is_active boolean not null default true
);

create table if not exists generated_documents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  deal_id uuid references deals(id) on delete set null,
  template_id uuid references contract_templates(id) on delete set null,
  document_type text not null check (document_type in (
    'Purchase Agreement', 'Assignment Contract', 'Deal Summary PDF', 'Buyer Deal Package PDF', 'Other'
  )),
  storage_path text,
  esign_status text check (esign_status in ('Not Sent', 'Sent', 'Viewed', 'Signed', 'Declined', 'Voided')),
  esign_provider text,
  esign_envelope_id text,
  generated_by uuid references admin_profiles(id) on delete set null
);
create index if not exists idx_generated_documents_deal_id on generated_documents(deal_id);

-- ---------------------------------------------------------------------------
-- 7. ZIP population intelligence cache (section 52-56): one row per ZCTA,
--    updated in place on refresh rather than duplicated.
-- ---------------------------------------------------------------------------
create table if not exists zip_population_cache (
  zip text primary key,
  population integer,
  city text,
  county text,
  state text,
  data_source text not null default 'U.S. Census Bureau (ZCTA)',
  data_year integer,
  lookup_failed boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 8. Activity log — append-only history for leads and deals. AI-generated
--    entries are always tagged as such and never silently blended in with
--    human actions.
-- ---------------------------------------------------------------------------
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  seller_submission_id uuid references seller_submissions(id) on delete cascade,
  deal_id uuid references deals(id) on delete cascade,
  actor_id uuid references admin_profiles(id) on delete set null,
  actor_type text not null default 'user' check (actor_type in ('user', 'ai', 'system')),
  action text not null,
  details jsonb default '{}'
);
create index if not exists idx_activity_log_seller_submission_id on activity_log(seller_submission_id);
create index if not exists idx_activity_log_deal_id on activity_log(deal_id);
