// ============================================================
// Newbook data layer (server-only)
// ============================================================
//
// The portal has no booking/guest DB tables yet, so pages and
// API routes read live from Newbook through here. Scoped to the
// fixed demo guest (see config.getDemoGuestId) until a real
// portal-login <-> Newbook-guest mapping exists.
//
// Credentials never cross to the client: only mapped portal
// types leave this module, and Property.newbook_api_key is null.
// ============================================================

import type { Booking, Guest, Property } from '@/types/index';
import { createNewBookClient } from './client';
import { getDefaultProperty } from './config';
import { getSessionUser } from '@/lib/session';
import type { NewBookBooking, NewBookInvoice } from './types';
import {
  mapBooking,
  mapGuest,
  mapNewbookInvoice,
  primaryGuest,
  guestPortalId,
  bookingPortalId,
} from './mappers';
import { DEMO_RAW_BOOKINGS } from './fixtures';

/** Thrown when a read is attempted without a signed-in, Newbook-linked guest. */
export class NoLinkedGuestError extends Error {
  constructor() {
    super('NO_LINKED_GUEST');
    this.name = 'NoLinkedGuestError';
  }
}

/**
 * Resolve WHICH guest's data to read: an explicit override (trusted server
 * code) else the signed-in guest's Newbook id from the JWT. Throws rather
 * than ever falling back to someone else's data.
 */
async function resolveGuestId(explicit?: string): Promise<string> {
  if (explicit) return explicit;
  const user = await getSessionUser();
  if (user?.newbookGuestId) return user.newbookGuestId;
  throw new NoLinkedGuestError();
}

const PROPERTY_PROFILES: Record<string, Property> = {
  holiday: {
    id: 'holiday',
    name: 'Holiday Motel and RV Park',
    slug: 'holiday-motel',
    owner_legal_name: 'Holiday Holdings LLC',
    newbook_instance_url: null,
    newbook_api_key: null, // never expose the key client-side
    timezone: 'America/Boise',
    cancellation_policy: {
      refund_eligible: true,
      cutoff_days: 7,
      policy_text:
        'Full refund if cancelled 7 or more days before arrival. ' +
        'Within 7 days the first night is non-refundable. ' +
        'Please contact the front desk for assistance.',
    },
    features_enabled: {
      check_in: true,
      food_trucks: false,
      local_guide: false,
      push_notifications: true,
      add_ons: true,
      document_uploads: true,
    },
    contact_info: {
      phone: '(208) 365-4479',
      email: 'frontdesk@holidaymotelrv.com',
    },
    smart_lock_provider: null,
    smart_lock_config: {},
    branding: {
      // Drop the park's logo at public/brands/holiday-motel/logo.png
      // (transparent PNG preferred). Falls back to a name monogram
      // until the file exists.
      logo_url: '/brands/holiday-motel/logo.png',
      primary_color: '#b47a24',
      accent_color: '#fdf8f0',
      welcome_message:
        'Welcome to Holiday Motel and RV Park — we are glad to have you.',
    },
    created_at: '2024-01-01T00:00:00Z',
  },
};

export function getProperty(): Property {
  return PROPERTY_PROFILES[getDefaultProperty()] ?? PROPERTY_PROFILES.holiday;
}

// One cached raw bookings_list response feeds BOTH getBookings and
// getDemoGuest, so a portal page load makes a single Newbook call
// (not one per consumer). Newbook sits behind Cloudflare and will
// rate-limit/403 a chatty client, so we also negative-cache failures
// briefly to avoid hammering during an outage or block.
const SUCCESS_TTL_MS = 5 * 60_000;
const FAILURE_TTL_MS = 30_000;

let rawCache: { key: string; at: number; raw: NewBookBooking[] } | null = null;
let failCache: { key: string; at: number; error: Error } | null = null;

/** Dev-only: serve a snapshot when the live API is unreachable. */
function offlineFallbackEnabled(): boolean {
  return process.env.NEWBOOK_OFFLINE_FALLBACK === "true";
}

