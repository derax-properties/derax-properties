-- =============================================================================
-- 0007_repair_items.sql — Itemized repair estimate (kitchen, roof, HVAC,
-- foundation, electrical, etc.), replacing the single "Repair Estimate ($)"
-- number with a per-category breakdown that sums to it.
--
-- One row per (lead, category) rather than one JSON blob or flattened
-- columns — consistent with the plan's "never combine fields" rule and with
-- how buyer_zip_codes/buyer_investment_criteria already store their own
-- one-row-per-item lists. `source` distinguishes a number the admin typed
-- from one a future AI estimate suggested, without needing a second table.
-- =============================================================================

create table if not exists repair_items (
  id uuid primary key default gen_random_uuid(),
  seller_submission_id uuid not null references seller_submissions(id) on delete cascade,
  category text not null,
  cost numeric not null default 0,
  source text not null default 'manual' check (source in ('manual', 'ai')),
  updated_at timestamptz not null default now(),
  unique (seller_submission_id, category)
);

alter table repair_items enable row level security;

create policy "Owners/Admins can view repair items" on repair_items
  for select using (has_full_crm_access());

create policy "Owners/Admins can manage repair items" on repair_items
  for insert with check (has_full_crm_access());

create policy "Owners/Admins can update repair items" on repair_items
  for update using (has_full_crm_access());

create policy "Owners/Admins can delete repair items" on repair_items
  for delete using (has_full_crm_access());
