-- =============================================================================
-- DERAX CRM — Phase 2: invitation-only VA/Admin registration
-- Additive only. Run after 0001_crm_foundation.sql.
-- =============================================================================

create extension if not exists "pgcrypto";

create table if not exists admin_invitations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  full_name text,
  role text not null check (role in ('owner', 'admin', 'va')),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid references admin_profiles(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  revoked_at timestamptz
);

create index if not exists idx_admin_invitations_email on admin_invitations(email);
create index if not exists idx_admin_invitations_token on admin_invitations(token);

-- A pending (not accepted, not revoked, not expired) invitation should be
-- unique per email so re-inviting someone replaces rather than duplicates.
create unique index if not exists idx_admin_invitations_pending_email
  on admin_invitations(email)
  where accepted_at is null and revoked_at is null;
