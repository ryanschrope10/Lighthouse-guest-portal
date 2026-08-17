// ============================================================
// Guest reminder generation
// ============================================================
//
// Nothing in the portal used to create notifications, so the bell was always
// empty unless staff wrote something by hand. These reminders are DERIVED from
// current state — an invoice that is due or overdue, a document that is
// missing or about to expire — and written with a stable `dedupe_key` so
// re-running is a no-op (migration neon_011).
//
// Generation runs when the guest reads their notifications, which is the
// moment the reminder can actually be seen. There is no scheduler on this
// deployment and web push isn't implemented, so nothing is gained by
// generating earlier.
// ============================================================

import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { sql } from '@/lib/db';
import { getBookings } from '@/lib/newbook/data';
import type { CurrentGuest } from '@/lib/session';

interface Reminder {
  dedupeKey: string;
  title: string;
  body: string;
}

/** Documents expiring within this window get a heads-up. */
const EXPIRY_WARNING_DAYS = 30;

function money(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(n);
}

// Dates arrive in two shapes and both render wrong if treated alike:
//  - Newbook sends date-only strings ("2026-07-20"). parseISO reads those as
//    LOCAL midnight, so formatting locally gives the date Newbook holds.
//  - Postgres timestamptz comes back from the driver as a Date pinned to UTC
//    midnight, which formats as the PREVIOUS day anywhere west of UTC, so
//    those are formatted in UTC.
function shortDate(value: string | Date): string {
  if (value instanceof Date) {
    return value.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }
  return format(parseISO(value), 'MMM d, yyyy');
}

function asDate(value: string | Date): Date {
  return value instanceof Date ? value : parseISO(value);
}

/** Unpaid / part-paid / overdue invoices → one reminder each. */
async function invoiceReminders(): Promise<Reminder[]> {
  const bookings = await getBookings();
  const out: Reminder[] = [];

  for (const booking of bookings) {
    for (const inv of booking.invoices ?? []) {
      if (inv.status === 'paid') continue;

      const outstanding = Math.max(
        0,
        Number((inv.amount - (inv.amount_paid ?? 0)).toFixed(2))
      );
      if (outstanding <= 0.009) continue;

      const overdue = inv.status === 'overdue';
      const due = inv.due_date ? shortDate(inv.due_date) : null;
      const where = booking.site_or_room ? ` for ${booking.site_or_room}` : '';

      out.push({
        // Status is part of the key so a pending reminder is followed by a
        // separate one once the invoice actually goes overdue.
        dedupeKey: `invoice:${inv.newbook_invoice_id ?? inv.id}:${inv.status}`,
        title: overdue ? 'Payment overdue' : 'Payment due',
        body:
          `${money(outstanding)}${where} ` +
          (overdue
            ? `was due ${due ?? 'previously'}.`
            : due
              ? `is due ${due}.`
              : 'is outstanding.') +
          ' You can pay from the Payments tab.',
      });
    }
  }

  return out;
}

/** Documents the park still needs, or that are about to lapse. */
async function documentReminders(guest: CurrentGuest): Promise<Reminder[]> {
  const out: Reminder[] = [];

  const docs = (await sql`
    select id, type, label, expires_at
    from guest_documents
    where guest_id = ${guest.id}
  `) as Array<{
    id: string;
    type: string;
    label: string | null;
    // timestamptz — the driver hands this back as a Date.
    expires_at: string | Date | null;
  }>;

  for (const doc of docs) {
    if (!doc.expires_at) continue;
    const days = differenceInCalendarDays(asDate(doc.expires_at), new Date());
    if (days > EXPIRY_WARNING_DAYS) continue;

    const name = doc.label || doc.type.replace(/_/g, ' ');
    out.push({
      dedupeKey: `doc-expiring:${doc.id}:${asDate(doc.expires_at).toISOString()}`,
      title: days < 0 ? 'Document expired' : 'Document expiring soon',
      body:
        days < 0
          ? `Your ${name} expired on ${shortDate(doc.expires_at)}. Please upload a current copy from the Documents tab.`
          : `Your ${name} expires on ${shortDate(doc.expires_at)}. Please upload a current copy from the Documents tab.`,
    });
  }

  // Documents a booking requires at check-in that haven't been uploaded at all.
  const bookings = await getBookings();
  const uploadedTypes = new Set(docs.map((d) => d.type));
  for (const booking of bookings) {
    if (booking.status === 'checked_out' || booking.status === 'cancelled') {
      continue;
    }
    const required = booking.required_checkin_document_ids ?? [];
    if (required.length === 0) continue;
    // We only know a count, not which types, unless something is on file.
    if (uploadedTypes.size > 0) continue;

    out.push({
      dedupeKey: `doc-required:${booking.id}`,
      title: 'Documents needed before check-in',
      body:
        `Your stay${booking.site_or_room ? ` on ${booking.site_or_room}` : ''} ` +
        `requires ${required.length} document${required.length === 1 ? '' : 's'} ` +
        'on file. Upload them from the Documents tab so check-in goes smoothly.',
    });
  }

  return out;
}

/**
 * Make sure the guest's derived reminders exist. Safe to call on every read:
 * inserts are keyed and conflict-free, and a failure is swallowed so a
 * reminder problem can never block the notification list itself.
 */
export async function generateGuestReminders(
  guest: CurrentGuest
): Promise<void> {
  try {
    const reminders = [
      ...(await invoiceReminders()),
      ...(await documentReminders(guest)),
    ];
    if (reminders.length === 0) return;

    for (const r of reminders) {
      await sql`
        insert into notifications
          (property_id, target_type, target_id, title, body, channel, dedupe_key)
        values (
          ${guest.property_id}, 'guest', ${guest.id},
          ${r.title}, ${r.body}, 'push', ${r.dedupeKey}
        )
        on conflict (property_id, target_id, dedupe_key)
          where dedupe_key is not null
          do nothing
      `;
    }
  } catch (error) {
    console.warn(
      'Reminder generation skipped:',
      error instanceof Error ? error.message : error
    );
  }
}
