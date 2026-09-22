-- =============================================================================
-- 0013_optional_seller_contact_fields.sql
--
-- The owner wants a lead saveable from just the property address (e.g. a
-- seller who calls in with only the address and says they'll follow up with
-- their name/phone later — "we might come back tomorrow with more
-- details"). first_name/last_name/phone were previously NOT NULL, which
-- made that impossible. The only fields that must remain required for a
-- seller submission are the address ones: property_address, city, state,
-- zip. email was already nullable and is unaffected.
-- =============================================================================

alter table seller_submissions alter column first_name drop not null;
alter table seller_submissions alter column last_name drop not null;
alter table seller_submissions alter column phone drop not null;
