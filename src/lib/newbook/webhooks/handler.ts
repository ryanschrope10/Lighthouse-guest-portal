// ============================================================
// NewBook Webhook Handler
// ============================================================
//
// Handles incoming webhook events from the NewBook PMS.
// Validates webhook signatures, parses the event payload,
// and routes to the appropriate processor function.
//
// This handler is designed to be called from a Next.js API route
// (e.g., /api/webhooks/newbook).
// ============================================================

import type { NewBookWebhookPayload, NewBookBooking, NewBookInvoice, NewBookGuest } from '../types';

// --- Supported Event Types ---

/**
 * All webhook event types we expect to receive from NewBook.
 * TODO: Confirm exact event type strings from NewBook webhook docs.
 */
export type NewBookWebhookEvent =
  | 'booking.created'
  | 'booking.updated'
  | 'booking.cancelled'
  | 'invoice.created'
  | 'invoice.updated'
  | 'guest.updated';

/** Result of processing a webhook event. */
export interface WebhookResult {
  success: boolean;
  event: string;
  message: string;
}

// --- Signature Validation ---

/**
 * Validate the HMAC signature of an incoming NewBook webhook.
 *
 * NewBook signs webhook payloads so we can verify they originated
 * from NewBook and haven't been tampered with.
 *
 * @param payload - The raw request body as a string
 * @param signature - The signature from the webhook headers
 * @param secret - The webhook signing secret for this property
 * @returns True if the signature is valid
 */
export async function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  // TODO: Implement actual HMAC signature validation
  // The exact algorithm depends on NewBook's webhook signing scheme.
  //
  // Common patterns:
  //   - HMAC-SHA256 of the raw body with a shared secret
  //   - Signature in header like "X-NewBook-Signature" or "X-Webhook-Signature"
  //
  // Example implementation using Web Crypto API (Edge-compatible):
  //
  //   const encoder = new TextEncoder();
  //   const key = await crypto.subtle.importKey(
  //     'raw',
  //     encoder.encode(secret),
  //     { name: 'HMAC', hash: 'SHA-256' },
  //     false,
  //     ['sign']
  //   );
  //   const signatureBuffer = await crypto.subtle.sign(
  //     'HMAC',
  //     key,
  //     encoder.encode(payload)
  //   );
  //   const computedSignature = Array.from(new Uint8Array(signatureBuffer))
  //     .map((b) => b.toString(16).padStart(2, '0'))
  //     .join('');
  //
  //   return computedSignature === signature;

  // TODO: Remove this placeholder — always returns true for development
  console.warn('Webhook signature validation is not yet implemented — accepting all payloads');
  void payload;
  void signature;
  void secret;
  return true;
}

// --- Event Processors ---

/**
 * Process a booking.created webhook event.
 *
 * Triggered when a new booking is made in NewBook. Creates or
 * updates the booking in our portal database and ensures the
 * guest record exists.
 *
 * @param data - The booking data from the webhook payload
 */
async function processBookingCreated(data: Record<string, unknown>): Promise<void> {
  const nbBooking = data as unknown as NewBookBooking;

  // TODO: Import and call sync functions
  // import { syncBookingsForGuest } from '../sync/bookings';
  // import { syncGuestFromNewBook } from '../sync/guests';
  //
  // 1. Ensure the guest exists in our database
  //    await syncGuestFromNewBook(String(nbBooking.guest_id), propertyId);
  //
  // 2. Create the booking in our database
  //    await syncBookingsForGuest(String(nbBooking.guest_id), propertyId);
  //
  // 3. Trigger any pre-arrival workflows (welcome email, etc.)

  console.log(`[Webhook] booking.created: booking_id=${nbBooking.booking_id}`);
}

/**
 * Process a booking.updated webhook event.
 *
 * Triggered when a booking is modified in NewBook (dates changed,
 * site reassigned, etc.). Updates the booking in our portal database.
 *
 * @param data - The booking data from the webhook payload
 */
async function processBookingUpdated(data: Record<string, unknown>): Promise<void> {
  const nbBooking = data as unknown as NewBookBooking;

  // TODO: Re-sync the specific booking
  // This should fetch the latest state from NewBook and update our DB.
  //
  // import { syncBookingsForGuest } from '../sync/bookings';
  // await syncBookingsForGuest(String(nbBooking.guest_id), propertyId);
  //
  // TODO: If dates changed, update any smart lock access schedules
  // TODO: Send notification to guest about the booking change

  console.log(`[Webhook] booking.updated: booking_id=${nbBooking.booking_id}`);
}

/**
 * Process a booking.cancelled webhook event.
 *
 * Triggered when a booking is cancelled in NewBook. Updates the
 * booking status in our portal database and handles cleanup.
 *
 * @param data - The booking data from the webhook payload
 */
async function processBookingCancelled(data: Record<string, unknown>): Promise<void> {
  const nbBooking = data as unknown as NewBookBooking;

  // TODO: Update booking status to 'cancelled' in our database
  //
  // Example:
  //   const supabase = await createClient();
  //   await supabase
  //     .from('bookings')
  //     .update({ status: 'cancelled', synced_at: new Date().toISOString() })
  //     .eq('newbook_booking_id', String(nbBooking.booking_id));
  //
  // TODO: Revoke any smart lock access for this booking
  // TODO: Send cancellation notification to guest
  // TODO: Handle any refund processing

  console.log(`[Webhook] booking.cancelled: booking_id=${nbBooking.booking_id}`);
}

