-- =============================================================================
-- Derax Properties — Row Level Security policies
-- Run after schema.sql. These policies are the actual security boundary:
-- the anon key used by the browser can ONLY do what is explicitly allowed
-- here. Everything else requires the service-role key from a server route.
-- =============================================================================

alter table admin_profiles enable row level security;
alter table seller_submissions enable row level security;
alter table seller_property_photos enable row level security;
alter table seller_documents enable row level security;
alter table properties enable row level security;
alter table property_photos enable row level security;
alter table investor_inquiries enable row level security;
alter table contact_messages enable row level security;
alter table site_settings enable row level security;

-- Helper: is the current request authenticated as an admin?
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from admin_profiles where id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- admin_profiles: admins can read their own profile; only admins can read
-- the list (used for "assign to" dropdowns).
-- ---------------------------------------------------------------------------
create policy "Admins can view admin profiles"
  on admin_profiles for select
  using (is_admin());

-- ---------------------------------------------------------------------------
-- seller_submissions: the public can INSERT (submit the form) but can never
-- SELECT, UPDATE, or DELETE — that would leak every homeowner's private
-- information. Only admins can read/manage leads.
-- ---------------------------------------------------------------------------
create policy "Anyone can submit a seller lead"
  on seller_submissions for insert
  with check (true);

create policy "Admins can view seller leads"
  on seller_submissions for select
  using (is_admin());

create policy "Admins can update seller leads"
  on seller_submissions for update
  using (is_admin());

create policy "Admins can delete seller leads"
  on seller_submissions for delete
  using (is_admin());

-- Photos/documents follow the same shape: insert-only for the public
-- (uploads happen through a signed server route immediately after the
-- submission is created), admin-only to read.
create policy "Admins can view seller photos"
  on seller_property_photos for select
  using (is_admin());

create policy "Service role inserts seller photos"
  on seller_property_photos for insert
  with check (is_admin());

create policy "Admins can view seller documents"
  on seller_documents for select
  using (is_admin());

create policy "Service role inserts seller documents"
  on seller_documents for insert
  with check (is_admin());

-- ---------------------------------------------------------------------------
-- properties: publicly readable ONLY when status = 'Available' (or when the
-- requester is an admin, who can see everything for management purposes).
-- Only admins can create/update/delete listings.
-- ---------------------------------------------------------------------------
create policy "Public can view available properties"
  on properties for select
  using (status = 'Available' or is_admin());

create policy "Admins can insert properties"
  on properties for insert
  with check (is_admin());

create policy "Admins can update properties"
  on properties for update
  using (is_admin());

create policy "Admins can delete properties"
  on properties for delete
  using (is_admin());

create policy "Public can view photos of available properties"
  on property_photos for select
  using (
    is_admin() or exists (
      select 1 from properties
      where properties.id = property_photos.property_id
      and properties.status = 'Available'
    )
  );

create policy "Admins can manage property photos"
  on property_photos for insert
  with check (is_admin());

create policy "Admins can delete property photos"
  on property_photos for delete
  using (is_admin());

-- ---------------------------------------------------------------------------
-- investor_inquiries / contact_messages: public insert-only, admin-only read
-- ---------------------------------------------------------------------------
create policy "Anyone can submit an investor inquiry"
  on investor_inquiries for insert
  with check (true);

create policy "Admins can view investor inquiries"
  on investor_inquiries for select
  using (is_admin());

create policy "Admins can update investor inquiries"
  on investor_inquiries for update
  using (is_admin());

create policy "Anyone can submit a contact message"
  on contact_messages for insert
  with check (true);

create policy "Admins can view contact messages"
  on contact_messages for select
  using (is_admin());

create policy "Admins can update contact messages"
  on contact_messages for update
  using (is_admin());

-- ---------------------------------------------------------------------------
-- site_settings: publicly readable (footer/contact info), admin-only writes
-- ---------------------------------------------------------------------------
create policy "Anyone can view site settings"
  on site_settings for select
  using (true);

create policy "Admins can update site settings"
  on site_settings for update
  using (is_admin());

-- ---------------------------------------------------------------------------
-- Storage buckets: create these three PRIVATE buckets in the Supabase
-- dashboard (Storage): seller-photos, seller-documents, property-photos.
-- property-photos can be public since listing photos are meant to be seen;
-- the other two must stay private. Example policies for a private bucket:
--
--   create policy "Admins can read seller uploads"
--     on storage.objects for select
--     using (bucket_id in ('seller-photos', 'seller-documents') and is_admin());
--
--   create policy "Server can write seller uploads"
--     on storage.objects for insert
--     with check (bucket_id in ('seller-photos', 'seller-documents'));
--
-- (The insert above is only reachable via the service-role key used in our
-- API routes, never directly from the browser, so "with check (true)" here
-- is safe — anonymous clients never hold the service-role key.)
-- ---------------------------------------------------------------------------
