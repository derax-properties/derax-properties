-- =============================================================================
-- Phase 2 correction: VA accounts were being granted the same RLS access as
-- Owner/Admin (is_admin() only checked "has an admin_profiles row", not
-- role). The plan requires a VA to be limited to intake, qualification
-- notes, follow-ups, and contact preferences on the leads THEY create —
-- never full underwriting/deal/buyer data. This migration is additive only:
-- no column is dropped, no existing row is touched.
-- =============================================================================

-- Track who entered a lead (needed to scope a VA's own-lead visibility).
alter table seller_submissions add column if not exists created_by uuid references admin_profiles(id) on delete set null;
create index if not exists idx_seller_submissions_created_by on seller_submissions(created_by);

-- is_admin() now also excludes a deactivated account (any role) — a bug fix
-- alongside this one, since a deactivated user should lose all CRM access.
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from admin_profiles where id = auth.uid() and deactivated_at is null
  );
$$;

-- New helpers: role-aware access.
create or replace function has_full_crm_access()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from admin_profiles
    where id = auth.uid() and role in ('owner', 'admin') and deactivated_at is null
  );
$$;

create or replace function is_active_va()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from admin_profiles
    where id = auth.uid() and role = 'va' and deactivated_at is null
  );
$$;

-- ---------------------------------------------------------------------------
-- seller_submissions: replace the old is_admin()-gated policies with a split
-- between full CRM staff (see everything) and VAs (see/manage only the
-- leads they personally entered via /agent-intake).
-- ---------------------------------------------------------------------------
drop policy if exists "Admins can view seller leads" on seller_submissions;
drop policy if exists "Admins can update seller leads" on seller_submissions;
drop policy if exists "Admins can delete seller leads" on seller_submissions;

create policy "Owners/Admins can view seller leads" on seller_submissions
  for select using (has_full_crm_access());
create policy "VAs can view their own intake leads" on seller_submissions
  for select using (is_active_va() and created_by = auth.uid());

create policy "Owners/Admins can update seller leads" on seller_submissions
  for update using (has_full_crm_access());
create policy "VAs can update their own intake leads" on seller_submissions
  for update using (is_active_va() and created_by = auth.uid())
  with check (is_active_va() and created_by = auth.uid());

create policy "Owners/Admins can delete seller leads" on seller_submissions
  for delete using (has_full_crm_access());

