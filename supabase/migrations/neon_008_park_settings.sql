-- Park-level settings the front desk controls but Newbook doesn't store.
-- One row per property. Currently holds guest Wi-Fi info shown on the
-- dashboard; add columns here as more admin-editable park info is needed.
create table if not exists park_settings (
  property_id  uuid primary key references properties(id) on delete cascade,
  wifi_network  text,
  wifi_password text,
  wifi_note     text,
  updated_at    timestamptz not null default now()
);
