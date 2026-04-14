// ============================================================
// NewBook <-> Portal Type Mappers
// ============================================================
//
// Functions to convert between NewBook API types and our internal
// portal types. These handle naming convention differences
// (e.g., NewBook "surname" -> portal "last_name"), structural
// differences (flat vs nested), and value normalization.
//
// Pattern reference for common field mappings:
//   NewBook "surname"       -> Portal "last_name"
//   NewBook "firstname"     -> Portal "first_name"
//   NewBook "mobile"        -> Portal "phone"
//   NewBook "suburb"        -> Portal "city"
//   NewBook "postcode"      -> Portal "zip"
//   NewBook "country_code"  -> Portal "country"
//   NewBook "arrival_date"  -> Portal "check_in"
//   NewBook "departure_date"-> Portal "check_out"
//   NewBook "site_name"     -> Portal "site_or_room"
//   NewBook "total_charge"  -> Portal "total_amount"
//   NewBook "balance_owing" -> Portal "balance_due"
//   NewBook "unit_amount"   -> Portal "unit_price"
//
// NOTE: These mappings are based on expected API shape and
// will need adjustment once we have live API data to verify.
// ============================================================

import type {
  Guest,
  GuestAddress,
  Booking,
  BookingStatus,
  Invoice,
  InvoiceStatus,
  InvoiceLineItem,
} from '@/types/index';

import type {
  NewBookGuest,
  NewBookBooking,
  NewBookInvoice,
  NewBookInvoiceLineItem,
} from './types';

// --- Guest Mappers ---

/**
 * Map a NewBook guest record to our internal Guest type.
 *
 * Note: Some fields like `id`, `auth_user_id`, and `created_at`
 * are portal-only and cannot be derived from NewBook data.
 * These are left as empty/default values and must be populated
 * by the caller (typically during upsert).
 *
 * @param nbGuest - Guest data from NewBook API
 * @returns Partial Guest object (missing portal-only fields)
 */
export function mapNewBookGuestToGuest(nbGuest: NewBookGuest): Omit<Guest, 'id' | 'auth_user_id' | 'created_at' | 'updated_at'> {
  const address: GuestAddress = {
    // NewBook "address_line_1" -> portal "street"
    street: [nbGuest.address_line_1, nbGuest.address_line_2]
      .filter(Boolean)
      .join(', ') || undefined,
    // NewBook "suburb" -> portal "city"
    city: nbGuest.suburb ?? undefined,
    state: nbGuest.state ?? undefined,
    // NewBook "postcode" -> portal "zip"
    zip: nbGuest.postcode ?? undefined,
    // NewBook "country_code" -> portal "country"
    country: nbGuest.country_code ?? undefined,
  };

  return {
    newbook_guest_id: String(nbGuest.guest_id),
    email: nbGuest.email,
    // NewBook "firstname" -> portal "first_name"
    first_name: nbGuest.firstname || null,
    // NewBook "surname" -> portal "last_name"
    last_name: nbGuest.surname || null,
    // NewBook "mobile" takes precedence, fall back to "phone"
    phone: nbGuest.mobile || nbGuest.phone || null,
    address,
    // TODO: Map custom_fields to preferences if NewBook stores
    // kids_count, pets, etc. in custom fields
    preferences: {},
  };
}

/**
 * Map our internal Guest type to a NewBook guest record for API push.
 *
 * Only includes fields that NewBook accepts for create/update.
 * Read-only fields (date_created, etc.) are excluded.
 *
 * @param guest - Portal guest data
 * @returns NewBook-shaped guest object for API submission
 */
export function mapGuestToNewBookGuest(guest: Guest): Partial<NewBookGuest> {
  // TODO: Determine which fields are writable via NewBook API
  // TODO: Handle address_line_1 vs address_line_2 split properly

  return {
    // Portal "first_name" -> NewBook "firstname"
    firstname: guest.first_name || '',
    // Portal "last_name" -> NewBook "surname"
    surname: guest.last_name || '',
    email: guest.email,
    // Portal "phone" -> NewBook "mobile"
    mobile: guest.phone,
    // Portal "street" -> NewBook "address_line_1"
    address_line_1: guest.address?.street || null,
    address_line_2: null,
    // Portal "city" -> NewBook "suburb"
    suburb: guest.address?.city || null,
    state: guest.address?.state || null,
    // Portal "zip" -> NewBook "postcode"
    postcode: guest.address?.zip || null,
    // Portal "country" -> NewBook "country_code"
    country_code: guest.address?.country || null,
    // TODO: Map preferences back to custom_fields if needed
  };
}

// --- Booking Mappers ---

/**
 * Map NewBook booking status strings to our internal BookingStatus enum.
 *
 * NewBook uses: "confirmed", "in_house", "checked_out", "cancelled"
 * Portal uses: "upcoming", "checked_in", "checked_out", "cancelled"
 *
 * @param nbStatus - Status string from NewBook
 * @returns Portal BookingStatus value
 */
function mapBookingStatus(nbStatus: string): BookingStatus {
  // TODO: Verify exact status strings from NewBook API
  const statusMap: Record<string, BookingStatus> = {
    confirmed: 'upcoming',
    tentative: 'upcoming',
    // NewBook "in_house" -> portal "checked_in"
    in_house: 'checked_in',
    checked_out: 'checked_out',
    cancelled: 'cancelled',
    no_show: 'cancelled',
  };

  return statusMap[nbStatus.toLowerCase()] || 'upcoming';
}

/**
 * Map NewBook category names to our internal booking_type values.
 *
 * @param categoryName - Category from NewBook
 * @returns Portal booking type
 */
