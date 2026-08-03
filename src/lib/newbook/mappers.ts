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
  InvoiceTax,
  Property,
  BookingEquipment,
  InsurancePolicy,
} from '@/types/index';
import type { SignatureInfo, SignatureStatus } from '@/types/signature';

import type {
  NewBookBooking,
  NewBookGuest,
  NewBookEquipment,
  NewBookInsurancePolicy,
} from './types';

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

function mapEquipment(e: NewBookEquipment): BookingEquipment {
  const ft = (v?: string) => {
    const n = num(v);
    return n > 0 ? n : null;
  };
  return {
    name: e.equipment_name || null,
    make: e.equipment_make || null,
    model: e.equipment_model || null,
    type: e.equipment_type_name || null,
    length_ft: ft(e.equipment_length),
    width_ft: ft(e.equipment_width),
    height_ft: ft(e.equipment_height),
    registration: e.equipment_registration || null,
    registration_expires: e.equipment_registration_expiry
      ? toIso(e.equipment_registration_expiry)
      : null,
    slideouts: e.slideouts && e.slideouts !== 'none' ? e.slideouts : null,
  };
}

function mapInsurance(p: NewBookInsurancePolicy): InsurancePolicy {
  const exp = p.expiry ?? p.expiry_date ?? null;
  return {
    provider: p.provider ?? p.insurer ?? null,
    policy_number: p.policy_number ?? null,
    type: p.type ?? null,
    expires_at: exp ? toIso(exp) : null,
  };
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
    equipment: (g.equipment ?? []).map(mapEquipment),
    insurance_policies: [
      ...(g.insurance_policies ?? []),
      ...(g.equipment ?? []).flatMap((e) => e.insurance_policies ?? []),
    ].map(mapInsurance),
    marketing_consent: (() => {
      const c = g.contact_details?.find(
        (x) => x.type?.toLowerCase() === 'email' && x.content
      );
      return c ? !!c.allow_marketing : undefined;
    })(),
    transactional_consent: (() => {
      const c = g.contact_details?.find(
        (x) => x.type?.toLowerCase() === 'email' && x.content
      );
      return c ? !!c.allow_transactional : undefined;
    })(),
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

  // Taxes across all tariff nights, grouped by tax name (booking_total is
  // already tax-inclusive; this is the itemized breakdown for display).
  const taxByName = new Map<string, { amount: number; inclusive: boolean }>();
  for (const t of b.tariffs_quoted ?? []) {
    for (const tx of t.taxes ?? []) {
      const key = tx.tax_name || 'Tax';
      const cur = taxByName.get(key) ?? {
        amount: 0,
        inclusive: !!tx.tax_inclusive,
      };
      cur.amount += num(tx.tax_amount);
      taxByName.set(key, cur);
    }
  }
  const taxes: InvoiceTax[] = [...taxByName]
    .map(([name, v]) => ({
      name,
      amount: Number(v.amount.toFixed(2)),
      inclusive: v.inclusive,
    }))
    .filter((t) => Math.abs(t.amount) > 0.001);

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
    taxes,
    synced_at: new Date().toISOString(),
  };
}

