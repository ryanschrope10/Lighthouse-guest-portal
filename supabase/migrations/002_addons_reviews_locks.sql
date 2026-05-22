-- ============================================================================
-- 002_addons_reviews_locks.sql
-- Adds: addon catalog (with payment/approval tracking), guest reviews &
-- feedback, lock codes (NextLock stub), and event scheduling fields.
-- Extends: addon_requests for unified late-checkout / extension / paid-addon
-- workflow.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- addon_catalog (admin-defined catalog of paid/approval items)
-- ---------------------------------------------------------------------------
-- Covers: late checkout, stay extension, propane tank, future paid items.
-- A row here is a "type of thing a guest can request"; addon_requests rows
-- are instances of guests requesting it.
create table addon_catalog (
  id                 uuid primary key default gen_random_uuid(),
  property_id        uuid not null references properties on delete cascade,
  slug               text not null,                      -- 'late_checkout' | 'stay_extension' | 'propane_tank' | ...
  name               text not null,                      -- "Late Checkout (until 2pm)"
  description        text,
  category           text not null default 'extra',      -- 'checkout' | 'stay' | 'extra' | 'service'
  price_cents        integer not null default 0,         -- 0 = free / quoted later
  requires_approval  boolean not null default true,      -- false = auto-approve when no conflict
  active             boolean not null default true,
  sort_order         int default 0,
  details            jsonb default '{}'::jsonb,          -- flex: fulfillment_sla_minutes, max_quantity, etc.
  created_at         timestamptz not null default now(),
  unique (property_id, slug)
);

-- ---------------------------------------------------------------------------
-- addon_requests extensions
-- ---------------------------------------------------------------------------
-- Adds catalog linkage + pricing + payment tracking + scheduling.
-- status values: 'pending' | 'auto_approved' | 'approved' | 'denied'
--              | 'paid' | 'fulfilled' | 'cancelled'
alter table addon_requests
  add column if not exists addon_catalog_id  uuid references addon_catalog on delete set null,
  add column if not exists quantity          int not null default 1,
  add column if not exists price_cents       integer not null default 0,
  add column if not exists payment_status    text not null default 'unpaid',  -- 'unpaid' | 'paid' | 'refunded' | 'waived'
  add column if not exists paid_at           timestamptz,
  add column if not exists scheduled_for     timestamptz,                     -- e.g., requested late checkout time, new check_out date
  add column if not exists staff_notes       text,
  add column if not exists resolved_by       uuid references auth.users;

create index if not exists idx_addon_requests_catalog on addon_requests (addon_catalog_id);
create index if not exists idx_addon_requests_payment on addon_requests (payment_status);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
-- Captures the rating + branching feedback. Smart routing handled in app:
-- rating >= 4 → guest gets prompted to leave a public review (CTA url),
-- rating <  4 → private feedback form to staff (visible_to_guest=false).
create table reviews (
  id                  uuid primary key default gen_random_uuid(),
  property_id         uuid not null references properties on delete cascade,
  guest_id            uuid not null references guests on delete cascade,
  booking_id          uuid references bookings on delete set null,
  rating              int not null check (rating between 1 and 5),
  feedback            text,
  is_public_intent    boolean not null default false,       -- guest indicated they'd post publicly
  public_cta_url      text,                                 -- where we sent them (Google, etc.)
  public_cta_clicked  boolean not null default false,
  staff_response      text,
  staff_responded_at  timestamptz,
  staff_responded_by  uuid references auth.users,
  created_at          timestamptz not null default now()
);

create index idx_reviews_property on reviews (property_id);
create index idx_reviews_guest    on reviews (guest_id);
create index idx_reviews_booking  on reviews (booking_id);
create index idx_reviews_rating   on reviews (rating);

-- ---------------------------------------------------------------------------
-- lock_codes (NextLock stub + manual staff entry path)
-- ---------------------------------------------------------------------------
create table lock_codes (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references bookings on delete cascade,
  property_id   uuid not null references properties on delete cascade,
  code          text not null,                             -- displayed to guest after gating conditions met
  source        text not null default 'manual',            -- 'manual' | 'nextlock'
  reveal_after  text not null default 'paid_and_checkin',  -- 'paid_and_checkin' | 'paid' | 'always'
  issued_at     timestamptz not null default now(),
  issued_by     uuid references auth.users,
  revoked_at    timestamptz,
  notes         text
);

create index idx_lock_codes_booking  on lock_codes (booking_id);
create index idx_lock_codes_property on lock_codes (property_id);

-- ---------------------------------------------------------------------------
-- property_content: ensure event/schedule fields are usable
-- ---------------------------------------------------------------------------
-- property_content already has: type, title, body, media_url, schedule, sort_order, active.
-- We'll use type='event' (single dated event) or type='schedule' (recurring series like
-- food truck weeks). Add explicit date columns for easier querying & sorting.
alter table property_content
  add column if not exists starts_at  timestamptz,
  add column if not exists ends_at    timestamptz,
  add column if not exists location   text,
  add column if not exists external_url text;

create index if not exists idx_property_content_type    on property_content (type);
create index if not exists idx_property_content_starts  on property_content (starts_at);

-- ---------------------------------------------------------------------------
-- bookings: cache for Newbook-side signature & lock metadata
-- ---------------------------------------------------------------------------
alter table bookings
  add column if not exists signature_status text,           -- 'not_required' | 'pending' | 'signed'
  add column if not exists signature_signed_at timestamptz,
  add column if not exists signature_document_url text;     -- link from Newbook to the signed doc

-- ============================================================================
-- RLS
-- ============================================================================

alter table addon_catalog enable row level security;
alter table reviews       enable row level security;
alter table lock_codes    enable row level security;

-- addon_catalog: all authed guests can see active catalog (so portal can render),
-- admins manage their property's catalog.
create policy "addon_catalog_select_authenticated"
  on addon_catalog for select
  to authenticated
  using (active = true);

create policy "addon_catalog_admin_all"
  on addon_catalog for all
  to authenticated
  using (is_admin_of_property(property_id))
  with check (is_admin_of_property(property_id));

-- reviews: guests can read & create their own; admins read/update for their property.
create policy "reviews_own_select"
  on reviews for select
  to authenticated
  using (guest_id = current_guest_id());

create policy "reviews_own_insert"
  on reviews for insert
  to authenticated
  with check (guest_id = current_guest_id());

create policy "reviews_own_update"
  on reviews for update
  to authenticated
  using (guest_id = current_guest_id())
  with check (guest_id = current_guest_id());

create policy "reviews_admin_all"
  on reviews for all
  to authenticated
  using (is_admin_of_property(property_id))
  with check (is_admin_of_property(property_id));

-- lock_codes: guest sees their own booking's codes (app enforces reveal gating);
-- admins manage all for their property.
create policy "lock_codes_own_select"
  on lock_codes for select
  to authenticated
  using (
    exists (
      select 1 from bookings b
      where b.id = lock_codes.booking_id
        and b.guest_id = current_guest_id()
    )
  );

create policy "lock_codes_admin_all"
  on lock_codes for all
  to authenticated
  using (is_admin_of_property(property_id))
  with check (is_admin_of_property(property_id));
