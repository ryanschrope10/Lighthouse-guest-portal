-- ============================================================================
-- neon_005_lock_codes_portal_ids.sql
-- Lock codes are a simple per-booking side table whose identifiers come
-- straight from the portal/Newbook space (booking_id like 'nb-bk-<id>',
-- property by slug). They don't need the local bookings/properties rows the
-- transactional features rely on, so relax the UUID foreign keys to plain
-- text and let the admin UI/guest card operate in portal-id space directly.
-- ============================================================================

alter table lock_codes drop constraint if exists lock_codes_booking_id_fkey;
alter table lock_codes drop constraint if exists lock_codes_property_id_fkey;

alter table lock_codes alter column booking_id type text using booking_id::text;
alter table lock_codes alter column property_id type text using property_id::text;
