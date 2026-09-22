-- =============================================================================
-- 0011_pre_qualified_and_equity.sql
--
-- Two owner-requested changes:
--
-- 1. Pipeline: "New Lead" renamed to "Pre-Qualified" (same first slot in the
--    pipeline — every new lead still lands here by default, nothing sets
--    pipeline_stage on insert). The one-click "Advance" button from this
--    stage now targets Qualified directly instead of Contacted (app-layer
--    change, see LeadsKanban.tsx / dashboard page.tsx) — Contacted stays a
--    real, selectable stage, just no longer the forced first step.
--
-- 2. Equity: mortgage_balance (payoff) and current_value (as-is value, not
--    ARV — ARV assumes repairs are done) let the owner enter what's owed vs.
--    what the property is worth today. Equity % is a plain calculation
--    ((current_value - mortgage_balance) / current_value), not something
--    that needs AI judgment, so it's derived on the fly (lib/equity.ts)
--    rather than stored here — it can never go stale after either number is
--    edited. Also expands lead_type with "Free and Clear" and "Distressed"
--    so the owner can classify a lead's situation at intake (Pre-Foreclosure
--    already existed in this list).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- pipeline_stage: rename New Lead -> Pre-Qualified
-- ---------------------------------------------------------------------------
update seller_submissions set pipeline_stage = 'Pre-Qualified' where pipeline_stage = 'New Lead';

alter table seller_submissions drop constraint if exists seller_submissions_pipeline_stage_check;
alter table seller_submissions add constraint seller_submissions_pipeline_stage_check
  check (pipeline_stage in (
    'Pre-Qualified', 'Contacted', 'Qualified', 'Offer Made', 'Negotiating',
    'Under Contract', 'Disposition', 'Closed', 'Dead / Lost'
  ));

-- ---------------------------------------------------------------------------
-- lead_type: add Free and Clear + Distressed to the existing situation list.
-- ---------------------------------------------------------------------------
alter table seller_submissions drop constraint if exists seller_submissions_lead_type_check;
alter table seller_submissions add constraint seller_submissions_lead_type_check
  check (lead_type in (
    'Free and Clear', 'Off-Market', 'On-Market', 'Trustee Sale', 'Probate', 'Pre-Foreclosure',
    'Distressed', 'Auction', 'Tax Delinquent', 'Vacant', 'Absentee Owner', 'Tired Landlord',
    'Divorce', 'Code Violation', 'FSBO', 'Inherited Property', 'Other'
  ));

-- ---------------------------------------------------------------------------
-- Equity inputs
-- ---------------------------------------------------------------------------
alter table seller_submissions add column if not exists mortgage_balance numeric;
alter table seller_submissions add column if not exists current_value numeric;
