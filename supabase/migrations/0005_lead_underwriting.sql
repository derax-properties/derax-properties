-- =============================================================================
-- Lead-level underwriting snapshot. Per the plan doc's underwriting flow
-- (property info -> comps -> ARV -> repairs -> acquisition calculator ->
-- offer range), these numbers are meant to be entered at the LEAD stage,
-- before a deal necessarily exists — not only after "Create Deal". This is
-- purely additive: nullable columns, no existing data touched, no table
-- dropped or renamed.
-- =============================================================================

alter table seller_submissions add column if not exists arv_estimate numeric;
alter table seller_submissions add column if not exists repair_estimate numeric;
alter table seller_submissions add column if not exists mao_multiplier numeric not null default 0.7;
alter table seller_submissions add column if not exists recommended_offer numeric;
alter table seller_submissions add column if not exists comps_note text;
alter table seller_submissions add column if not exists underwriting_updated_at timestamptz;

-- No new RLS policy needed: these columns live on seller_submissions, and
-- the existing "Owners/Admins can update seller leads" / "VAs can update
-- their own intake leads" policies (migration 0004) already cover row-level
-- access for this table. VAs never reach the page that renders this panel
-- (middleware.ts keeps them on /agent-intake), so this stays admin/owner
-- territory in practice, consistent with how `notes` and `status` already
-- work today.
