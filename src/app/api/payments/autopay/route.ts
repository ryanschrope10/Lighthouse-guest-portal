import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireGuest } from '@/lib/session';
import { ensureBookingSynced } from '@/lib/booking-sync';
import type { ApiResponse } from '@/types';
import type { AddonRequestRow } from '@/types/addons';

interface AutoPayRequestBody {
  booking_id?: string;
}

interface AutoPayResponse {
  request_id: string;
  status: 'pending';
  message: string;
}

// Guests can't flip AutoPay on themselves — it's a staff-approval REQUEST.
// We record a pending row (reusing addon_requests infra, addon_type=
// 'autopay_enrollment') and notify the front desk, who enable AutoPay for
// the guest in Newbook / flip guests.auto_pay_enabled on approval.
export async function POST(request: Request) {
  try {
    const guest = await requireGuest();
    const body: AutoPayRequestBody = await request.json().catch(() => ({}));

    // Already enrolled? Nothing to request.
    const guestRows = (await sql`
      select auto_pay_enabled from guests where id = ${guest.id} limit 1
    `) as Array<{ auto_pay_enabled: boolean }>;
    if (guestRows[0]?.auto_pay_enabled) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "You're already enrolled in AutoPay." },
        { status: 409 }
      );
    }

    // A booking is required to FK the request against (addon_requests infra).
    const bookingId =
      typeof body.booking_id === 'string' && body.booking_id.trim()
        ? body.booking_id.trim()
        : null;
    if (!bookingId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'A booking is required to enroll in AutoPay.' },
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

    // Don't stack duplicate pending requests.
    const existing = (await sql`
      select id from addon_requests
      where guest_id = ${guest.id}
        and addon_type = 'autopay_enrollment'
        and status = 'pending'
      limit 1
    `) as Array<{ id: string }>;
    if (existing[0]) {
      return NextResponse.json<ApiResponse<AutoPayResponse>>(
        {
          data: {
            request_id: existing[0].id,
            status: 'pending',
            message:
              'Your AutoPay request is already pending — the front desk will follow up shortly.',
          },
          error: null,
        },
        { status: 200 }
      );
    }

    const inserted = (await sql`
      insert into addon_requests (
        booking_id, guest_id, property_id, addon_catalog_id, addon_type,
        quantity, price_cents, status, payment_status, details
      )
      values (
        ${booking.id}, ${guest.id}, ${booking.property_id}, null,
        'autopay_enrollment', 1, 0, 'pending', 'waived',
        ${JSON.stringify({
          request_type: 'autopay_enrollment',
          site_or_room: booking.site_or_room,
        })}::jsonb
      )
      returning *
    `) as Array<AddonRequestRow>;

    await sql`
      insert into notifications (property_id, target_type, target_id, title, body, channel)
      values (
        ${booking.property_id}, 'admin', ${booking.property_id},
        'AutoPay enrollment requested',
        ${`Guest requested to enroll in AutoPay for ${
          booking.site_or_room ?? 'their booking'
        }.`},
        'push'
      )
    `;

    return NextResponse.json<ApiResponse<AutoPayResponse>>(
      {
        data: {
          request_id: inserted[0].id,
          status: 'pending',
          message:
            'AutoPay requested — the front desk will set it up and confirm with you shortly.',
        },
        error: null,
      },
      { status: 201 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status =
      msg === 'Unauthorized' ? 401 : msg.includes('Forbidden') ? 403 : 500;
    if (status === 500) console.error('POST /api/payments/autopay error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}
