-- ============================================================================
-- neon_001_initial.sql
-- Neon-compatible initial schema for the Lighthouse Guest Portal.
-- Differs from 001_initial_schema.sql: no references to auth.users, no RLS,
-- no auth.uid() helpers. Authorization is enforced in application code via
-- the JWT cookie (src/lib/auth.ts).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- properties (multi-tenant root)
-- ----------------------------------------------------------------------------
create table if not exists properties (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  slug                 text not null unique,
  newbook_instance_url text,
  newbook_api_key      text,
  timezone             text not null default 'America/New_York',
  cancellation_policy  jsonb default '{}'::jsonb,
  features_enabled     jsonb default '{}'::jsonb,
  contact_info         jsonb default '{}'::jsonb,
  smart_lock_provider  text,
  smart_lock_config    jsonb default '{}'::jsonb,
  branding             jsonb default '{}'::jsonb,
  created_at           timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- guests (mirrors Newbook guest with a local UUID)
-- ----------------------------------------------------------------------------
create table if not exists guests (
  id               uuid primary key default gen_random_uuid(),
  newbook_guest_id text,
  email            text,
  first_name       text,
  last_name        text,
  phone            text,
  address          jsonb default '{}'::jsonb,
  preferences      jsonb default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists guest_properties (
  guest_id         uuid not null references guests on delete cascade,
  property_id      uuid not null references properties on delete cascade,
  newbook_guest_id text,
  primary key (guest_id, property_id)
);

create table if not exists guest_vehicles (
  id            uuid primary key default gen_random_uuid(),
  guest_id      uuid not null references guests on delete cascade,
  property_id   uuid not null references properties on delete cascade,
  type          text,
  make          text,
  model         text,
  year          int,
  license_plate text,
  length_ft     numeric,
  details       jsonb default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create table if not exists guest_documents (
  id           uuid primary key default gen_random_uuid(),
  guest_id     uuid not null references guests on delete cascade,
  property_id  uuid not null references properties on delete cascade,
  type         text,
  label        text,
  file_path    text,
  expires_at   timestamptz,
  uploaded_at  timestamptz not null default now(),
  verified_by  uuid,
  verified_at  timestamptz
);

create table if not exists bookings (
  id                 uuid primary key default gen_random_uuid(),
  property_id        uuid not null references properties on delete cascade,
  guest_id           uuid not null references guests on delete cascade,
  newbook_booking_id text,
  status             text not null default 'confirmed',
  check_in           timestamptz,
  check_out          timestamptz,
  site_or_room       text,
  booking_type       text,
  group_booking_id   uuid,
  total_amount       numeric(10,2),
  balance_due        numeric(10,2),
  details            jsonb default '{}'::jsonb,
  synced_at          timestamptz,
  created_at         timestamptz not null default now()
);

create table if not exists invoices (
  id                 uuid primary key default gen_random_uuid(),
  booking_id         uuid not null references bookings on delete cascade,
  property_id        uuid not null references properties on delete cascade,
  guest_id           uuid not null references guests on delete cascade,
  newbook_invoice_id text,
  amount             numeric(10,2),
  status             text not null default 'pending',
  due_date           date,
  paid_at            timestamptz,
  description        text,
  line_items         jsonb default '[]'::jsonb,
  synced_at          timestamptz
);

create table if not exists payment_methods (
  id                    uuid primary key default gen_random_uuid(),
  guest_id              uuid not null references guests on delete cascade,
  type                  text,
  last_four             text,
  brand                 text,
  is_preferred          boolean default false,
  auto_pay_enabled      boolean default false,
  newbook_payment_token text,
  created_at            timestamptz not null default now()
);

create table if not exists addon_requests (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references bookings on delete cascade,
  guest_id      uuid not null references guests on delete cascade,
  property_id   uuid not null references properties on delete cascade,
  addon_type    text,
  status        text not null default 'pending',
  details       jsonb default '{}'::jsonb,
  requested_at  timestamptz not null default now(),
  resolved_at   timestamptz
);

create table if not exists notifications (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references properties on delete cascade,
  target_type   text not null,
  target_id     uuid not null,
  title         text not null,
  body          text,
  channel       text not null default 'push',
  sent_at       timestamptz not null default now(),
  created_by    uuid
);

create table if not exists push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  guest_id     uuid not null references guests on delete cascade,
  subscription jsonb not null,
  created_at   timestamptz not null default now()
);

create table if not exists property_content (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references properties on delete cascade,
  type         text,
  title        text,
  body         text,
  media_url    text,
  schedule     jsonb default '{}'::jsonb,
  sort_order   int default 0,
  active       boolean default true,
  created_at   timestamptz not null default now()
);

create table if not exists analytics_events (
  id          uuid primary key default gen_random_uuid(),
  guest_id    uuid references guests on delete set null,
  property_id uuid references properties on delete set null,
  event_type  text not null,
  event_data  jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists admin_users (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  role       text not null default 'manager',
  created_at timestamptz not null default now()
);

create table if not exists admin_properties (
  admin_user_id uuid not null references admin_users on delete cascade,
  property_id   uuid not null references properties on delete cascade,
  role          text not null default 'manager',
  primary key (admin_user_id, property_id)
);

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------
create index if not exists idx_guests_email                on guests (email);
create index if not exists idx_guest_properties_property   on guest_properties (property_id);
create index if not exists idx_guest_vehicles_guest        on guest_vehicles (guest_id);
create index if not exists idx_guest_vehicles_property     on guest_vehicles (property_id);
create index if not exists idx_guest_documents_guest       on guest_documents (guest_id);
create index if not exists idx_guest_documents_property    on guest_documents (property_id);
create index if not exists idx_bookings_guest              on bookings (guest_id);
create index if not exists idx_bookings_property           on bookings (property_id);
create index if not exists idx_bookings_status             on bookings (status);
create index if not exists idx_bookings_newbook_id         on bookings (newbook_booking_id);
create index if not exists idx_invoices_booking            on invoices (booking_id);
create index if not exists idx_invoices_guest              on invoices (guest_id);
create index if not exists idx_invoices_property           on invoices (property_id);
create index if not exists idx_invoices_status             on invoices (status);
create index if not exists idx_payment_methods_guest       on payment_methods (guest_id);
create index if not exists idx_addon_requests_booking      on addon_requests (booking_id);
create index if not exists idx_addon_requests_guest        on addon_requests (guest_id);
create index if not exists idx_addon_requests_property     on addon_requests (property_id);
create index if not exists idx_addon_requests_status       on addon_requests (status);
create index if not exists idx_notifications_property      on notifications (property_id);
create index if not exists idx_notifications_target        on notifications (target_type, target_id);
create index if not exists idx_push_subscriptions_guest    on push_subscriptions (guest_id);
create index if not exists idx_property_content_property   on property_content (property_id);
create index if not exists idx_analytics_events_guest      on analytics_events (guest_id);
create index if not exists idx_analytics_events_property   on analytics_events (property_id);
create index if not exists idx_analytics_events_type       on analytics_events (event_type);
create index if not exists idx_admin_properties_property   on admin_properties (property_id);
