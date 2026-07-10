import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { sql } from '@/lib/db';
import type { ApiResponse } from '@/types';

// No auth check on webhooks -- validated by HMAC signature instead.
// Persistence uses Neon (`sql` from '@/lib/db'), NOT Supabase.

// Newbook has not confirmed the exact payload shape, so treat every field
// as optional and defend against missing/renamed keys.
interface WebhookPayload {
  event?: string;
  event_type?: string;
  type?: string;
  name?: string;
  timestamp?: string;
  data?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Validate the webhook signature from Newbook using HMAC-SHA256.
 *
 * Graceful rollout: if NEWBOOK_WEBHOOK_SECRET is unset we ACCEPT the webhook
 * (dev / not-yet-registered mode) and only log a warning, because Newbook
 * support has not provisioned the endpoint/secret yet. Once the secret is set
 * it is enforced with a constant-time comparison.
 */
function validateWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  const secret = process.env.NEWBOOK_WEBHOOK_SECRET;

  if (!secret) {
    console.warn(
      '[NewBook Webhook] NEWBOOK_WEBHOOK_SECRET is not set — accepting webhook without signature verification (rollout mode).'
    );
    return true;
  }

  if (!signature) {
    console.warn('[NewBook Webhook] Missing signature header; rejecting.');
    return false;
  }

  // Newbook may send the digest bare or prefixed (e.g. "sha256=<hex>").
  const provided = signature.includes('=')
    ? signature.slice(signature.indexOf('=') + 1).trim()
    : signature.trim();

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex');

