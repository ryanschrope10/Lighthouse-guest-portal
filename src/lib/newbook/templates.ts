// ============================================================
// Newbook contact-templates + in-house helpers (server-only)
// ============================================================
//
// Powers the staff "send a templated email to a guest" flow, where
// the email is sent BY Newbook (from the park's email, linked to the
// guest), not by us. This also lets us surface Newbook merge content
// (e.g. the "Pay Your Booking Online" link) to guests.
//
// Newbook actions used:
//   bookings_list { list_type:'inhouse' }   — current in-house guests
//   contact_templates_list                  — available templates
//   contact_templates_get                   — render a template for a booking
//   contact_templates_send                  — Newbook sends the email
//
// Param names/values below are CONFIRMED against the Newbook REST docs
// (developers.newbook.cloud/rest.php). Notably: contact_templates_get
// takes only `id` and returns the RAW template with unresolved merge
// tags ([guest:*], [booking:*]) — it does NOT render a booking-specific
// preview, so a resolved pay link can only be delivered by _send.
// ============================================================

import { createNewBookClient } from './client';
import type { PropertyKey } from './config';

/** Current in-house bookings (raw Newbook rows; shape mirrors bookings_list). */
export async function listInhouseBookings(
  property?: PropertyKey
): Promise<unknown[]> {
  const client = createNewBookClient(property);
  const data = await client.request<unknown[]>('bookings_list', {
    list_type: 'inhouse',
  });
  return Array.isArray(data) ? data : [];
}

/** All booking-bound contact templates (raw Newbook rows). */
export async function listContactTemplates(
  property?: PropertyKey
): Promise<unknown[]> {
  const client = createNewBookClient(property);
  const data = await client.request<unknown[]>('contact_templates_list', {});
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch a single template's definition. `contact_templates_get` takes
 * ONLY the template `id` and returns raw content with unresolved merge
 * tags — useful for a staff "which template is this" preview, not a
 * guest-specific render.
 */
export async function getContactTemplate(
  templateId: string,
  property?: PropertyKey
): Promise<unknown> {
  const client = createNewBookClient(property);
  return client.request<unknown>('contact_templates_get', { id: templateId });
}

export interface ContactTemplateContent {
  name: string | null;
  /** The template's body (HTML or text), merge tags unresolved. */
  body: string | null;
}

/**
 * Fetch a template and pull out its display name + body. Newbook's response
 * shape varies by account/version, so we probe the common field names rather
 * than assume one. Returns nulls if nothing usable is found.
 */
export async function getContactTemplateContent(
  templateId: string,
  property?: PropertyKey
): Promise<ContactTemplateContent> {
  const raw = await getContactTemplate(templateId, property);
  const obj = (Array.isArray(raw) ? raw[0] : raw) as
    | Record<string, unknown>
    | undefined;
  if (!obj || typeof obj !== 'object') return { name: null, body: null };

  const pick = (keys: string[]): string | null => {
    for (const k of keys) {
      const v = obj[k];
      if (typeof v === 'string' && v.trim().length) return v;
    }
    return null;
  };

  const body = pick([
    'contents',
    'content',
    'template_contents',
    'body',
    'html',
    'message',
    'template_content',
  ]);
  const name = pick(['name', 'template_name', 'subject', 'title']);
  return { name, body };
}

/** Newbook delivery channels for contact_templates_send. */
export type SendVia = 'html_email' | 'pdf_email' | 'sms';

export interface SendContactTemplateInput {
  templateId: string;
  /** Must be a valid object id for the template's bind (a Booking ID for 'bookings'). */
  dataId: string;
  /** Must match the template's bind. Booking emails = 'bookings'. */
  dataType?: string;
  /** Delivery channel. Defaults to 'html_email'. */
  sendVia?: SendVia;
}

/** Ask Newbook to SEND a templated email for a booking (real outbound). */
export async function sendContactTemplate(
  input: SendContactTemplateInput,
  property?: PropertyKey
): Promise<unknown> {
  const client = createNewBookClient(property);
  return client.request<unknown>('contact_templates_send', {
    template_id: input.templateId,
    data_type: input.dataType ?? 'bookings',
    data_id: input.dataId,
    send_via: input.sendVia ?? 'html_email',
  });
}
