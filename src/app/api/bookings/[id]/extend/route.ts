import { NextResponse } from 'next/server';
import { differenceInCalendarDays } from 'date-fns';
import { sql } from '@/lib/db';
import { requireGuest } from '@/lib/session';
import { ensureBookingSynced } from '@/lib/booking-sync';
import type { ApiResponse } from '@/types';
import type { AddonRequestRow } from '@/types/addons';

interface ExtendStayBody {
  new_check_out: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guest = await requireGuest();

    const { id: bookingId } = await params;
    const body: ExtendStayBody = await request.json();

    if (!body.new_check_out) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'new_check_out date is required' },
        { status: 400 }
      );
    }
    const newCheckOut = new Date(body.new_check_out);
    if (isNaN(newCheckOut.getTime())) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid new_check_out date' },
        { status: 400 }
      );
    }

    const booking = await ensureBookingSynced(bookingId, guest);
    if (!booking || booking.guest_id !== guest.id) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Booking not found' },
        { status: 404 }
      );
    }
    if (!booking.check_out) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Booking has no check-out date to extend' },
        { status: 400 }
      );
    }

    // The driver hands timestamptz back as a Date, not an ISO string, so
    // parseISO would throw ("dateString.split is not a function"). new Date
    // accepts either.
    const currentCheckOut = new Date(booking.check_out);
    if (newCheckOut <= currentCheckOut) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'new_check_out must be after current check-out' },
        { status: 400 }
      );
    }

    const catalogRows = (await sql`
      select id, slug, name, price_cents, requires_approval, active
      from addon_catalog
      where property_id = ${booking.property_id} and slug = 'stay_extension'
      limit 1
    `) as Array<{
      id: string;
      slug: string;
      name: string;
      price_cents: number;
      requires_approval: boolean;
      active: boolean;
    }>;
    if (catalogRows.length === 0 || !catalogRows[0].active) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Stay extension is not offered for this property' },
        { status: 400 }
      );
    }
    const catalog = catalogRows[0];

    // Conflict = another booking starts on or before requested new check-out on same site.
    let hasConflict = false;
    if (booking.site_or_room) {
      const conflicts = (await sql`
        select id, check_in from bookings
        where property_id = ${booking.property_id}
          and site_or_room = ${booking.site_or_room}
          and id <> ${booking.id}
          and check_in >= ${currentCheckOut.toISOString()}
          and check_in < ${newCheckOut.toISOString()}
          and status = any(${['confirmed', 'upcoming', 'checked_in']})
      `) as Array<{ id: string }>;
      hasConflict = conflicts.length > 0;
    }

    const extraNights = Math.max(
      1,
      differenceInCalendarDays(newCheckOut, currentCheckOut)
    );
    const priceCents = catalog.price_cents * extraNights;
    // Only auto-approve when the catalog says approval isn't needed. The
    // conflict check above only sees bookings synced into our own table, so it
    // can't prove the site is free — telling a guest "approved" on that basis
    // would commit the park to a date the desk hasn't confirmed.
    const status =
      hasConflict || catalog.requires_approval ? 'pending' : 'auto_approved';

    const details = {
      has_conflict: hasConflict,
      requires_room_move: hasConflict,
      original_check_out: booking.check_out,
      extra_nights: extraNights,
    };

    const inserted = (await sql`
      insert into addon_requests (
        booking_id, guest_id, property_id, addon_catalog_id, addon_type,
        quantity, price_cents, status, payment_status, scheduled_for, details
      )
      values (
        ${booking.id}, ${guest.id}, ${booking.property_id}, ${catalog.id}, ${catalog.slug},
        ${extraNights}, ${priceCents}, ${status},
        ${priceCents === 0 ? 'waived' : 'unpaid'},
        ${newCheckOut.toISOString()},
        ${JSON.stringify(details)}::jsonb
      )
      returning *
    `) as Array<AddonRequestRow>;

    await sql`
      insert into notifications (property_id, target_type, target_id, title, body, channel)
      values (
        ${booking.property_id}, 'admin', ${booking.property_id},
        ${hasConflict
          ? 'Stay extension requested (conflict — may need room move)'
          : 'Stay extension auto-approved'},
        ${`+${extraNights} night(s) on ${booking.site_or_room ?? 'n/a'} to ${newCheckOut.toISOString().slice(0, 10)}`},
        'push'
      )
    `;

    return NextResponse.json<ApiResponse<AddonRequestRow>>(
      { data: inserted[0], error: null },
      { status: 201 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status = msg === 'Unauthorized' ? 401 : msg.includes('Forbidden') ? 403 : 500;
    if (status === 500) console.error('POST /api/bookings/[id]/extend error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}
