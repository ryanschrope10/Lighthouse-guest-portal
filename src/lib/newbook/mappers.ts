// ============================================================
// Newbook -> Portal mappers
// ============================================================
//
// Newbook is the source of truth; the portal has no DB-backed
// booking/guest tables yet, so we map Newbook records straight
// into the portal's display types. IDs are derived from Newbook
// IDs so a list item and its detail page resolve to the same
// record without any local persistence.
// ============================================================

import type {
  Guest,
  Booking,
  BookingStatus,
  Invoice,
  InvoiceStatus,
  InvoiceLineItem,
  Property,
} from '@/types/index';

import type { NewBookBooking, NewBookGuest } from './types';

// Stable, deterministic portal IDs from Newbook IDs.
export const bookingPortalId = (id: number | string) => `nb-bk-${id}`;
export const invoicePortalId = (id: number | string) => `nb-inv-${id}`;
export const guestPortalId = (id: number | string) => `nb-g-${id}`;

const num = (v: unknown): number => {
  const n = parseFloat(String(v ?? '0'));
  return Number.isFinite(n) ? n : 0;
};

/** Newbook dates are "YYYY-MM-DD HH:MM:SS" (property-local). Make them ISO-parseable. */
const toIso = (nbDate: string | null | undefined): string =>
  nbDate ? nbDate.replace(' ', 'T') : '';

/** The lead guest on a booking (primary_client === "1"), else the first. */
export function primaryGuest(b: NewBookBooking): NewBookGuest | undefined {
  const guests = b.guests ?? [];
  return guests.find((g) => String(g.primary_client) === '1') ?? guests[0];
}

function contact(g: NewBookGuest | undefined, type: string): string | null {
  const hit = g?.contact_details?.find(
    (c) => c.type?.toLowerCase() === type && c.content
  );
  return hit?.content ?? null;
}

export function mapGuest(
  g: NewBookGuest
): Omit<Guest, 'id' | 'auth_user_id' | 'created_at' | 'updated_at'> {
  return {
    newbook_guest_id: String(g.guest_id),
    email: contact(g, 'email') ?? '',
    first_name: g.firstname || null,
    last_name: g.lastname || null,
    phone: contact(g, 'mobile') ?? contact(g, 'phone'),
    address: {
      street: g.street || undefined,
      city: g.city || undefined,
      state: g.state_shortname || g.state_name || undefined,
      zip: g.postcode || undefined,
      country: g.country_code || undefined,
    },
    preferences: {},
  };
}

function mapBookingStatus(b: NewBookBooking): BookingStatus {
  if (b.booking_cancelled) return 'cancelled';
  if (b.booking_checkedout || b.booking_status === 'Departed')
    return 'checked_out';
  if (b.booking_checkedin || b.booking_status === 'Arrived')
    return 'checked_in';
  return 'upcoming';
}

function mapBookingType(b: NewBookBooking): Booking['booking_type'] {
  const hay = `${b.category_name ?? ''} ${b.site_name ?? ''}`.toLowerCase();
  if (/(cabin|cottage)/.test(hay)) return 'cabin';
  if (/(mobile|manufactured)/.test(hay)) return 'mobile_home';
  if (/(room|motel|queen|king|suite)/.test(hay)) return 'motel';
  if (/(site|rv|caravan|powered|pull|back-in)/.test(hay)) return 'rv';
  return 'other';
}

/**
 * Newbook has no portal-style "invoice" object; a booking's money is
 * spread across `tariffs_quoted` (nightly), `inventory_items` (fees)
 * and `discounts`. We fold those into a single invoice per booking so
 * the portal's invoice/balance UI has something real to render.
 */