function mapBookingType(categoryName: string | null): Booking['booking_type'] {
  if (!categoryName) return 'other';

  // TODO: Adjust these mappings based on actual NewBook category names
  const lower = categoryName.toLowerCase();
  if (lower.includes('rv') || lower.includes('caravan')) return 'rv';
  if (lower.includes('motel') || lower.includes('hotel')) return 'motel';
  if (lower.includes('cabin') || lower.includes('cottage')) return 'cabin';
  if (lower.includes('mobile') || lower.includes('manufactured')) return 'mobile_home';
  return 'other';
}

/**
 * Map a NewBook booking record to our internal Booking type.
 *
 * Note: `id`, `property_id`, `guest_id` (portal IDs) must be
 * resolved by the caller since NewBook uses its own ID system.
 *
 * @param nbBooking - Booking data from NewBook API
 * @returns Partial Booking object (missing portal-only fields)
 */
export function mapNewBookBookingToBooking(
  nbBooking: NewBookBooking
): Omit<Booking, 'id' | 'property_id' | 'guest_id' | 'created_at'> {
  return {
    newbook_booking_id: String(nbBooking.booking_id),
    status: mapBookingStatus(nbBooking.status),
    // NewBook "arrival_date" -> portal "check_in"
    check_in: nbBooking.arrival_date,
    // NewBook "departure_date" -> portal "check_out"
    check_out: nbBooking.departure_date,
    // NewBook "site_name" -> portal "site_or_room"
    site_or_room: nbBooking.site_name,
    booking_type: mapBookingType(nbBooking.category_name),
    group_booking_id: nbBooking.group_id ? String(nbBooking.group_id) : null,
    // NewBook "total_charge" -> portal "total_amount"
    total_amount: nbBooking.total_charge,
    // NewBook "balance_owing" -> portal "balance_due"
    balance_due: nbBooking.balance_owing,
    details: {
      adults: nbBooking.adults,
      children: nbBooking.children,
      comments: nbBooking.comments,
      extras: nbBooking.extras,
    },
    synced_at: new Date().toISOString(),
  };
}

/**
 * Map our internal Booking type to a NewBook booking record for API push.
 *
 * Used when modifying bookings via the NewBook API.
 *
 * @param booking - Portal booking data
 * @returns Partial NewBook booking object for API submission
 */
export function mapBookingToNewBookBooking(booking: Booking): Partial<NewBookBooking> {
  // TODO: Determine which fields are writable via NewBook API
  // Most booking modifications will likely be limited to dates
  // and specific fields rather than full record updates.

  return {
    // Portal "check_in" -> NewBook "arrival_date"
    arrival_date: booking.check_in,
    // Portal "check_out" -> NewBook "departure_date"
    departure_date: booking.check_out,
    // Portal "site_or_room" -> NewBook "site_name"
    site_name: booking.site_or_room,
    comments: (booking.details?.comments as string) || null,
    // TODO: Map other writable fields
  };
}

// --- Invoice Mappers ---

/**
 * Map NewBook invoice status strings to our internal InvoiceStatus.
 *
 * NewBook uses: "open", "closed", "void"
 * Portal uses: "pending", "paid", "overdue", "partial"
 *
 * @param nbStatus - Status string from NewBook
 * @param balanceOwing - Remaining balance for partial detection
 * @param dueDate - Due date for overdue detection
 * @returns Portal InvoiceStatus value
 */
function mapInvoiceStatus(
  nbStatus: string,
  balanceOwing: number,
  dueDate: string | null
): InvoiceStatus {
  // TODO: Verify exact status strings from NewBook API
  if (nbStatus.toLowerCase() === 'closed' || balanceOwing <= 0) {
    return 'paid';
  }

  if (balanceOwing > 0 && dueDate) {
    const due = new Date(dueDate);
    if (due < new Date()) {
      return 'overdue';
    }
  }

  // Check if partially paid
  // (balance_owing > 0 but amount_paid > 0 implies partial)
  return 'pending';
}

/**
 * Map a NewBook invoice line item to our internal format.
 *
 * @param nbLineItem - Line item from NewBook
 * @returns Portal InvoiceLineItem
 */
function mapLineItem(nbLineItem: NewBookInvoiceLineItem): InvoiceLineItem {
  return {
    description: nbLineItem.description,
    quantity: nbLineItem.quantity,
    // NewBook "unit_amount" -> portal "unit_price"
    unit_price: nbLineItem.unit_amount,
    // NewBook "total_amount" -> portal "total"
    total: nbLineItem.total_amount,
  };
}

/**
 * Map a NewBook invoice record to our internal Invoice type.
 *
 * Note: `id`, `property_id`, `booking_id`, `guest_id` (portal IDs)
 * must be resolved by the caller.
 *
 * @param nbInvoice - Invoice data from NewBook API
 * @returns Partial Invoice object (missing portal-only fields)
 */
export function mapNewBookInvoiceToInvoice(
  nbInvoice: NewBookInvoice
): Omit<Invoice, 'id' | 'booking_id' | 'property_id' | 'guest_id'> {
  return {
    newbook_invoice_id: String(nbInvoice.invoice_id),
    amount: nbInvoice.total_amount,
    status: mapInvoiceStatus(nbInvoice.status, nbInvoice.balance_owing, nbInvoice.due_date),
    due_date: nbInvoice.due_date,
    // NewBook "date_paid" -> portal "paid_at"
    paid_at: nbInvoice.date_paid,
    description: nbInvoice.description,
    line_items: nbInvoice.line_items.map(mapLineItem),
    synced_at: new Date().toISOString(),
  };
}
