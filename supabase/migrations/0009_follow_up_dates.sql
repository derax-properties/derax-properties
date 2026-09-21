-- =============================================================================
-- 0009_follow_up_dates.sql
--
-- A real Next Follow-Up Date field, replacing the "infer urgency from how
-- old the lead is" heuristic the dashboard used before this. Deliberately
-- a DATE, not a timestamp — the owner explicitly wants the system to
-- operate on the day, not a specific time. follow_up_completed_at marks a
-- follow-up done without clearing the date itself (so history isn't lost);
-- scheduling a new follow-up date is a separate, explicit action.
-- =============================================================================

alter table seller_submissions add column if not exists next_follow_up_date date;
alter table seller_submissions add column if not exists follow_up_type text;
alter table seller_submissions add column if not exists follow_up_notes text;
alter table seller_submissions add column if not exists follow_up_completed_at timestamptz;

alter table seller_submissions drop constraint if exists seller_submissions_follow_up_type_check;
alter table seller_submissions add constraint seller_submissions_follow_up_type_check
  check (follow_up_type is null or follow_up_type in (
    'Call', 'SMS', 'Email', 'Voicemail', 'Appointment', 'Offer Follow-Up', 'Contract Follow-Up', 'Other'
  ));

create index if not exists idx_seller_submissions_next_follow_up on seller_submissions(next_follow_up_date);
