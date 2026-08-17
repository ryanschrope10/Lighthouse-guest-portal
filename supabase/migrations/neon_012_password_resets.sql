-- ============================================================================
-- neon_012_password_resets.sql
-- One-time password reset links, issued by staff.
--
-- There is no outbound email on this deployment, so a guest can't be sent a
-- reset link automatically. Instead an admin generates a single-use link from
-- the admin panel and gives it to the guest (read it out at the desk, text it,
-- whatever) — which is what /forgot-password has always told guests to expect.
--
-- Only a SHA-256 hash of the token is stored: anyone with database access
-- still cannot use a link to take over an account.
-- ============================================================================

create table if not exists password_resets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users (id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_by  text,
  created_at  timestamptz not null default now()
);

create index if not exists password_resets_user_idx on password_resets (user_id);
create index if not exists password_resets_expiry_idx on password_resets (expires_at);
