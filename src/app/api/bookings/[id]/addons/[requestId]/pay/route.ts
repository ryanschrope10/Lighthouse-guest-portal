import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireGuest } from '@/lib/session';
import { createPaymentIntent } from '@/lib/newbook/payments';
import type { ApiResponse } from '@/types';
import type { AddonRequestRow } from '@/types/addons';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const guest = await requireGuest();

    const { id: bookingId, requestId } = await params;

    // addon_requests.id is unique; guest ownership is the real authz check.
    // (booking_id stored here is the local Neon UUID, not the portal id in
    // the URL, so we don't filter by it.)
    const reqRows = (await sql`
      select * from addon_requests
      where id = ${requestId}
      limit 1
    `) as Array<AddonRequestRow>;
    if (reqRows.length === 0 || reqRows[0].guest_id !== guest.id) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Request not found' },
        { status: 404 }
      );
    }
    const req = reqRows[0];

    if (req.payment_status === 'paid') {
      return NextResponse.json<ApiResponse<AddonRequestRow>>(
        { data: req, error: null },
        { status: 200 }
      );
    }
    if (req.price_cents <= 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'No payment required' },
        { status: 400 }
      );
    }

    const intent = await createPaymentIntent({
      bookingId,
      amountCents: req.price_cents,
      description: `Add-on request ${req.id}`,
    });
    if (!intent.ok) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Payment failed' },
        { status: 502 }
      );
    }

    const newStatus = req.status === 'auto_approved' ? 'paid' : req.status;
    const nextDetails = {
      ...(req.details ?? {}),
      newbook_payment_token: intent.newbook_payment_token,
    };

    const updated = (await sql`
      update addon_requests set
        payment_status = 'paid',
        paid_at = now(),
        status = ${newStatus},
        details = ${JSON.stringify(nextDetails)}::jsonb
      where id = ${requestId}
      returning *
    `) as Array<AddonRequestRow>;

    return NextResponse.json<ApiResponse<AddonRequestRow>>(
      { data: updated[0], error: null },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status = msg === 'Unauthorized' ? 401 : msg.includes('Forbidden') ? 403 : 500;
    if (status === 500) console.error('POST .../addons/[requestId]/pay error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}
