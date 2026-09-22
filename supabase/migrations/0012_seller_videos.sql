-- =============================================================================
-- 0012_seller_videos.sql
--
-- Lets the owner attach video to a lead, not just photos — same
-- one-row-per-file pattern as seller_property_photos, kept as its own
-- table rather than folded into seller_documents since videos render and
-- play differently than a PDF. Written to by the new lead detail page
-- media uploader (see leads/[id]/mediaActions.ts), which uploads directly
-- to Storage via a signed upload URL rather than through a server action's
-- request body — this table's insert only happens after that direct
-- upload has already succeeded.
-- =============================================================================

create table if not exists seller_property_videos (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references seller_submissions(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_seller_property_videos_submission on seller_property_videos(submission_id);

alter table seller_property_videos enable row level security;

-- Mirrors the seller_property_photos policies: admins can view, and an
-- authenticated admin (not just the service role) can insert directly —
-- this is what makes the confirm-after-upload step below work using the
-- admin's own session client rather than requiring service-role.
create policy "Admins can view seller videos"
  on seller_property_videos for select
  using (is_admin());

create policy "Admins can insert seller videos"
  on seller_property_videos for insert
  with check (is_admin());

create policy "Admins can delete seller videos"
  on seller_property_videos for delete
  using (is_admin());