async function fetchRawBookings(guestId: string): Promise<NewBookBooking[]> {
  const key = `${getDefaultProperty()}:${guestId}`;
  const now = Date.now();

  if (rawCache && rawCache.key === key && now - rawCache.at < SUCCESS_TTL_MS) {
    return rawCache.raw;
  }
  // We failed recently — don't pelt a blocked endpoint. Serve the
  // offline snapshot if enabled, otherwise surface the error.
  if (failCache && failCache.key === key && now - failCache.at < FAILURE_TTL_MS) {
    if (offlineFallbackEnabled()) return DEMO_RAW_BOOKINGS;
    throw failCache.error;
  }

  try {
    const client = createNewBookClient();
    const raw = await client.request<NewBookBooking[]>('bookings_list', {
      period_from: '2020-01-01 00:00:00',
      period_to: '2035-12-31 00:00:00',
      list_type: 'staying',
      guest_id: Number(guestId),
    });
    const list = Array.isArray(raw) ? raw : [];
    rawCache = { key, at: Date.now(), raw: list };
    failCache = null;
    return list;
  } catch (error) {
    failCache = {
      key,
      at: Date.now(),
      error: error instanceof Error ? error : new Error(String(error)),
    };
    if (offlineFallbackEnabled()) {
      console.warn(
        "Newbook unreachable — serving offline snapshot (NEWBOOK_OFFLINE_FALLBACK). Live data resumes when the API is reachable.",
      );
      return DEMO_RAW_BOOKINGS;
    }
    throw error;
  }
}

// Real invoices, keyed by the set of client accounts requested. Newbook bills
// a long stay one period at a time, so this is the only accurate picture of
// what a guest has actually been invoiced (and paid) to date.
let invoiceCache: { key: string; at: number; raw: NewBookInvoice[] } | null =
  null;

async function fetchRawInvoices(
  accountIds: string[],
): Promise<NewBookInvoice[]> {
  if (accountIds.length === 0) return [];
  const key = `${getDefaultProperty()}:${[...accountIds].sort().join(',')}`;
  const now = Date.now();

  if (invoiceCache && invoiceCache.key === key && now - invoiceCache.at < SUCCESS_TTL_MS) {
    return invoiceCache.raw;
  }

  try {
    const client = createNewBookClient();
    const raw = await client.request<NewBookInvoice[]>('invoices_list', {
      account_id: accountIds,
      account_for: 'bookings',
      fetch_items: true,
      data_limit: 1000,
    });
    const list = Array.isArray(raw) ? raw : [];
    invoiceCache = { key, at: Date.now(), raw: list };
    return list;
  } catch (error) {
    // The booking itself still renders; it just falls back to the
    // whole-stay estimate rather than the per-period invoices.
    console.warn(
      'Newbook invoices_list unavailable, falling back to derived invoice:',
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

/** All bookings for the signed-in guest, newest stay first. */
export async function getBookings(guestId?: string): Promise<Booking[]> {
  const property = getProperty();
  const id = await resolveGuestId(guestId);
  const raw = await fetchRawBookings(id);

  const accountIds = [
    ...new Set(
      raw
        .map((b) => b.account_id)
        .filter((a): a is string => typeof a === 'string' && a.length > 0),
    ),
  ];
  const rawInvoices = await fetchRawInvoices(accountIds);

  // invoices_list reports the booking on `account_for_id`.
  const byBooking = new Map<string, NewBookInvoice[]>();
  for (const inv of rawInvoices) {
    if (inv.voided_when) continue;
    if (inv.account_for !== 'bookings') continue;
    const bookingId = String(inv.account_for_id);
    const list = byBooking.get(bookingId) ?? [];
    list.push(inv);
    byBooking.set(bookingId, list);
  }

  const guest_id = guestPortalId(id);
  return raw
    .map((b) => {
      const invoices = (byBooking.get(String(b.booking_id)) ?? [])
        .sort((x, y) => (x.due_on ?? '').localeCompare(y.due_on ?? ''))
        .map((inv) =>
          mapNewbookInvoice(inv, {
            property_id: property.id,
            guest_id,
            booking_id: bookingPortalId(b.booking_id),
          }),
        );
      return mapBooking(b, property, { guestId: guest_id, invoices });
    })
    .sort(
      (a, b) =>
        new Date(b.check_in).getTime() - new Date(a.check_in).getTime(),
    );
}

/** One booking by its portal id (`nb-bk-<newbookId>`), or null. */
export async function getBookingById(
  portalId: string,
  guestId?: string,
): Promise<Booking | null> {
  const bookings = await getBookings(guestId);
  return bookings.find((b) => b.id === portalId) ?? null;
}

/** The signed-in guest's profile, derived from their most recent booking. */
export async function getDemoGuest(guestId?: string): Promise<Guest | null> {
  const id = await resolveGuestId(guestId);
  const raw = await fetchRawBookings(id);
  for (const b of raw) {
    const lead = primaryGuest(b);
    if (lead) {
      return {
        id: guestPortalId(lead.guest_id),
        auth_user_id: `newbook:${lead.guest_id}`,
        created_at: lead.date_created
          ? lead.date_created.replace(' ', 'T')
          : new Date().toISOString(),
        updated_at: lead.modified_when
          ? lead.modified_when.replace(' ', 'T')
          : new Date().toISOString(),
        ...mapGuest(lead),
      };
    }
  }
  return null;
}
