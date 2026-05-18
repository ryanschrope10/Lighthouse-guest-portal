import { NextResponse } from 'next/server';
import { signToken, setAuthCookie } from '@/lib/auth';
import { getDemoGuestId } from '@/lib/newbook/config';

// Local/test auth: a single configured guest login that maps to the
// Newbook demo guest, so testers can walk the full guest experience
// without a user database. Replace with real per-guest auth + a
// portal-login <-> Newbook-guest mapping before production.
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'guest@holidaymotel.test';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'holiday123';

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
    const matches =
      normalizedEmail === TEST_EMAIL.toLowerCase() &&
      password === TEST_PASSWORD;

    if (!matches) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: `newbook:${getDemoGuestId()}`,
      email: normalizedEmail,
      role: 'guest',
    });

    const response = NextResponse.json({
      success: true,
      user: { email: normalizedEmail, role: 'guest' },
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