/**
 * Process an invoice.created webhook event.
 *
 * Triggered when a new invoice is generated in NewBook. Creates
 * the invoice in our portal database.
 *
 * @param data - The invoice data from the webhook payload
 */
async function processInvoiceCreated(data: Record<string, unknown>): Promise<void> {
  const nbInvoice = data as unknown as NewBookInvoice;

  // TODO: Sync the invoice into our database
  //
  // import { syncInvoicesForBooking } from '../sync/invoices';
  // await syncInvoicesForBooking(portalBookingId, propertyId);
  //
  // TODO: Send notification to guest about new invoice
  // TODO: If auto-pay is enabled, trigger automatic payment

  console.log(`[Webhook] invoice.created: invoice_id=${nbInvoice.invoice_id}`);
}

/**
 * Process an invoice.updated webhook event.
 *
 * Triggered when an invoice is modified in NewBook (payment applied,
 * line items changed, etc.). Updates the invoice in our portal database.
 *
 * @param data - The invoice data from the webhook payload
 */
async function processInvoiceUpdated(data: Record<string, unknown>): Promise<void> {
  const nbInvoice = data as unknown as NewBookInvoice;

  // TODO: Re-sync the invoice to get latest state
  //
  // import { syncInvoicesForBooking } from '../sync/invoices';
  // await syncInvoicesForBooking(portalBookingId, propertyId);
  //
  // TODO: If invoice is now fully paid, send receipt notification
  // TODO: If balance changed, update the booking's balance_due

  console.log(`[Webhook] invoice.updated: invoice_id=${nbInvoice.invoice_id}`);
}

/**
 * Process a guest.updated webhook event.
 *
 * Triggered when a guest profile is modified in NewBook. Updates
 * the guest record in our portal database.
 *
 * @param data - The guest data from the webhook payload
 */
async function processGuestUpdated(data: Record<string, unknown>): Promise<void> {
  const nbGuest = data as unknown as NewBookGuest;

  // TODO: Re-sync the guest profile
  //
  // import { syncGuestFromNewBook } from '../sync/guests';
  // await syncGuestFromNewBook(String(nbGuest.guest_id), propertyId);

  console.log(`[Webhook] guest.updated: guest_id=${nbGuest.guest_id}`);
}

// --- Event Router ---

/** Map of event types to their processor functions. */
const eventProcessors: Record<NewBookWebhookEvent, (data: Record<string, unknown>) => Promise<void>> = {
  'booking.created': processBookingCreated,
  'booking.updated': processBookingUpdated,
  'booking.cancelled': processBookingCancelled,
  'invoice.created': processInvoiceCreated,
  'invoice.updated': processInvoiceUpdated,
  'guest.updated': processGuestUpdated,
};

/**
 * Main webhook handler — validates, parses, and routes NewBook webhook events.
 *
 * This is the entry point called from the Next.js API route. It:
 * 1. Validates the webhook signature
 * 2. Parses the event payload
 * 3. Routes to the appropriate processor based on event_type
 *
 * @param rawBody - The raw request body as a string (needed for signature validation)
 * @param signature - The signature header value from the request
 * @returns Result indicating success/failure of webhook processing
 *
 * @example
 * ```ts
 * // In a Next.js API route: /api/webhooks/newbook
 * export async function POST(request: Request) {
 *   const rawBody = await request.text();
 *   const signature = request.headers.get('X-NewBook-Signature') || '';
 *   const result = await handleNewBookWebhook(rawBody, signature);
 *   return Response.json(result, { status: result.success ? 200 : 400 });
 * }
 * ```
 */
export async function handleNewBookWebhook(
  rawBody: string,
  signature: string
): Promise<WebhookResult> {
  // TODO: Get the webhook signing secret from config
  // This might be per-property or a global secret
  const webhookSecret = process.env.NEWBOOK_WEBHOOK_SECRET || '';

  // Step 1: Validate signature
  const isValid = await validateWebhookSignature(rawBody, signature, webhookSecret);
  if (!isValid) {
    console.error('[Webhook] Invalid signature — rejecting webhook');
    return {
      success: false,
      event: 'unknown',
      message: 'Invalid webhook signature',
    };
  }

  // Step 2: Parse the payload
  let payload: NewBookWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as NewBookWebhookPayload;
  } catch {
    console.error('[Webhook] Failed to parse webhook payload');
    return {
      success: false,
      event: 'unknown',
      message: 'Invalid JSON payload',
    };
  }

  const eventType = payload.event_type as NewBookWebhookEvent;

  // Step 3: Route to the appropriate processor
  const processor = eventProcessors[eventType];
  if (!processor) {
    console.warn(`[Webhook] Unrecognized event type: ${payload.event_type}`);
    return {
      success: true, // Return success to avoid NewBook retrying unhandled events
      event: payload.event_type,
      message: `Event type "${payload.event_type}" is not handled`,
    };
  }

  try {
    await processor(payload.data);
    console.log(`[Webhook] Successfully processed ${eventType}`);
    return {
      success: true,
      event: eventType,
      message: `Successfully processed ${eventType}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Webhook] Error processing ${eventType}: ${errorMessage}`);

    // TODO: Add error reporting (Sentry, etc.)
    // TODO: Consider whether to return 500 (NewBook retries) or 200 (no retry)
    // based on whether the error is transient or permanent

    return {
      success: false,
      event: eventType,
      message: `Error processing ${eventType}: ${errorMessage}`,
    };
  }
}
