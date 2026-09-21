-- =============================================================================
-- 0006_daily_digest.sql — Scheduled daily follow-up digest (plan section 6)
--
-- One row per calendar day the digest actually sent. This is the
-- idempotency guard: the cron endpoint checks for today's row before doing
-- anything, so a duplicate trigger (a retry, a manual re-run, Vercel firing
-- the job twice) can never double-send the digest email the same day.
-- =============================================================================

create table if not exists notification_log (
  id uuid primary key default gen_random_uuid(),
  notification_type text not null,
  sent_for_date date not null,
  lead_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (notification_type, sent_for_date)
);

alter table notification_log enable row level security;

-- Only ever written by the server-role cron endpoint (service role bypasses
-- RLS entirely), but keep an explicit owner/admin read policy so it's
-- visible from the CRM if a settings page ever wants to show "last sent".
create policy "Owners/Admins can read notification log" on notification_log
  for select
  using (
    exists (
      select 1 from admin_profiles
      where admin_profiles.id = auth.uid()
        and admin_profiles.role in ('owner', 'admin')
    )
  );
