-- ============================================================================
-- neon_004_bookings_unique.sql
-- A booking is uniquely identified by its Newbook id. Enforce that so the
-- on-demand sync (src/lib/booking-sync.ts) is idempotent and can't create
-- duplicate rows for the same Newbook booking.
-- ============================================================================

create unique index if not exists uniq_bookings_newbook_id
  on bookings (newbook_booking_id)
  where newbook_booking_id is not null;
