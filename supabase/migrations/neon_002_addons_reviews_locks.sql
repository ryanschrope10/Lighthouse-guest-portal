-- ============================================================================
-- neon_002_addons_reviews_locks.sql
-- Adds: addon_catalog, reviews, lock_codes.
-- Extends: addon_requests (catalog link, pricing, payment tracking,
-- scheduling), property_content (event date/location fields), bookings
-- (signature status cache).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- addon_catalog (admin-defined catalog of paid/approval items)
-- ----------------------------------------------------------------------------
create table if not exists addon_catalog (
  id                uuid primary key default gen_random_uuid(),
  property_id       uuid not null references properties on delete cascade,
  slug              text not null,
  name              text not null,
  description       text,
  category          text not null default 'extra',
  price_cents       integer not null default 0,
  requires_approval boolean not null default true,
  active            boolean not null default true,
  sort_order        int default 0,
  details           jsonb default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  unique (property_id, slug)
);

-- ----------------------------------------------------------------------------
-- addon_requests extensions
-- ----------------------------------------------------------------------------
alter table addon_requests
  add column if not exists addon_catalog_id uuid references addon_catalog on delete set null,
  add column if not exists quantity         int not null default 1,
  add column if not exists price_cents      integer not null default 0,
  add column if not exists payment_status   text not null default 'unpaid',
  add column if not exists paid_at          timestamptz,
  add column if not exists scheduled_for    timestamptz,
  add column if not exists staff_notes      text,
  add column if not exists resolved_by      uuid;

create index if not exists idx_addon_requests_catalog on addon_requests (addon_catalog_id);
create index if not exists idx_addon_requests_payment on addon_requests (payment_status);

-- ----------------------------------------------------------------------------
-- reviews
-- ----------------------------------------------------------------------------
create table if not exists reviews (
  id                 uuid primary key default gen_random_uuid(),
  property_id        uuid not null references properties on delete cascade,
  guest_id           uuid not null references guests on delete cascade,
  booking_id         uuid references bookings on delete set null,
  rating             int not null check (rating between 1 and 5),
  feedback           text,
  is_public_intent   boolean not null default false,
  public_cta_url     text,
  public_cta_clicked boolean not null default false,
  staff_response     text,
  staff_responded_at timestamptz,
  staff_responded_by uuid,
  created_at         timestamptz not null default now()
);

create index if not exists idx_reviews_property on reviews (property_id);
create index if not exists idx_reviews_guest    on reviews (guest_id);
create index if not exists idx_reviews_booking  on reviews (booking_id);
create index if not exists idx_reviews_rating   on reviews (rating);

-- ----------------------------------------------------------------------------
-- lock_codes
-- ----------------------------------------------------------------------------
create table if not exists lock_codes (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references bookings on delete cascade,
  property_id  uuid not null references properties on delete cascade,
  code         text not null,
  source       text not null default 'manual',
  reveal_after text not null default 'paid_and_checkin',
  issued_at    timestamptz not null default now(),
  issued_by    uuid,
  revoked_at   timestamptz,
  notes        text
);

create index if not exists idx_lock_codes_booking  on lock_codes (booking_id);
create index if not exists idx_lock_codes_property on lock_codes (property_id);

-- ----------------------------------------------------------------------------
-- property_content extensions
-- ----------------------------------------------------------------------------
alter table property_content
  add column if not exists starts_at    timestamptz,
  add column if not exists ends_at      timestamptz,
  add column if not exists location     text,
  add column if not exists external_url text;

create index if not exists idx_property_content_type   on property_content (type);
create index if not exists idx_property_content_starts on property_content (starts_at);

-- ----------------------------------------------------------------------------
-- bookings: signature cache from Newbook
-- ----------------------------------------------------------------------------
alter table bookings
  add column if not exists signature_status        text,
  add column if not exists signature_signed_at     timestamptz,
  add column if not exists signature_document_url  text;
