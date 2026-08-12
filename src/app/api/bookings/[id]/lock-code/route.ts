import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getBookingById, NoLinkedGuestError } from '@/lib/newbook/data';
import type { ApiResponse } from '@/types';
import type { LockCode, LockCodeRevealState } from '@/types/lock-codes';

export interface GuestLockCode extends LockCodeRevealState {
  /** The code itself — only present once the reveal gate passes. */
  code: string | null;
  notes: string | null;
}

// GET /api/bookings/[id]/lock-code
// The guest-facing read for a door code. getBookingById is scoped to the
// session guest, so a guest can only ever see their own booking's code — and
// the reveal_after gate is evaluated HERE rather than in the browser, so an
// unpaid guest can't read the code out of the API response.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = await getBookingById(id);
    if (!booking) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Booking not found' },
        { status: 404 }
      );
    }

    const rows = (await sql`
      select id, booking_id, property_id, code, source, reveal_after,
             issued_at, issued_by, revoked_at, notes
      from lock_codes
      where booking_id = ${booking.id} and revoked_at is null
      order by issued_at desc
      limit 1
    `) as Array<LockCode>;

    const active = rows[0] ?? null;
    const reasons: LockCodeRevealState['reasons'] = [];

    if (!active) {
      reasons.push('no_code');
      return NextResponse.json<ApiResponse<GuestLockCode>>(
        { data: { revealed: false, reasons, code: null, notes: null }, error: null },
        { status: 200 }
      );
    }

    const paid = booking.balance_due <= 0;
    const checkedIn = booking.status === 'checked_in';

    let revealed: boolean;
    if (active.reveal_after === 'always') {
      revealed = true;
    } else if (active.reveal_after === 'paid') {
      if (!paid) reasons.push('not_paid');
      revealed = paid;
    } else {
      if (!paid) reasons.push('not_paid');
      if (!checkedIn) reasons.push('not_checked_in');
      revealed = paid && checkedIn;
    }

    return NextResponse.json<ApiResponse<GuestLockCode>>(
      {
        data: {
          revealed,
          reasons,
          code: revealed ? active.code : null,
          notes: revealed ? active.notes : null,
        },
        error: null,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof NoLinkedGuestError) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Please sign in.' },
        { status: 401 }
      );
    }
    console.error('GET /api/bookings/[id]/lock-code error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