  try {
    const providedBuf = Buffer.from(provided, 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    // timingSafeEqual throws on length mismatch — guard first so a bad/empty
    // signature can never leak timing info.
    if (providedBuf.length !== expectedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(providedBuf, expectedBuf);
  } catch {
    return false;
  }
}

/** Pull the first non-empty string value from a set of candidate keys. */
function pickString(
  source: Record<string, unknown> | undefined,
  keys: string[]
): string | null {
  if (!source) return null;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return null;
}

interface ResolvedTarget {
  guestId: string;
  propertyId: string;
}

/**
 * Resolve a Newbook webhook payload to an internal guest + property so a
 * notification can be addressed. We only have Newbook ids on the wire, so we
 * map them through existing tables:
 *   - booking id  -> bookings (guest_id, property_id)
 *   - invoice id  -> invoices (guest_id, property_id)
 *   - guest id    -> guests + that guest's most recent booking (for property)
 * Returns null when nothing resolves; the caller then logs and no-ops rather
 * than inventing rows.
 */
async function resolveTarget(
  data: Record<string, unknown> | undefined
): Promise<ResolvedTarget | null> {
  const bookingId = pickString(data, [
    'booking_id',
    'bookingId',
    'newbook_booking_id',
    'reservation_id',
    'reservationId',
  ]);
  if (bookingId) {
    const rows = (await sql`
      select guest_id, property_id
      from bookings
      where newbook_booking_id = ${bookingId}
      limit 1
    `) as Array<{ guest_id: string; property_id: string }>;
    if (rows[0]) {
      return { guestId: rows[0].guest_id, propertyId: rows[0].property_id };
    }
  }

  const invoiceId = pickString(data, [
    'invoice_id',
    'invoiceId',
    'newbook_invoice_id',
  ]);
  if (invoiceId) {
    const rows = (await sql`
      select guest_id, property_id
      from invoices
      where newbook_invoice_id = ${invoiceId}
      limit 1
    `) as Array<{ guest_id: string; property_id: string }>;
    if (rows[0]) {
      return { guestId: rows[0].guest_id, propertyId: rows[0].property_id };
    }
  }

  const guestId = pickString(data, [
    'guest_id',
    'guestId',
    'newbook_guest_id',
  ]);
  if (guestId) {
    // A guest carries no property_id of its own; borrow it from the guest's
    // most recent booking so the notification is scoped correctly.
    const rows = (await sql`
      select b.guest_id, b.property_id
      from guests g
      join bookings b on b.guest_id = g.id
      where g.newbook_guest_id = ${guestId}
      order by b.created_at desc
      limit 1
    `) as Array<{ guest_id: string; property_id: string }>;
    if (rows[0]) {
      return { guestId: rows[0].guest_id, propertyId: rows[0].property_id };
    }
  }

  return null;
}

/**
 * Insert a guest-addressed notification, skipping obvious duplicates from
 * Newbook retries (same target + title within a short window). There is no
 * unique constraint or read-tracking column on this table, so this recent-row
 * guard is the pragmatic idempotency mechanism.
 */
async function createGuestNotification(
  target: ResolvedTarget,
  title: string,
  body: string
): Promise<void> {
  const existing = (await sql`
    select id
    from notifications
    where property_id = ${target.propertyId}
      and target_type = 'guest'
      and target_id = ${target.guestId}
      and title = ${title}
      and sent_at > now() - interval '10 minutes'
    limit 1
  `) as Array<{ id: string }>;

  if (existing.length > 0) {
    console.log(
      `[NewBook Webhook] Skipping duplicate notification "${title}" for guest ${target.guestId}`
    );
    return;
  }

  await sql`
    insert into notifications (property_id, target_type, target_id, title, body, channel)
    values (
      ${target.propertyId}, 'guest', ${target.guestId}, ${title}, ${body}, 'push'
    )
  `;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature =
      request.headers.get('x-newbook-signature') ??
      request.headers.get('x-webhook-signature') ??
      request.headers.get('x-signature');

    if (!validateWebhookSignature(rawBody, signature)) {
      console.warn('[NewBook Webhook] Signature validation failed');
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

    // Newbook's exact envelope is unconfirmed — accept several event/data keys.
    const event =
      payload.event ?? payload.event_type ?? payload.type ?? payload.name;
    const data =
      (payload.data as Record<string, unknown> | undefined) ??
      (payload.payload as Record<string, unknown> | undefined) ??
      undefined;

    if (!event || typeof event !== 'string') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Missing event type in payload' },
        { status: 400 }
      );
    }

    console.log(`[NewBook Webhook] Received event: ${event}`, {
      timestamp: payload.timestamp,
      dataKeys: Object.keys(data ?? {}),
    });

    // Normalise for prefix matching (e.g. "payment.received", "payment_success").
    const eventKey = event.toLowerCase();

    // Every branch is wrapped so a handler failure can never turn into a 500
    // that makes Newbook retry a poison event forever. A resolution/DB miss is
    // logged and swallowed; the outer catch only fires on truly unexpected
    // errors (e.g. the JSON/signature path above already returned).
    try {
      if (eventKey.startsWith('payment')) {
        const target = await resolveTarget(data);
        if (target) {
          await createGuestNotification(
            target,
            'Payment received',
            'We received a payment on your reservation. Thank you!'
          );
        } else {
          console.log(
            `[NewBook Webhook] payment event could not be matched to a guest — no-op`
          );
        }
      } else if (
        eventKey.startsWith('booking') ||
        eventKey.startsWith('reservation')
      ) {
        if (eventKey.includes('cancel')) {
          const target = await resolveTarget(data);
          if (target) {
            await createGuestNotification(
              target,
              'Reservation cancelled',
              'Your reservation has been cancelled. Contact the front desk with any questions.'
            );
          } else {
            console.log(
              `[NewBook Webhook] booking-cancel event could not be matched to a guest — no-op`
            );
          }
        } else {
          const target = await resolveTarget(data);
          if (target) {
            await createGuestNotification(
              target,
              'Reservation updated',
              'Your reservation details were updated. Open the portal to review the latest information.'
            );
          } else {
            console.log(
              `[NewBook Webhook] booking event could not be matched to a guest — no-op`
            );
          }
        }
      } else if (eventKey.startsWith('invoice')) {
        const target = await resolveTarget(data);
        if (target) {
          await createGuestNotification(
            target,
            'Invoice updated',
            'A new charge or invoice is available on your reservation. Open the portal to view it.'
          );
        } else {
          console.log(
            `[NewBook Webhook] invoice event could not be matched to a guest — no-op`
          );
        }
      } else {
        // guest.updated and anything else: log and no-op. We intentionally do
        // not surface a guest-facing notification for these.
        console.log(`[NewBook Webhook] Unhandled event type: ${event}`);
      }
    } catch (handlerError) {
      // Swallow handler errors and still ack — retrying will not fix a bad
      // payload, and we don't want Newbook stuck redelivering it.
      console.error(
        `[NewBook Webhook] Handler error for event "${event}":`,
        handlerError
      );
    }

    // Always ack receipt with 200 (even for unhandled/failed-handler events).
    return NextResponse.json<ApiResponse<{ received: boolean }>>(
      { data: { received: true }, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/webhooks/newbook error:', error);
    // Return 500 so Newbook retries on genuinely unexpected failures.
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
