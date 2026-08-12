-- ============================================================================
-- neon_009_notification_reads.sql
-- Per-guest read receipts for notifications. Previously the guest portal had
-- no read-tracking at all, so /api/notifications reported every notification
-- as unread and "Mark all read" could not persist. One row per
-- (notification, guest); absence of a row means unread.
-- ============================================================================

create table if not exists notification_reads (
  notification_id uuid not null references notifications (id) on delete cascade,
  guest_id        uuid not null references guests (id) on delete cascade,
  read_at         timestamptz not null default now(),
  primary key (notification_id, guest_id)
);

create index if not exists notification_reads_guest_idx
  on notification_reads (guest_id);