-- VAs may create new leads through the intake form (the public/no-login
-- insert policy from policies.sql already covers anonymous submissions —
-- this is the separate, authenticated VA path).
create policy "VAs can insert intake leads" on seller_submissions
  for insert with check (is_active_va() and created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- Business-sensitive tables: Owner/Admin only. A VA never sees underwriting,
-- buyer, deal, contract, or title-company data.
-- ---------------------------------------------------------------------------
drop policy if exists "CRM users can view cash buyers" on cash_buyers;
drop policy if exists "CRM users can manage cash buyers" on cash_buyers;
drop policy if exists "CRM users can update cash buyers" on cash_buyers;
drop policy if exists "CRM users can delete cash buyers" on cash_buyers;
create policy "Owners/Admins view cash buyers" on cash_buyers for select using (has_full_crm_access());
create policy "Owners/Admins manage cash buyers" on cash_buyers for insert with check (has_full_crm_access());
create policy "Owners/Admins update cash buyers" on cash_buyers for update using (has_full_crm_access());
create policy "Owners/Admins delete cash buyers" on cash_buyers for delete using (has_full_crm_access());

drop policy if exists "CRM users can view buyer zips" on buyer_zip_codes;
drop policy if exists "CRM users can manage buyer zips" on buyer_zip_codes;
drop policy if exists "CRM users can delete buyer zips" on buyer_zip_codes;
create policy "Owners/Admins view buyer zips" on buyer_zip_codes for select using (has_full_crm_access());
create policy "Owners/Admins manage buyer zips" on buyer_zip_codes for insert with check (has_full_crm_access());
create policy "Owners/Admins delete buyer zips" on buyer_zip_codes for delete using (has_full_crm_access());

drop policy if exists "CRM users can view buyer criteria" on buyer_investment_criteria;
drop policy if exists "CRM users can manage buyer criteria" on buyer_investment_criteria;
drop policy if exists "CRM users can update buyer criteria" on buyer_investment_criteria;
drop policy if exists "CRM users can delete buyer criteria" on buyer_investment_criteria;
create policy "Owners/Admins view buyer criteria" on buyer_investment_criteria for select using (has_full_crm_access());
create policy "Owners/Admins manage buyer criteria" on buyer_investment_criteria for insert with check (has_full_crm_access());
create policy "Owners/Admins update buyer criteria" on buyer_investment_criteria for update using (has_full_crm_access());
create policy "Owners/Admins delete buyer criteria" on buyer_investment_criteria for delete using (has_full_crm_access());

drop policy if exists "CRM users can view title companies" on title_companies;
drop policy if exists "CRM users can manage title companies" on title_companies;
drop policy if exists "CRM users can update title companies" on title_companies;
drop policy if exists "CRM users can delete title companies" on title_companies;
create policy "Owners/Admins view title companies" on title_companies for select using (has_full_crm_access());
create policy "Owners/Admins manage title companies" on title_companies for insert with check (has_full_crm_access());
create policy "Owners/Admins update title companies" on title_companies for update using (has_full_crm_access());
create policy "Owners/Admins delete title companies" on title_companies for delete using (has_full_crm_access());

drop policy if exists "CRM users can view deals" on deals;
drop policy if exists "CRM users can manage deals" on deals;
drop policy if exists "CRM users can update deals" on deals;
drop policy if exists "CRM users can delete deals" on deals;
create policy "Owners/Admins view deals" on deals for select using (has_full_crm_access());
create policy "Owners/Admins manage deals" on deals for insert with check (has_full_crm_access());
create policy "Owners/Admins update deals" on deals for update using (has_full_crm_access());
create policy "Owners/Admins delete deals" on deals for delete using (has_full_crm_access());

drop policy if exists "CRM users can view generated documents" on generated_documents;
drop policy if exists "CRM users can create generated documents" on generated_documents;
drop policy if exists "CRM users can update generated documents" on generated_documents;
create policy "Owners/Admins view generated documents" on generated_documents for select using (has_full_crm_access());
create policy "Owners/Admins create generated documents" on generated_documents for insert with check (has_full_crm_access());
create policy "Owners/Admins update generated documents" on generated_documents for update using (has_full_crm_access());

-- Contract templates were already owner/admin-only (is_owner_or_admin) — no change needed.

-- activity_log: full CRM staff see everything; a VA sees/writes only entries
-- tied to leads they created (mirrors their seller_submissions visibility).
drop policy if exists "CRM users can view activity log" on activity_log;
drop policy if exists "CRM users can write activity log" on activity_log;
create policy "Owners/Admins view activity log" on activity_log for select using (has_full_crm_access());
create policy "VAs view activity on their own leads" on activity_log for select using (
  is_active_va() and exists (
    select 1 from seller_submissions s
    where s.id = activity_log.seller_submission_id and s.created_by = auth.uid()
  )
);
create policy "Owners/Admins write activity log" on activity_log for insert with check (has_full_crm_access());
create policy "VAs write activity on their own leads" on activity_log for insert with check (
  is_active_va() and exists (
    select 1 from seller_submissions s
    where s.id = activity_log.seller_submission_id and s.created_by = auth.uid()
  )
);

-- admin_profiles list (used for "assign to" dropdowns) — Owner/Admin only.
-- A VA can still read their own row via auth.uid(), which the original
-- "Admins can view admin profiles" policy already allowed since it matched
-- any admin_profiles row when is_admin() was true; narrow that to full
-- access, and add an explicit self-read policy so a VA keeps seeing their
-- own profile (needed by getCurrentAdminProfile()).
drop policy if exists "Admins can view admin profiles" on admin_profiles;
create policy "Owners/Admins view all admin profiles" on admin_profiles for select using (has_full_crm_access());
create policy "Any CRM user views their own profile" on admin_profiles for select using (id = auth.uid());
