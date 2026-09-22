-- =============================================================================
-- Derax Properties — database schema
-- Run this in the Supabase SQL editor for a new project, then run
-- policies.sql, then (optionally) seed.sql for sample properties.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Reference number generator: DP-YYYY-XXXXXX
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
    candidate := 'DP-' || to_char(now(), 'YYYY') || '-' ||
      lpad(floor(random() * 1000000)::text, 6, '0');
    select exists(
      select 1 from seller_submissions where reference_number = candidate
    ) into exists_already;
    exit when not exists_already;
  end loop;
  return candidate;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admins (extends Supabase auth.users — created via the Supabase dashboard
-- or supabase.auth.admin.createUser; this table just adds a display name
-- and role so the dashboard can show "who's logged in").
-- ---------------------------------------------------------------------------
create table if not exists admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'owner')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Seller submissions ("Sell Your Property" leads)
-- ---------------------------------------------------------------------------
create table if not exists seller_submissions (
  id uuid primary key default gen_random_uuid(),
  reference_number text not null unique default generate_reference_number(),
  created_at timestamptz not null default now(),

  -- Seller
  first_name text,
  last_name text,
  phone text,
  email text,
  preferred_contact text not null check (preferred_contact in ('Phone', 'Text', 'Email')),
  owner_status text not null check (owner_status in ('Yes', 'No')),
  owner_relationship text,

  -- Property
  property_address text not null,
  city text not null,
  state text not null,
  zip text not null,
  county text,
  property_type text not null,
  bedrooms integer,
  bathrooms numeric,
  square_feet integer,
  year_built integer,

  -- Condition
  condition text not null,
  roof_condition text,
  hvac_condition text,
  foundation_issue boolean default false,
  plumbing_issue boolean default false,
  electrical_issue boolean default false,
  water_damage boolean default false,
  fire_damage boolean default false,
  mold boolean default false,
  structural_issue boolean default false,
  additional_details text,

  -- Situation
  selling_reason text not null,
  timeline text not null,
  asking_price text,
  best_contact_time text,

  -- CRM
  status text not null default 'New' check (status in (
    'New', 'Contacted', 'Qualified', 'Offer Made', 'Under Contract',
    'Closed', 'Not a Fit', 'Follow Up'
  )),
  assigned_to uuid references admin_profiles(id),
  notes text
);

create index if not exists idx_seller_submissions_status on seller_submissions(status);
create index if not exists idx_seller_submissions_state on seller_submissions(state);
create index if not exists idx_seller_submissions_zip on seller_submissions(zip);
create index if not exists idx_seller_submissions_created_at on seller_submissions(created_at desc);

create table if not exists seller_property_photos (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references seller_submissions(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists seller_documents (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references seller_submissions(id) on delete cascade,
  storage_path text not null,
  document_type text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Properties (public listings managed from the admin dashboard)
-- ---------------------------------------------------------------------------
create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  created_at timestamptz not null default now(),
  title text not null,
  address_line text,
  city text not null,
  state text not null,
  zip text,
  price numeric not null,
  bedrooms integer,
  bathrooms numeric,
  square_feet integer,
  year_built integer,
  property_type text not null,
  strategy text not null,
  status text not null default 'Coming Soon' check (status in (
    'Available', 'Under Contract', 'Sold', 'Coming Soon'
  )),
  badge text,
  description text not null default '',
  highlights text[] default '{}',
  cover_image_url text
);

create index if not exists idx_properties_status on properties(status);
create index if not exists idx_properties_state on properties(state);

create table if not exists property_photos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Investor / buyer inquiries
-- ---------------------------------------------------------------------------
create table if not exists investor_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  property_id uuid references properties(id) on delete set null,
  property_title text,
  name text not null,
  phone text not null,
  email text not null,
  company text,
  investor_type text,
  message text not null,
  status text not null default 'New' check (status in (
    'New', 'Contacted', 'Interested', 'Under Review', 'Closed', 'Not Interested'
  ))
);

-- ---------------------------------------------------------------------------
-- Contact form messages
-- ---------------------------------------------------------------------------
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  interest text not null,
  message text not null,
  status text not null default 'New' check (status in ('New', 'Responded', 'Closed'))
);

-- ---------------------------------------------------------------------------
-- Site settings (single row, edited from /admin/settings)
-- ---------------------------------------------------------------------------
create table if not exists site_settings (
  id boolean primary key default true check (id),
  company_name text not null default 'Derax Properties',
  phone text,
  notification_email text not null default 'info@deraxproperties.com',
  facebook_url text,
  instagram_url text,
  linkedin_url text,
  youtube_url text,
  updated_at timestamptz not null default now()
);

insert into site_settings (id) values (true) on conflict (id) do nothing;
