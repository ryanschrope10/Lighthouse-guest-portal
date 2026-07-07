import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';

// Real per-guest login: verify the account's password, then issue a JWT
// carrying that user's Newbook identity (`newbook:<newbook_guest_id>`) so
// reads scope to their own bookings.
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const rows = await sql`
      SELECT id, email, password_hash, newbook_guest_id, role
      FROM users
      WHERE email = ${normalizedEmail}
      LIMIT 1
    `;
    const user = rows[0];

    // Same response whether the account is missing or the password is wrong.
    const ok = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;
    if (!user || !ok) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: `newbook:${user.newbook_guest_id}`,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: { email: user.email, role: user.role },
    });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