// Newbook field names for the rules & regs signature flow are not
// confirmed yet; we read several likely shapes and surface whatever
// we find. TODO: Pin these to real Newbook keys once verified
// against a booking that has actually been signed.
function mapSignatureInfo(b: NewBookBooking): SignatureInfo {
  const raw = b as unknown as Record<string, unknown>;

  const explicit =
    (typeof raw.signature_status === 'string' && raw.signature_status) ||
    (typeof raw.signed_status === 'string' && raw.signed_status) ||
    null;

  const url =
    (typeof raw.signed_document_url === 'string' && raw.signed_document_url) ||
    (typeof raw.signature_document_url === 'string' &&
      raw.signature_document_url) ||
    (typeof raw.signature_url === 'string' && raw.signature_url) ||
    null;

  const signedAtRaw =
    (typeof raw.signed_at === 'string' && raw.signed_at) ||
    (typeof raw.signature_signed_at === 'string' && raw.signature_signed_at) ||
    null;

  // TODO: confirm whether Newbook nests this under `documents: [...]`
  // with type/category=='rules_and_regs' rather than top-level fields.
  const docs = Array.isArray(raw.documents)
    ? (raw.documents as Array<Record<string, unknown>>)
    : null;
  const rulesDoc = docs?.find((d) => {
    const t = String(d.type ?? d.category ?? d.name ?? '').toLowerCase();
    return /rules|regulation|terms|agreement/.test(t);
  });
  const docUrl =
    url ??
    (rulesDoc && typeof rulesDoc.url === 'string' ? rulesDoc.url : null) ??
    (rulesDoc && typeof rulesDoc.signed_url === 'string'
      ? rulesDoc.signed_url
      : null);
  const docSignedAt =
    signedAtRaw ??
    (rulesDoc && typeof rulesDoc.signed_at === 'string'
      ? rulesDoc.signed_at
      : null);
  const docStatus =
    explicit ??
    (rulesDoc && typeof rulesDoc.status === 'string'
      ? rulesDoc.status
      : null);

  let status: SignatureStatus;
  const norm = docStatus?.toLowerCase() ?? '';
  if (/signed|complete|done/.test(norm) || docSignedAt) {
    status = 'signed';
  } else if (/pending|required|awaiting|unsigned/.test(norm) || docUrl) {
    status = 'pending';
  } else {
    // TODO: default once Newbook's signature flow is confirmed —
    // for now assume the property doesn't require a signature.
    status = 'not_required';
  }

  return {
    signature_status: status,
    signature_signed_at: docSignedAt ? toIso(docSignedAt) : null,
    signature_document_url: docUrl,
  };
}

