import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireGuest } from '@/lib/session';
import { ensureBookingSynced } from '@/lib/booking-sync';
import type { ApiResponse } from '@/types';
import type { AddonRequestRow } from '@/types/addons';

interface LateCheckoutBody {
  scheduled_for: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guest = await requireGuest();

    const { id: bookingId } = await params;
    const body: LateCheckoutBody = await request.json();

    if (!body.scheduled_for) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'scheduled_for is required' },
        { status: 400 }
      );
    }
    const scheduledAt = new Date(body.scheduled_for);
    if (isNaN(scheduledAt.getTime())) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid scheduled_for date' },
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

    const catalogRows = (await sql`
      select id, slug, name, price_cents, requires_approval, active
      from addon_catalog
      where property_id = ${booking.property_id} and slug = 'late_checkout'
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
        { data: null, error: 'Late checkout is not offered for this property' },
        { status: 400 }
      );
    }
    const catalog = catalogRows[0];

    // Back-to-back conflict: another booking starts same day on same site.
    let hasConflict = false;
    if (booking.site_or_room && booking.check_out) {
      const checkoutDayStart = new Date(booking.check_out);
      checkoutDayStart.setHours(0, 0, 0, 0);
      const checkoutDayEnd = new Date(checkoutDayStart);
      checkoutDayEnd.setDate(checkoutDayEnd.getDate() + 1);

      const conflicts = (await sql`
        select id from bookings
        where property_id = ${booking.property_id}
          and site_or_room = ${booking.site_or_room}
          and id <> ${booking.id}
          and check_in >= ${checkoutDayStart.toISOString()}
          and check_in < ${checkoutDayEnd.toISOString()}
          and status = any(${['confirmed', 'upcoming', 'checked_in']})
      `) as Array<{ id: string }>;
      hasConflict = conflicts.length > 0;
    }

    const status = hasConflict ? 'pending' : 'auto_approved';
    const priceCents = catalog.price_cents;

    const inserted = (await sql`
      insert into addon_requests (
        booking_id, guest_id, property_id, addon_catalog_id, addon_type,
        quantity, price_cents, status, payment_status, scheduled_for, details
      )
      values (
        ${booking.id}, ${guest.id}, ${booking.property_id}, ${catalog.id}, ${catalog.slug},
        1, ${priceCents}, ${status},
        ${priceCents === 0 ? 'waived' : 'unpaid'},
        ${scheduledAt.toISOString()},
        ${JSON.stringify({ has_conflict: hasConflict })}::jsonb
      )
      returning *
    `) as Array<AddonRequestRow>;

    // Staff notification stub.
    await sql`
      insert into notifications (property_id, target_type, target_id, title, body, channel)
      values (
        ${booking.property_id}, 'admin', ${booking.property_id},
        ${hasConflict
          ? 'Late checkout requested (conflict — needs review)'
          : 'Late checkout auto-approved'},
        ${`Site ${booking.site_or_room ?? 'n/a'} until ${scheduledAt.toISOString()}`},
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
    if (status === 500) console.error('POST /api/bookings/[id]/late-checkout error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}
