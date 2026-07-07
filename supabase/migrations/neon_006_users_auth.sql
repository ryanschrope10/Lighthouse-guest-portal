-- ============================================================================
-- neon_006_users_auth.sql
-- Real portal user accounts. Signup is GATED on a Newbook guest match
-- (see src/app/api/auth/register), so newbook_guest_id is always populated.
-- Identity is carried into the JWT as `newbook:<newbook_guest_id>`
-- (src/lib/auth.ts + src/lib/session.ts), which is how every read scopes to
-- the logged-in guest's own Newbook data.
-- ============================================================================

-- Fresh databases: create the full table.
create table if not exists users (
  id               uuid primary key default gen_random_uuid(),
  email            text not null unique,
  password_hash    text not null,
  newbook_guest_id text not null,
  first_name       text,
  last_name        text,
  phone            text,
  role             text not null default 'guest',
  created_at       timestamptz not null default now()
);

-- Existing databases (a users table predates this migration without the
-- Newbook link): add the column if it's missing. Left nullable so the
-- ALTER succeeds on any legacy rows; registration always populates it.
alter table users add column if not exists newbook_guest_id text;

create index if not exists users_email_idx on users (lower(email));
create index if not exists users_newbook_guest_id_idx on users (newbook_guest_id);