/** Map a Newbook booking to a fully-populated portal Booking. */
// ── Monthly statement breakout ─────────────────────────────────────────────
// Long-stay reservations bill monthly, but Newbook exposes the schedule as
// EITHER payment-plan installments (authoritative: amount + due date + paid
// status) OR a monthly repeat charge (a rate + a period, no per-month paid
// flag). We turn either into one invoice per month so the portal shows a real
// monthly statement list instead of a single lump sum. Returns null when the
// booking has no monthly schedule (→ keep the single derived invoice).

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
function monthLabel(d: Date): string {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function paymentPlanStatus(
  raw: string | null | undefined,
  dueIso: string | null
): InvoiceStatus {
  const s = (raw ?? '').toLowerCase();
  if (/paid|complete|processed|success|settled/.test(s)) return 'paid';
  if (dueIso && new Date(dueIso) < new Date()) return 'overdue';
  return 'pending';
}

function addMonths(base: Date, n: number): Date {
  const r = new Date(base);
  const day = base.getDate();
  r.setMonth(r.getMonth() + n);
  if (r.getDate() < day) r.setDate(0); // clamp e.g. Jan 31 + 1mo → Feb 28
  return r;
}

function monthlySchedule(fromIso: string, toIso2: string): Date[] {
  const from = new Date(fromIso);
  const to = new Date(toIso2);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return [];
  const out: Date[] = [];
  for (let i = 0; i < 60; i++) {
    const d = addMonths(from, i);
    if (d > to) break;
    out.push(d);
  }
  return out;
}

function deriveScheduledInvoices(
  b: NewBookBooking,
  base: Invoice
): Invoice[] | null {
  const money = (n: number) => Number(n.toFixed(2));

  // 1) Payment-plan installments — authoritative amounts, dates and status.
  const plans = b.payment_plans ?? [];
  if (plans.length >= 2) {
    return plans.map((p, i) => {
      const amount = money(num(p.amount));
      const raw = p.due_date ?? p.date;
      const due = raw ? toIso(String(raw)) || null : null;
      const status = paymentPlanStatus(p.status, due);
      const label =
        (p.description ?? '').trim() || `Payment ${i + 1} of ${plans.length}`;
      return {
        ...base,
        id: `${base.id}-pp-${i + 1}`,
        newbook_invoice_id: `${b.booking_id}-pp-${i + 1}`,
        amount,
        status,
        due_date: due,
        paid_at: status === 'paid' ? due : null,
        description: label,
        line_items: [
          { description: label, quantity: 1, unit_price: amount, total: amount },
        ],
        taxes: [],
      };
    });
  }

  // 2) Monthly repeat charge — expand across its period. Newbook gives no
  //    per-month paid flag, so we apply what's already been paid earliest-first.
  const monthly = (b.repeat_charges ?? []).find(
    (rc) =>
      String(rc.guest_visible) === '1' &&
      /month/i.test(`${rc.interval_label ?? ''} ${rc.interval ?? ''}`)
  );
  if (monthly) {
    const fromIso = toIso(monthly.period_from ?? b.booking_arrival);
    const toIso2 = toIso(monthly.period_to ?? b.booking_departure);
    const dates = monthlySchedule(fromIso, toIso2);
    if (dates.length >= 2) {
      const amount = money(num(monthly.amount));
      let paidRemaining = Math.max(
        0,
        num(b.booking_total) - num(b.account_balance)
      );
      const now = new Date();
      return dates.map((d, i) => {
        const dIso = d.toISOString();
        let status: InvoiceStatus;
        if (paidRemaining >= amount - 0.001) {
          status = 'paid';
          paidRemaining -= amount;
        } else if (paidRemaining > 0.001) {
          status = 'partial';
          paidRemaining = 0;
        } else {
          status = d < now ? 'overdue' : 'pending';
        }
        const label = `${monthly.description || 'Monthly charge'} — ${monthLabel(d)}`;
        return {
          ...base,
          id: `${base.id}-m-${i + 1}`,
          newbook_invoice_id: `${b.booking_id}-m-${i + 1}`,
          amount,
          status,
          due_date: dIso,
          paid_at: status === 'paid' ? dIso : null,
          description: label,
          line_items: [
            { description: label, quantity: 1, unit_price: amount, total: amount },
          ],
          taxes: [],
        };
      });
    }
  }

  return null;
}

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
  const scheduledInvoices = deriveScheduledInvoices(b, invoice);
  const signature = mapSignatureInfo(b);

  const recurringCharges = (b.repeat_charges ?? [])
    .filter((rc) => String(rc.guest_visible) === '1')
    .map((rc) => ({
      description: rc.description,
      amount: num(rc.amount),
      interval_label: rc.interval_label || rc.interval || 'Recurring',
      next_run: rc.next_run ? toIso(rc.next_run) : null,
      period_from: rc.period_from ? toIso(rc.period_from) : null,
      period_to: rc.period_to ? toIso(rc.period_to) : null,
      status: rc.status || 'Active',
    }));
  const paymentPlans = (b.payment_plans ?? []).map((p) => ({
    description: p.description ?? null,
    amount: num(p.amount),
    due_date: (p.due_date ?? p.date)
      ? toIso(String(p.due_date ?? p.date))
      : null,
    status: p.status ?? null,
  }));
  const additionalGuests = (b.guests ?? [])
    .filter((g) => String(g.primary_client) !== '1')
    .map((g) => ({
      name: [g.firstname, g.lastname].filter(Boolean).join(' ') || 'Guest',
      type: null,
    }));

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
    eta: b.booking_eta || null,
    recurring_charges: recurringCharges,
    payment_plans: paymentPlans,
    additional_guests: additionalGuests,
    equipment: (lead?.equipment ?? []).map(mapEquipment),
    required_checkin_document_ids: b.required_checkin_documents_ids ?? [],
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
      signature_status: signature.signature_status,
      signature_signed_at: signature.signature_signed_at,
      signature_document_url: signature.signature_document_url,
    },
    synced_at: new Date().toISOString(),
    created_at: toIso(b.booking_placed) || new Date().toISOString(),
    property,
    invoices: scheduledInvoices ?? [invoice],
  };
}