function deriveInvoice(
  b: NewBookBooking,
  portalIds: { property_id: string; guest_id: string }
): Invoice {
  const lineItems: InvoiceLineItem[] = [];

  // Nightly tariffs, grouped by label.
  const byLabel = new Map<string, { qty: number; unit: number; total: number }>();
  for (const t of b.tariffs_quoted ?? []) {
    const amt = num(t.charge_amount);
    const g = byLabel.get(t.label) ?? { qty: 0, unit: amt, total: 0 };
    g.qty += 1;
    g.total += amt;
    byLabel.set(t.label, g);
  }
  for (const [label, g] of byLabel) {
    lineItems.push({
      description: `${label}${g.qty > 1 ? ` — ${g.qty} nights` : ''}`,
      quantity: g.qty,
      unit_price: g.unit,
      total: Number(g.total.toFixed(2)),
    });
  }

  // Fees / extras.
  for (const item of b.inventory_items ?? []) {
    lineItems.push({
      description: item.description || item.name,
      quantity: 1,
      unit_price: num(item.amount),
      total: num(item.amount),
    });
  }

  // Discounts (negative line).
  const discountTotal = num(b.discount_total);
  if (discountTotal > 0) {
    lineItems.push({
      description: 'Discount',
      quantity: 1,
      unit_price: -discountTotal,
      total: -discountTotal,
    });
  }

  const amount = num(b.booking_total);
  const balance = num(b.account_balance);
  const departed = !!b.booking_checkedout || b.booking_status === 'Departed';

  let status: InvoiceStatus;
  if (balance <= 0) status = 'paid';
  else if (new Date(toIso(b.booking_departure)) < new Date() && !departed)
    status = 'overdue';
  else if (balance < amount) status = 'partial';
  else status = 'pending';

  return {
    id: invoicePortalId(b.booking_id),
    booking_id: bookingPortalId(b.booking_id),
    property_id: portalIds.property_id,
    guest_id: portalIds.guest_id,
    newbook_invoice_id: String(b.booking_id),
    amount,
    status,
    due_date: toIso(b.booking_arrival) || null,
    paid_at: status === 'paid' ? toIso(b.booking_modified) || null : null,
    description:
      `${b.site_name ?? b.category_name ?? 'Stay'}` +
      ` — ${b.booking_arrival.slice(0, 10)} to ${b.booking_departure.slice(0, 10)}`,
    line_items: lineItems,
    synced_at: new Date().toISOString(),
  };
}

/** Map a Newbook booking to a fully-populated portal Booking. */
export function mapBooking(
  b: NewBookBooking,
  property: Property,
  opts: { guestId?: string } = {}
): Booking {
  const lead = primaryGuest(b);
  const guest_id =
    opts.guestId ?? guestPortalId(lead?.guest_id ?? 'unknown');
  const invoice = deriveInvoice(b, {
    property_id: property.id,
    guest_id,
  });

  return {
    id: bookingPortalId(b.booking_id),
    property_id: property.id,
    guest_id,
    newbook_booking_id: String(b.booking_id),
    status: mapBookingStatus(b),
    check_in: toIso(b.booking_arrival),
    check_out: toIso(b.booking_departure),
    site_or_room: b.site_name ?? b.category_name ?? null,
    booking_type: mapBookingType(b),
    group_booking_id: b.bookings_group_id
      ? String(b.bookings_group_id)
      : null,
    total_amount: num(b.booking_total),
    balance_due: num(b.account_balance),
    details: {
      adults: num(b.booking_adults),
      children: num(b.booking_children),
      infants: num(b.booking_infants),
      animals: num(b.booking_animals),
      category: b.category_name ?? undefined,
      newbook_status: b.booking_status,
      cancelled_reason: b.booking_cancelled_reason_name ?? undefined,
      equipment: lead?.equipment?.map((e) => ({
        name: e.equipment_name,
        make: e.equipment_make,
        model: e.equipment_model,
        length: e.equipment_length,
        unit: e.equipment_measurement_unit,
      })),
    },
    synced_at: new Date().toISOString(),
    created_at: toIso(b.booking_placed) || new Date().toISOString(),
    property,
    invoices: [invoice],
  };
}
