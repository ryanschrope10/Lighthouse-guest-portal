import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireGuest } from '@/lib/session';
import { ensureBookingSynced } from '@/lib/booking-sync';
import type { ApiResponse } from '@/types';
import type { AddonRequestRow } from '@/types/addons';

interface CancelBookingRequest {
  reason?: string;
}

interface CancelBookingResponse {
  request_id: string;
  booking_id: string;
  status: 'pending';
  message: string;
}

// Guests do NOT cancel bookings directly in Newbook. A cancellation is a
// staff-approval REQUEST: we record a pending row (reusing the same
// addon_requests infra as guest add-ons, with addon_type='cancellation')
// and notify the front desk, who confirm the cancellation in Newbook.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guest = await requireGuest();

    const { id: bookingId } = await params;
    const body: CancelBookingRequest = await request.json().catch(() => ({}));

    // ensureBookingSynced calls getBookingById under the hood (guest-scoped:
    // returns null if the booking isn't the signed-in guest's) and gives us a
    // real local bookings UUID to FK the request against.
    const booking = await ensureBookingSynced(bookingId, guest);
    if (!booking || booking.guest_id !== guest.id) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Booking not found' },
        { status: 404 }
      );
    }

    const reason =
      typeof body.reason === 'string' && body.reason.trim().length
        ? body.reason.trim()
        : null;

    const inserted = (await sql`
      insert into addon_requests (
        booking_id, guest_id, property_id, addon_catalog_id, addon_type,
        quantity, price_cents, status, payment_status, details
      )
      values (
        ${booking.id}, ${guest.id}, ${booking.property_id}, null, 'cancellation',
        1, 0, 'pending', 'waived',
        ${JSON.stringify({
          request_type: 'cancellation',
          reason,
          site_or_room: booking.site_or_room,
          check_in: booking.check_in,
          check_out: booking.check_out,
        })}::jsonb
      )
      returning *
    `) as Array<AddonRequestRow>;

    await sql`
      insert into notifications (property_id, target_type, target_id, title, body, channel)
      values (
        ${booking.property_id}, 'admin', ${booking.property_id},
        'Cancellation requested',
        ${`Guest requested to cancel ${booking.site_or_room ?? 'their booking'}.${
          reason ? ` Reason: ${reason}` : ''
        }`},
        'push'
      )
    `;

    const response: CancelBookingResponse = {
      request_id: inserted[0].id,
      booking_id: bookingId,
      status: 'pending',
      message:
        'Cancellation requested — the front desk will confirm your cancellation shortly.',
    };

    return NextResponse.json<ApiResponse<CancelBookingResponse>>(
      { data: response, error: null },
      { status: 201 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status = msg === 'Unauthorized' ? 401 : msg.includes('Forbidden') ? 403 : 500;
    if (status === 500) console.error('POST /api/bookings/[id]/cancel error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}
