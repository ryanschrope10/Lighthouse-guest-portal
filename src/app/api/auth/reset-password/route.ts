import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { resolveResetToken, markResetUsed } from '@/lib/password-reset';

// Deliberately identical for "no such token", "already used" and "expired",
// so a link can't be probed to learn which case it hit.
const INVALID =
  'This reset link is no longer valid. Ask the front desk for a new one.';

// POST /api/auth/reset-password  { token, password }
// Public: the token IS the authorisation. Single-use.
export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: INVALID }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const reset = await resolveResetToken(token);
    if (!reset) {
      return NextResponse.json({ error: INVALID }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await sql`
      update users set password_hash = ${passwordHash} where id = ${reset.user_id}
    `;
    await markResetUsed(reset.id);

    // Any other outstanding links for this account die with it.
    await sql`
      update password_resets set used_at = now()
      where user_id = ${reset.user_id} and used_at is null
    `;

    // No session is issued here on purpose: the guest signs in with the
    // password they just chose, which proves it works before they walk away.
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('POST /api/auth/reset-password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/auth/reset-password?token=... — is this link still usable?
// Lets the page show "expired" up front instead of after typing a password.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') ?? '';
  const reset = await resolveResetToken(token);
  return NextResponse.json({ valid: !!reset }, { status: 200 });
}
