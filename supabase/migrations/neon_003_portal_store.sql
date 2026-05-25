-- ============================================================================
-- neon_003_portal_store.sql
-- Moves portal-store off ephemeral local-disk JSON into Neon Postgres.
-- Adds: signatures (Rules & Regs clickwrap), served_doc_acks (served-doc
-- acknowledgments). guest_id/booking_id are app identifier strings (e.g.
-- nb-g-...), so columns are text with no foreign keys.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- signatures (Rules & Regulations clickwrap signatures)
-- ----------------------------------------------------------------------------
create table if not exists signatures (
  id          uuid primary key default gen_random_uuid(),
  guest_id    text not null,
  booking_id  text not null,
  doc_id      text not null,
  doc_version text not null,
  full_name   text not null,
  signed_at   timestamptz not null default now(),
  ip          text,
  user_agent  text,
  unique (guest_id, booking_id, doc_version)
);

create index if not exists signatures_guest_id_idx on signatures (guest_id);
create index if not exists signatures_booking_id_idx on signatures (booking_id);

-- ----------------------------------------------------------------------------
-- served_doc_acks (proof a guest viewed/acknowledged a served document)
-- ----------------------------------------------------------------------------
create table if not exists served_doc_acks (
  id              uuid primary key default gen_random_uuid(),
  guest_id        text not null,
  served_doc_id   text not null,
  acknowledged_at timestamptz not null default now(),
  ip              text,
  user_agent      text,
  unique (guest_id, served_doc_id)
);

create index if not exists served_doc_acks_guest_id_idx on served_doc_acks (guest_id);
