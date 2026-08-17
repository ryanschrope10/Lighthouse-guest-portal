// ============================================================
// Password reset tokens
// ============================================================
//
// Staff-issued, single-use, short-lived. The raw token exists only in the
// link handed to the guest; the database keeps a SHA-256 hash, so a leaked
// database backup can't be used to seize an account.
// ============================================================

import { createHash, randomBytes } from 'crypto';
import { sql } from '@/lib/db';

/** How long an issued link stays usable. */
export const RESET_TOKEN_TTL_MINUTES = 60;

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface IssuedReset {
  token: string;
  expiresAt: string;
}

/**
 * Issue a reset token for a user, invalidating any outstanding ones so only
 * the newest link works.
 */
export async function issueResetToken(
  userId: string,
  issuedBy: string | null
): Promise<IssuedReset> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(
    Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000
  ).toISOString();

  await sql`
    update password_resets set used_at = now()
    where user_id = ${userId} and used_at is null
  `;

  await sql`
    insert into password_resets (user_id, token_hash, expires_at, created_by)
    values (${userId}, ${hashToken(token)}, ${expiresAt}, ${issuedBy})
  `;

  return { token, expiresAt };
}

export interface ResolvedReset {
  id: string;
  user_id: string;
}

/**
 * Look up a usable token. Returns null when it doesn't exist, has already
 * been used, or has expired — the caller shows one generic message for all
 * three so a link can't be probed for which case it hit.
 */
export async function resolveResetToken(
  token: string
): Promise<ResolvedReset | null> {
  if (!token) return null;
  const rows = (await sql`
    select id, user_id
    from password_resets
    where token_hash = ${hashToken(token)}
      and used_at is null
      and expires_at > now()
    limit 1
  `) as Array<ResolvedReset>;
  return rows[0] ?? null;
}

export async function markResetUsed(id: string): Promise<void> {
  await sql`update password_resets set used_at = now() where id = ${id}`;
}
