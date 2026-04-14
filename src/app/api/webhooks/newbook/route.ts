import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';

// No auth check on webhooks -- validated by signature instead

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Validate the webhook signature from NewBook.
 * TODO: Implement real HMAC signature verification using the webhook secret.
 */
function validateWebhookSignature(
  _payload: string,
  _signature: string | null
): boolean {
  // TODO: Replace with real HMAC-SHA256 validation
  // const secret = process.env.NEWBOOK_WEBHOOK_SECRET;
  // if (!secret || !signature) return false;
  // const hmac = crypto.createHmac('sha256', secret);
  // hmac.update(payload);
  // const expected = hmac.digest('hex');
  // return crypto.timingSafeEqual(
  //   Buffer.from(signature),
  //   Buffer.from(expected)
  // );
  return true; // Placeholder: accept all webhooks during development
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-newbook-signature');

    if (!validateWebhookSignature(rawBody, signature)) {
      console.warn('Webhook signature validation failed');
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid webhook signature' },
        { status: 403 }
      );
    }

    let payload: WebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    if (!payload.event) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Missing event type in payload' },
        { status: 400 }
      );
    }

    console.log(`[NewBook Webhook] Received event: ${payload.event}`, {
      timestamp: payload.timestamp,
      dataKeys: Object.keys(payload.data ?? {}),
    });

    // TODO: Route webhook events to appropriate handlers
    // Each handler should use a service-role Supabase client (not user-scoped)
    switch (payload.event) {
      case 'booking.created':
        // TODO: Create or update booking record in Supabase
        // - Upsert into bookings table using newbook_booking_id
        // - Link to guest via newbook_guest_id
        break;

      case 'booking.updated':
        // TODO: Update booking status, dates, amounts
        // - Find booking by newbook_booking_id
        // - Update fields and set synced_at
        break;

      case 'booking.cancelled':
        // TODO: Set booking status to 'cancelled'
        break;

      case 'invoice.created':
      case 'invoice.updated':
        // TODO: Upsert invoice record
        // - Link to booking via newbook_booking_id
        // - Parse line items from payload
        break;

      case 'payment.received':
        // TODO: Update invoice status to 'paid'
        // - Update booking balance_due
        // - Optionally send notification to guest
        break;

      case 'guest.updated':
        // TODO: Update guest profile data
        // - Sync name, phone, address from NewBook
        break;

      default:
        console.log(`[NewBook Webhook] Unhandled event type: ${payload.event}`);
    }

    // Always return 200 to acknowledge receipt (even for unhandled events)
    return NextResponse.json<ApiResponse<{ received: boolean }>>(
      { data: { received: true }, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/webhooks/newbook error:', error);
    // Return 500 so NewBook retries the webhook
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
