-- =============================================================================
-- DERAX CRM — RLS policies for the Phase 1 + Phase 2 tables.
-- Run after 0001_crm_foundation.sql and 0002_invitations.sql.
-- =============================================================================

-- Helper: is the current request an Owner or Admin (not a VA)? Used to gate
-- user management (inviting/removing teammates) — VAs can use the CRM but
-- never manage who else has access.
create or replace function is_owner_or_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from admin_profiles
    where id = auth.uid() and role in ('owner', 'admin')
  );
$$;

alter table cash_buyers enable row level security;
alter table buyer_zip_codes enable row level security;
alter table buyer_investment_criteria enable row level security;
alter table title_companies enable row level security;
alter table deals enable row level security;
alter table contract_templates enable row level security;
alter table generated_documents enable row level security;
alter table zip_population_cache enable row level security;
alter table activity_log enable row level security;
alter table admin_invitations enable row level security;

-- Everyone signed in to the CRM (owner/admin/va) can read and work the
-- pipeline-facing tables — this is one shared team tool, not siloed by role.
create policy "CRM users can view cash buyers" on cash_buyers for select using (is_admin());
create policy "CRM users can manage cash buyers" on cash_buyers for insert with check (is_admin());
create policy "CRM users can update cash buyers" on cash_buyers for update using (is_admin());
create policy "CRM users can delete cash buyers" on cash_buyers for delete using (is_admin());

create policy "CRM users can view buyer zips" on buyer_zip_codes for select using (is_admin());
create policy "CRM users can manage buyer zips" on buyer_zip_codes for insert with check (is_admin());
create policy "CRM users can delete buyer zips" on buyer_zip_codes for delete using (is_admin());

create policy "CRM users can view buyer criteria" on buyer_investment_criteria for select using (is_admin());
create policy "CRM users can manage buyer criteria" on buyer_investment_criteria for insert with check (is_admin());
create policy "CRM users can update buyer criteria" on buyer_investment_criteria for update using (is_admin());
create policy "CRM users can delete buyer criteria" on buyer_investment_criteria for delete using (is_admin());

create policy "CRM users can view title companies" on title_companies for select using (is_admin());
create policy "CRM users can manage title companies" on title_companies for insert with check (is_admin());
create policy "CRM users can update title companies" on title_companies for update using (is_admin());
create policy "CRM users can delete title companies" on title_companies for delete using (is_admin());

create policy "CRM users can view deals" on deals for select using (is_admin());
create policy "CRM users can manage deals" on deals for insert with check (is_admin());
create policy "CRM users can update deals" on deals for update using (is_admin());
create policy "CRM users can delete deals" on deals for delete using (is_admin());

create policy "CRM users can view contract templates" on contract_templates for select using (is_admin());
create policy "Owners/admins manage contract templates" on contract_templates for insert with check (is_owner_or_admin());
create policy "Owners/admins update contract templates" on contract_templates for update using (is_owner_or_admin());
create policy "Owners/admins delete contract templates" on contract_templates for delete using (is_owner_or_admin());

create policy "CRM users can view generated documents" on generated_documents for select using (is_admin());
create policy "CRM users can create generated documents" on generated_documents for insert with check (is_admin());
create policy "CRM users can update generated documents" on generated_documents for update using (is_admin());

-- Population data is reference data with no seller/buyer PII in it — any
-- signed-in CRM user can read and refresh it.
create policy "CRM users can view zip population cache" on zip_population_cache for select using (is_admin());
create policy "CRM users can upsert zip population cache" on zip_population_cache for insert with check (is_admin());
create policy "CRM users can update zip population cache" on zip_population_cache for update using (is_admin());

create policy "CRM users can view activity log" on activity_log for select using (is_admin());
create policy "CRM users can write activity log" on activity_log for insert with check (is_admin());

-- admin_profiles: the original policies.sql only added a SELECT policy.
-- Owners/Admins also need to deactivate/reactivate teammates (used by the
-- Users page) without dropping to the service-role key for that.
create policy "Owners/admins update admin profiles" on admin_profiles for update using (is_owner_or_admin());

-- Invitations: only Owners/Admins can see or create them (this is the
-- access-control surface itself, so VAs never get a say in who else joins).
create policy "Owners/admins view invitations" on admin_invitations for select using (is_owner_or_admin());
create policy "Owners/admins create invitations" on admin_invitations for insert with check (is_owner_or_admin());
create policy "Owners/admins update invitations" on admin_invitations for update using (is_owner_or_admin());
create policy "Owners/admins delete invitations" on admin_invitations for delete using (is_owner_or_admin());

-- A person accepting their own invitation needs to look it up by token
-- BEFORE they have a session — this happens through the service-role
-- client in a server action (see app/admin/accept-invite), never through
-- the anon key directly, so no public SELECT policy is added here.
