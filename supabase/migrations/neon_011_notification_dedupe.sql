-- ============================================================================
-- neon_011_notification_dedupe.sql
-- Let notifications be generated idempotently.
--
-- Reminders (an invoice coming due, a document about to expire) are derived
-- from current state every time a guest loads the portal. Without a stable
-- key each load would insert a duplicate, so generated rows carry a
-- dedupe_key and re-generating is a no-op. Staff-written notifications leave
-- it null, and the partial unique index ignores those.
-- ============================================================================

alter table notifications add column if not exists dedupe_key text;

create unique index if not exists notifications_dedupe_key_idx
  on notifications (property_id, target_id, dedupe_key)
  where dedupe_key is not null;
