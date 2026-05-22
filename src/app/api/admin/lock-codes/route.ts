import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireSession } from '@/lib/session';
import type { ApiResponse } from '@/types';
import type {
  CreateLockCodeInput,
  LockCode,
  LockCodeRevealAfter,
} from '@/types/lock-codes';

const REVEAL_OPTIONS: LockCodeRevealAfter[] = [
  'paid_and_checkin',
  'paid',
  'always',
];

export async function GET(request: Request) {
  try {
    // TODO: enforce admin role once admin login exists. Currently the booking
    // detail page hits this with booking_id to show the guest's own code, so
    // any logged-in session is allowed.
    await requireSession();

    const url = new URL(request.url);
    const propertyId = url.searchParams.get('property_id');
    const bookingId = url.searchParams.get('booking_id');
    const includeRevoked = url.searchParams.get('include_revoked') === 'true';

    let rows: Array<LockCode>;
    if (propertyId && bookingId) {
      rows = (includeRevoked
        ? await sql`
            select * from lock_codes
            where property_id = ${propertyId} and booking_id = ${bookingId}
            order by issued_at desc
          `
        : await sql`
            select * from lock_codes
            where property_id = ${propertyId} and booking_id = ${bookingId} and revoked_at is null
            order by issued_at desc
          `) as Array<LockCode>;
    } else if (propertyId) {
      rows = (includeRevoked
        ? await sql`
            select * from lock_codes
            where property_id = ${propertyId}
            order by issued_at desc
          `
        : await sql`
            select * from lock_codes
            where property_id = ${propertyId} and revoked_at is null
            order by issued_at desc
          `) as Array<LockCode>;
    } else if (bookingId) {
      rows = (includeRevoked
        ? await sql`
            select * from lock_codes
            where booking_id = ${bookingId}
            order by issued_at desc
          `
        : await sql`
            select * from lock_codes
            where booking_id = ${bookingId} and revoked_at is null
            order by issued_at desc
          `) as Array<LockCode>;
    } else {
      rows = (includeRevoked
        ? await sql`select * from lock_codes order by issued_at desc`
        : await sql`select * from lock_codes where revoked_at is null order by issued_at desc`) as Array<LockCode>;
    }

    return NextResponse.json<ApiResponse<LockCode[]>>(
      { data: rows, error: null },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status = msg === 'Unauthorized' ? 401 : msg.includes('Forbidden') ? 403 : 500;
    if (status === 500) console.error('GET /api/admin/lock-codes error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}

export async function POST(request: Request) {
  try {
    // TODO: enforce admin role once admin login exists
    await requireSession();

    const body: CreateLockCodeInput = await request.json();
    if (!body.booking_id || !body.property_id || !body.code) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: 'booking_id, property_id, and code are required',
        },
        { status: 400 }
      );
    }

    const reveal: LockCodeRevealAfter = REVEAL_OPTIONS.includes(
      body.reveal_after as LockCodeRevealAfter
    )
      ? (body.reveal_after as LockCodeRevealAfter)
      : 'paid_and_checkin';

    // Revoke any existing active code on this booking so there is at
    // most one live code per booking at a time.
    await sql`
      update lock_codes set revoked_at = now()
      where booking_id = ${body.booking_id} and revoked_at is null
    `;

    const inserted = (await sql`
      insert into lock_codes (
        booking_id, property_id, code, source, reveal_after, issued_by, notes
      )
      values (
        ${body.booking_id}, ${body.property_id}, ${body.code},
        ${body.source ?? 'manual'}, ${reveal}, ${null}, ${body.notes ?? null}
      )
      returning *
    `) as Array<LockCode>;

    return NextResponse.json<ApiResponse<LockCode>>(
      { data: inserted[0], error: null },
      { status: 201 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status = msg === 'Unauthorized' ? 401 : msg.includes('Forbidden') ? 403 : 500;
    if (status === 500) console.error('POST /api/admin/lock-codes error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}
