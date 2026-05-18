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
import { getDefaultProperty, getDemoGuestId } from './config';
import type { NewBookBooking } from './types';
import { mapBooking, mapGuest, primaryGuest, guestPortalId } from './mappers';

const PROPERTY_PROFILES: Record<string, Property> = {
  holiday: {
    id: 'holiday',
    name: 'Holiday Motel and RV Park',
    slug: 'holiday-motel',
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

// Short-lived in-memory cache so navigating between portal pages
// doesn't re-hit Newbook on every request during a browse session.
const CACHE_TTL_MS = 60_000;
let cache: { key: string; at: number; bookings: Booking[] } | null = null;

async function fetchDemoBookings(): Promise<Booking[]> {
  const guestId = getDemoGuestId();
  const cacheKey = `${getDefaultProperty()}:${guestId}`;
  if (cache && cache.key === cacheKey && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.bookings;
  }

  const client = createNewBookClient();
  const property = getProperty();

  const raw = await client.request<NewBookBooking[]>('bookings_list', {
    period_from: '2020-01-01 00:00:00',
    period_to: '2035-12-31 00:00:00',
    list_type: 'staying',
    guest_id: Number(guestId),
  });

  const bookings = (Array.isArray(raw) ? raw : [])
    .map((b) => mapBooking(b, property, { guestId: guestPortalId(guestId) }))
    .sort(
      (a, b) =>
        new Date(b.check_in).getTime() - new Date(a.check_in).getTime()
    );

  cache = { key: cacheKey, at: Date.now(), bookings };
  return bookings;
}

/** All bookings for the demo guest, newest stay first. */
export async function getBookings(): Promise<Booking[]> {
  return fetchDemoBookings();
}

/** One booking by its portal id (`nb-bk-<newbookId>`), or null. */
export async function getBookingById(
  portalId: string
): Promise<Booking | null> {
  const bookings = await fetchDemoBookings();
  return bookings.find((b) => b.id === portalId) ?? null;
}

/** The demo guest's profile, derived from their most recent booking. */
export async function getDemoGuest(): Promise<Guest | null> {
  const client = createNewBookClient();
  const guestId = getDemoGuestId();

  const raw = await client.request<NewBookBooking[]>('bookings_list', {
    period_from: '2020-01-01 00:00:00',
    period_to: '2035-12-31 00:00:00',
    list_type: 'staying',
    guest_id: Number(guestId),
  });

  for (const b of Array.isArray(raw) ? raw : []) {
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
