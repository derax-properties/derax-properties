-- =============================================================================
-- 0010_document_signers.sql
--
-- Signing-order support for generated_documents. lib/esign.ts only ever
-- tracked ONE status per document (fine for a single signer), but a
-- Purchase Agreement usually needs the seller AND the buyer to sign, and
-- some workflows want the seller to sign first before the document even
-- goes to the buyer. This adds a one-row-per-signer table — matching the
-- rest of the schema's pattern (lead_comps, repair_items, buyer_zip_codes)
-- — rather than cramming multiple signers into generated_documents itself.
--
-- The "order" is enforced in the app layer (see deals/actions.ts), not by
-- a DB constraint: a signer can only be advanced past 'Not Sent' once every
-- signer with a lower sign_order is already 'Signed'. This stays consistent
-- with lib/esign.ts's ManualEsignProvider — there's no real e-sign vendor
-- wired up to enforce a sequence server-side, so this is the CRM's own
-- honest tracking of who's signed and who's next, not a claim that emails
-- are actually being routed in sequence by a third party.
-- =============================================================================

create table if not exists document_signers (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references generated_documents(id) on delete cascade,
  signer_name text not null,
  signer_role text,
  signer_email text,
  sign_order integer not null default 1,
  status text not null default 'Not Sent' check (status in ('Not Sent', 'Sent', 'Viewed', 'Signed', 'Declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_document_signers_document on document_signers(document_id);
create index if not exists idx_document_signers_order on document_signers(document_id, sign_order);

alter table document_signers enable row level security;

create policy "Owners/Admins can view signers" on document_signers
  for select using (has_full_crm_access());
create policy "Owners/Admins can add signers" on document_signers
  for insert with check (has_full_crm_access());
create policy "Owners/Admins can update signers" on document_signers
  for update using (has_full_crm_access());
create policy "Owners/Admins can delete signers" on document_signers
  for delete using (has_full_crm_access());
