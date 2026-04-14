-- ============================================================================
-- 001_initial_schema.sql
-- Full initial database schema for the Lighthouse Guest Portal
-- ============================================================================

-- Enable required extensions
create extension if not exists "pgcrypto";

-- ============================================================================
-- TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- properties (multi-tenant root)
-- ---------------------------------------------------------------------------
create table properties (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  slug               text not null unique,
  newbook_instance_url text,
  newbook_api_key    text,
  timezone           text not null default 'America/New_York',
  cancellation_policy jsonb default '{}'::jsonb,
  features_enabled   jsonb default '{}'::jsonb,
  contact_info       jsonb default '{}'::jsonb,
  smart_lock_provider text,
  smart_lock_config  jsonb default '{}'::jsonb,
  branding           jsonb default '{}'::jsonb,
  created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- guests
-- ---------------------------------------------------------------------------
create table guests (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid references auth.users on delete set null,
  newbook_guest_id text,
  email           text,
  first_name      text,
  last_name       text,
  phone           text,
  address         jsonb default '{}'::jsonb,
  preferences     jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- guest_properties (junction table)
-- ---------------------------------------------------------------------------
create table guest_properties (
  guest_id         uuid not null references guests on delete cascade,
  property_id      uuid not null references properties on delete cascade,
  newbook_guest_id text,
  primary key (guest_id, property_id)
);

-- ---------------------------------------------------------------------------
-- guest_vehicles
-- ---------------------------------------------------------------------------
create table guest_vehicles (
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

-- ---------------------------------------------------------------------------
-- guest_documents
-- ---------------------------------------------------------------------------
create table guest_documents (
  id            uuid primary key default gen_random_uuid(),
  guest_id      uuid not null references guests on delete cascade,
  property_id   uuid not null references properties on delete cascade,
  type          text,
  label         text,
  file_path     text,
  expires_at    timestamptz,
  uploaded_at   timestamptz not null default now(),
  verified_by   uuid references auth.users,
  verified_at   timestamptz
);

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------
create table bookings (
  id                uuid primary key default gen_random_uuid(),
  property_id       uuid not null references properties on delete cascade,
  guest_id          uuid not null references guests on delete cascade,
  newbook_booking_id text,
  status            text not null default 'confirmed',
  check_in          timestamptz,
  check_out         timestamptz,
  site_or_room      text,
  booking_type      text,
  group_booking_id  uuid,
  total_amount      numeric(10,2),
  balance_due       numeric(10,2),
  details           jsonb default '{}'::jsonb,
  synced_at         timestamptz,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- invoices
-- ---------------------------------------------------------------------------
create table invoices (
  id                  uuid primary key default gen_random_uuid(),
  booking_id          uuid not null references bookings on delete cascade,
  property_id         uuid not null references properties on delete cascade,
  guest_id            uuid not null references guests on delete cascade,
  newbook_invoice_id  text,
  amount              numeric(10,2),
  status              text not null default 'pending',
  due_date            date,
  paid_at             timestamptz,
  description         text,
  line_items          jsonb default '[]'::jsonb,
  synced_at           timestamptz
);

-- ---------------------------------------------------------------------------
-- payment_methods
-- ---------------------------------------------------------------------------
create table payment_methods (
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

-- ---------------------------------------------------------------------------
-- addon_requests
-- ---------------------------------------------------------------------------
create table addon_requests (
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

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table notifications (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references properties on delete cascade,
  target_type   text not null,
  target_id     uuid not null,
  title         text not null,
  body          text,
  channel       text not null default 'push',
  sent_at       timestamptz not null default now(),
  created_by    uuid references auth.users
);

-- ---------------------------------------------------------------------------
-- push_subscriptions
-- ---------------------------------------------------------------------------
create table push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  guest_id      uuid not null references guests on delete cascade,
  subscription  jsonb not null,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- property_content
-- ---------------------------------------------------------------------------
create table property_content (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references properties on delete cascade,
  type          text,
  title         text,
  body          text,
  media_url     text,
  schedule      jsonb default '{}'::jsonb,
  sort_order    int default 0,
  active        boolean default true,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- analytics_events
-- ---------------------------------------------------------------------------
create table analytics_events (
  id            uuid primary key default gen_random_uuid(),
  guest_id      uuid references guests on delete set null,
  property_id   uuid references properties on delete set null,
  event_type    text not null,
  event_data    jsonb default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- admin_properties (junction: admin user <-> property with role)
-- ---------------------------------------------------------------------------
create table admin_properties (
  admin_user_id uuid not null references auth.users on delete cascade,
  property_id   uuid not null references properties on delete cascade,
  role          text not null default 'manager',
  primary key (admin_user_id, property_id)
);


-- ============================================================================
-- INDEXES
-- ============================================================================

-- guests
create index idx_guests_auth_user_id   on guests (auth_user_id);
create index idx_guests_email          on guests (email);

-- guest_properties
create index idx_guest_properties_property on guest_properties (property_id);

-- guest_vehicles
create index idx_guest_vehicles_guest    on guest_vehicles (guest_id);
create index idx_guest_vehicles_property on guest_vehicles (property_id);

-- guest_documents
create index idx_guest_documents_guest    on guest_documents (guest_id);
create index idx_guest_documents_property on guest_documents (property_id);

-- bookings
create index idx_bookings_guest      on bookings (guest_id);
create index idx_bookings_property   on bookings (property_id);
create index idx_bookings_status     on bookings (status);
create index idx_bookings_newbook_id on bookings (newbook_booking_id);

-- invoices
create index idx_invoices_booking   on invoices (booking_id);
create index idx_invoices_guest     on invoices (guest_id);
create index idx_invoices_property  on invoices (property_id);
create index idx_invoices_status    on invoices (status);

-- payment_methods
create index idx_payment_methods_guest on payment_methods (guest_id);

-- addon_requests
create index idx_addon_requests_booking  on addon_requests (booking_id);
create index idx_addon_requests_guest    on addon_requests (guest_id);
create index idx_addon_requests_property on addon_requests (property_id);
create index idx_addon_requests_status   on addon_requests (status);

-- notifications
create index idx_notifications_property  on notifications (property_id);
create index idx_notifications_target    on notifications (target_type, target_id);

-- push_subscriptions
create index idx_push_subscriptions_guest on push_subscriptions (guest_id);

-- property_content
create index idx_property_content_property on property_content (property_id);

-- analytics_events
create index idx_analytics_events_guest    on analytics_events (guest_id);
create index idx_analytics_events_property on analytics_events (property_id);
create index idx_analytics_events_type     on analytics_events (event_type);

-- admin_properties
create index idx_admin_properties_property on admin_properties (property_id);


-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table properties        enable row level security;
alter table guests            enable row level security;
alter table guest_properties  enable row level security;
alter table guest_vehicles    enable row level security;
alter table guest_documents   enable row level security;
alter table bookings          enable row level security;
alter table invoices          enable row level security;
alter table payment_methods   enable row level security;
alter table addon_requests    enable row level security;
alter table notifications     enable row level security;
alter table push_subscriptions enable row level security;
alter table property_content  enable row level security;
alter table analytics_events  enable row level security;
alter table admin_properties  enable row level security;


-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helper: check if current user is an admin for a given property
-- ---------------------------------------------------------------------------
create or replace function is_admin_of_property(p_property_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from admin_properties
    where admin_user_id = auth.uid()
      and property_id = p_property_id
  );
$$;

-- Helper: get the guest row for the current auth user
create or replace function current_guest_id()
returns uuid
language sql
stable
security definer
as $$
  select id from guests where auth_user_id = auth.uid() limit 1;
$$;


-- ---------------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------------

-- Anyone authenticated can read properties (needed for tenant resolution)
create policy "properties_select_authenticated"
  on properties for select
  to authenticated
  using (true);

-- Admins can insert/update/delete their own properties
create policy "properties_admin_all"
  on properties for all
  to authenticated
  using (is_admin_of_property(id))
  with check (is_admin_of_property(id));

-- ---------------------------------------------------------------------------
-- guests
-- ---------------------------------------------------------------------------

-- Guests can read/update their own record
create policy "guests_own_select"
  on guests for select
  to authenticated
  using (auth_user_id = auth.uid());

create policy "guests_own_update"
  on guests for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- Admins can view guests linked to their properties
create policy "guests_admin_select"
  on guests for select
  to authenticated
  using (
    exists (
      select 1 from guest_properties gp
      join admin_properties ap on ap.property_id = gp.property_id
      where gp.guest_id = guests.id
        and ap.admin_user_id = auth.uid()
    )
  );

-- Admins can update guests linked to their properties
create policy "guests_admin_update"
  on guests for update
  to authenticated
  using (
    exists (
      select 1 from guest_properties gp
      join admin_properties ap on ap.property_id = gp.property_id
      where gp.guest_id = guests.id
        and ap.admin_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- guest_properties
-- ---------------------------------------------------------------------------

create policy "guest_properties_own_select"
  on guest_properties for select
  to authenticated
  using (guest_id = current_guest_id());

create policy "guest_properties_admin_select"
  on guest_properties for select
  to authenticated
  using (is_admin_of_property(property_id));

create policy "guest_properties_admin_all"
  on guest_properties for all
  to authenticated
  using (is_admin_of_property(property_id))
  with check (is_admin_of_property(property_id));

-- ---------------------------------------------------------------------------
-- guest_vehicles
-- ---------------------------------------------------------------------------

create policy "guest_vehicles_own_select"
  on guest_vehicles for select
  to authenticated
  using (guest_id = current_guest_id());

create policy "guest_vehicles_own_insert"
  on guest_vehicles for insert
  to authenticated
  with check (guest_id = current_guest_id());

create policy "guest_vehicles_own_update"
  on guest_vehicles for update
  to authenticated
  using (guest_id = current_guest_id())
  with check (guest_id = current_guest_id());

create policy "guest_vehicles_own_delete"
  on guest_vehicles for delete
  to authenticated
  using (guest_id = current_guest_id());

create policy "guest_vehicles_admin_all"
  on guest_vehicles for all
  to authenticated
  using (is_admin_of_property(property_id))
  with check (is_admin_of_property(property_id));

-- ---------------------------------------------------------------------------
-- guest_documents
-- ---------------------------------------------------------------------------

create policy "guest_documents_own_select"
  on guest_documents for select
  to authenticated
  using (guest_id = current_guest_id());

create policy "guest_documents_own_insert"
  on guest_documents for insert
  to authenticated
  with check (guest_id = current_guest_id());

create policy "guest_documents_admin_all"
  on guest_documents for all
  to authenticated
  using (is_admin_of_property(property_id))
  with check (is_admin_of_property(property_id));

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------

create policy "bookings_own_select"
  on bookings for select
  to authenticated
  using (guest_id = current_guest_id());

create policy "bookings_admin_all"
  on bookings for all
  to authenticated
  using (is_admin_of_property(property_id))
  with check (is_admin_of_property(property_id));

-- ---------------------------------------------------------------------------
-- invoices
-- ---------------------------------------------------------------------------

create policy "invoices_own_select"
  on invoices for select
  to authenticated
  using (guest_id = current_guest_id());

create policy "invoices_admin_all"
  on invoices for all
  to authenticated
  using (is_admin_of_property(property_id))
  with check (is_admin_of_property(property_id));

-- ---------------------------------------------------------------------------
-- payment_methods
-- ---------------------------------------------------------------------------

create policy "payment_methods_own_select"
  on payment_methods for select
  to authenticated
  using (guest_id = current_guest_id());

create policy "payment_methods_own_insert"
  on payment_methods for insert
  to authenticated
  with check (guest_id = current_guest_id());

create policy "payment_methods_own_update"
  on payment_methods for update
  to authenticated
  using (guest_id = current_guest_id())
  with check (guest_id = current_guest_id());

create policy "payment_methods_own_delete"
  on payment_methods for delete
  to authenticated
  using (guest_id = current_guest_id());

-- Admins can view payment methods for guests at their properties
create policy "payment_methods_admin_select"
  on payment_methods for select
  to authenticated
  using (
    exists (
      select 1 from guest_properties gp
      join admin_properties ap on ap.property_id = gp.property_id
      where gp.guest_id = payment_methods.guest_id
        and ap.admin_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- addon_requests
-- ---------------------------------------------------------------------------

create policy "addon_requests_own_select"
  on addon_requests for select
  to authenticated
  using (guest_id = current_guest_id());

create policy "addon_requests_own_insert"
  on addon_requests for insert
  to authenticated
  with check (guest_id = current_guest_id());

create policy "addon_requests_admin_all"
  on addon_requests for all
  to authenticated
  using (is_admin_of_property(property_id))
  with check (is_admin_of_property(property_id));

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

-- Guests can read notifications targeted at them
create policy "notifications_own_select"
  on notifications for select
  to authenticated
  using (
    target_type = 'guest' and target_id = current_guest_id()
  );

-- Admins can manage notifications for their properties
create policy "notifications_admin_all"
  on notifications for all
  to authenticated
  using (is_admin_of_property(property_id))
  with check (is_admin_of_property(property_id));

-- ---------------------------------------------------------------------------
-- push_subscriptions
-- ---------------------------------------------------------------------------

create policy "push_subscriptions_own_select"
  on push_subscriptions for select
  to authenticated
  using (guest_id = current_guest_id());

create policy "push_subscriptions_own_insert"
  on push_subscriptions for insert
  to authenticated
  with check (guest_id = current_guest_id());

create policy "push_subscriptions_own_delete"
  on push_subscriptions for delete
  to authenticated
  using (guest_id = current_guest_id());

-- ---------------------------------------------------------------------------
-- property_content
-- ---------------------------------------------------------------------------

-- All authenticated users can read active content for any property
create policy "property_content_select_authenticated"
  on property_content for select
  to authenticated
  using (active = true);

-- Admins can manage content for their properties
create policy "property_content_admin_all"
  on property_content for all
  to authenticated
  using (is_admin_of_property(property_id))
  with check (is_admin_of_property(property_id));

-- ---------------------------------------------------------------------------
-- analytics_events
-- ---------------------------------------------------------------------------

-- Guests can insert their own events
create policy "analytics_events_own_insert"
  on analytics_events for insert
  to authenticated
  with check (guest_id = current_guest_id());

-- Admins can view analytics for their properties
create policy "analytics_events_admin_select"
  on analytics_events for select
  to authenticated
  using (is_admin_of_property(property_id));

-- ---------------------------------------------------------------------------
-- admin_properties
-- ---------------------------------------------------------------------------

-- Admins can see their own admin_properties rows
create policy "admin_properties_own_select"
  on admin_properties for select
  to authenticated
  using (admin_user_id = auth.uid());

-- Admins with existing access can manage other admins on the same property
create policy "admin_properties_admin_all"
  on admin_properties for all
  to authenticated
  using (is_admin_of_property(property_id))
  with check (is_admin_of_property(property_id));
