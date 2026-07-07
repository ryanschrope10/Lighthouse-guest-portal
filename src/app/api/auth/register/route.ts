import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import { findNewbookGuestByEmail } from '@/lib/newbook/guests';

// Registration is GATED on Newbook: the email must belong to an existing
// Newbook guest (i.e. someone with a real booking). We store that guest's
// Newbook id on the account and carry it in the JWT as `newbook:<id>`, so
// every read is automatically scoped to this guest's own data.
export async function POST(request: Request) {
  try {
    const { email, password, first_name, last_name, phone } =
      await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // 1) Gate on Newbook: the email MUST belong to an existing guest.
    let nbGuest;
    try {
      nbGuest = await findNewbookGuestByEmail(normalizedEmail);
    } catch (err) {
      console.error('Newbook lookup failed during registration:', err);
      return NextResponse.json(
        {
          error:
            'We could not verify your reservation right now. Please try again shortly, or contact the front desk.',
        },
        { status: 502 }
      );
    }
    if (!nbGuest) {
      return NextResponse.json(
        {
          error:
            "We couldn't find a reservation under this email. Please use the email on your booking, or contact the front desk for help.",
        },
        { status: 403 }
      );
    }

    // 2) Reject duplicate accounts.
    const existing = await sql`
      SELECT id FROM users WHERE email = ${normalizedEmail}
    `;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in.' },
        { status: 409 }
      );
    }

    // 3) Create the account, linked to the matched Newbook guest.
    const passwordHash = await bcrypt.hash(password, 10);
    const newbookGuestId = String(nbGuest.guest_id);
    const rows = await sql`
      INSERT INTO users (email, password_hash, newbook_guest_id, first_name, last_name, phone)
      VALUES (${normalizedEmail}, ${passwordHash}, ${newbookGuestId},
              ${first_name || null}, ${last_name || null}, ${phone || null})
      RETURNING id, email, role
    `;
    const user = rows[0];

    // 4) Issue a session token carrying the Newbook identity.
    const token = signToken({
      userId: `newbook:${newbookGuestId}`,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      { success: true, user: { email: user.email, role: user.role } },
      { status: 201 }
    );
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
