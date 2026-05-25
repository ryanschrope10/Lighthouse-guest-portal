// ============================================================
// Booking sync (server-only)
// ============================================================
//
// Bookings live in Newbook, not in Neon. But the portal's
// transactional features (late checkout, stay extensions,
// add-ons, lock codes) write rows that reference a local
// `bookings` row by UUID. This module bridges the two: given the
// portal booking id the frontend holds (`nb-bk-<newbookId>`), it
// fetches the booking from Newbook and upserts it into Neon,
// returning the local row so callers get real UUIDs to FK against.
// ============================================================

import { sql } from '@/lib/db';
import { getBookingById } from '@/lib/newbook/data';
import { getCurrentGuest, type CurrentGuest } from '@/lib/session';

export interface SyncedBooking {
  id: string;
  property_id: string;
  guest_id: string;
  newbook_booking_id: string;
  check_in: string | null;
  check_out: string | null;
  site_or_room: string | null;
  status: string;
  balance_due: number;
}

const nullIfEmpty = (s: string | null | undefined): string | null =>
  s && s.length ? s : null;

/**
 * Ensure the given booking exists in Neon, mirrored from Newbook.
 * Accepts either the portal id (`nb-bk-<id>`) or a bare Newbook id.
 * Returns the local row (with UUIDs), or null if the booking isn't
 * found in Newbook for the current guest.
 */
export async function ensureBookingSynced(
  portalOrNewbookId: string,
  guestArg?: CurrentGuest,
): Promise<SyncedBooking | null> {
  const guest = guestArg ?? (await getCurrentGuest());
  if (!guest) return null;

  const portalId = portalOrNewbookId.startsWith('nb-bk-')
    ? portalOrNewbookId
    : `nb-bk-${portalOrNewbookId}`;

  const b = await getBookingById(portalId);
  if (!b) return null;

  const nbId = b.newbook_booking_id ?? String(portalId).replace('nb-bk-', '');
  const checkIn = nullIfEmpty(b.check_in);
  const checkOut = nullIfEmpty(b.check_out);
  const details = b.details ?? {};
  const sigStatus = (details.signature_status as string | undefined) ?? null;
  const sigSignedAt =
    (details.signature_signed_at as string | undefined) ?? null;
  const sigDocUrl =
    (details.signature_document_url as string | undefined) ?? null;
  const detailsJson = JSON.stringify(details);

  const existing = (await sql`
    select id from bookings where newbook_booking_id = ${nbId} limit 1
  `) as Array<{ id: string }>;

  if (existing.length > 0) {
    const updated = (await sql`
      update bookings set
        guest_id = ${guest.id},
        property_id = ${guest.property_id},
        status = ${b.status},
        check_in = ${checkIn},
        check_out = ${checkOut},
        site_or_room = ${b.site_or_room},
        booking_type = ${b.booking_type},
        total_amount = ${b.total_amount},
        balance_due = ${b.balance_due},
        signature_status = ${sigStatus},
        signature_signed_at = ${sigSignedAt},
        signature_document_url = ${sigDocUrl},
        details = ${detailsJson}::jsonb,
        synced_at = now()
      where id = ${existing[0].id}
      returning id, property_id, guest_id, newbook_booking_id,
        check_in, check_out, site_or_room, status, balance_due
    `) as Array<SyncedBooking>;
    return updated[0];
  }

  const inserted = (await sql`
    insert into bookings (
      property_id, guest_id, newbook_booking_id, status, check_in, check_out,
      site_or_room, booking_type, total_amount, balance_due,
      signature_status, signature_signed_at, signature_document_url,
      details, synced_at
    ) values (
      ${guest.property_id}, ${guest.id}, ${nbId}, ${b.status}, ${checkIn}, ${checkOut},
      ${b.site_or_room}, ${b.booking_type}, ${b.total_amount}, ${b.balance_due},
      ${sigStatus}, ${sigSignedAt}, ${sigDocUrl},
      ${detailsJson}::jsonb, now()
    )
    returning id, property_id, guest_id, newbook_booking_id,
      check_in, check_out, site_or_room, status, balance_due
  `) as Array<SyncedBooking>;
  return inserted[0];
}

/**
 * Resolve any booking identifier the frontend might pass into the
 * local Neon UUID. Portal ids (`nb-bk-...`) are synced from Newbook;
 * anything else is assumed to already be a local UUID and returned
 * unchanged.
 */
export async function resolveNeonBookingId(
  idOrPortalId: string,
  guestArg?: CurrentGuest,
): Promise<string | null> {
  if (idOrPortalId.startsWith('nb-bk-')) {
    const synced = await ensureBookingSynced(idOrPortalId, guestArg);
    return synced?.id ?? null;
  }
  return idOrPortalId;
}
