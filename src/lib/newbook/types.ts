// ============================================================
// NewBook API Response Types
// ============================================================
//
// These types represent the expected shape of data returned by
// the NewBook PMS API. They intentionally differ from our internal
// portal types (e.g., British spelling conventions, different
// field names and nesting).
//
// NOTE: These are based on expected API shape from NewBook
// documentation previews. They WILL need adjustment once we have
// live API access and can verify actual response structures.
// ============================================================

// --- Guest ---

/** NewBook's representation of a guest profile. */
export interface NewBookGuest {
  /** NewBook internal guest ID */
  guest_id: number;
  /** Title (Mr, Mrs, etc.) */
  title: string | null;
  firstname: string;
  surname: string;
  email: string;
  /** NewBook uses "mobile" rather than "phone" */
  mobile: string | null;
  phone: string | null;
  /** Flat address fields in NewBook */
  address_line_1: string | null;
  address_line_2: string | null;
  /** NewBook uses "suburb" instead of "city" */
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  /** NewBook uses "country_code" (ISO 2-letter) */
  country_code: string | null;
  /** Custom fields stored as key-value pairs */
  custom_fields: Record<string, unknown> | null;
  /** ISO date string */
  date_created: string;
  /** ISO date string */
  date_modified: string;
  /** Whether the guest record is active */
  is_active: boolean;
}

// --- Booking ---

/** NewBook's representation of a booking / reservation. */
export interface NewBookBooking {
  /** NewBook internal booking ID */
  booking_id: number;
  guest_id: number;
  /** NewBook uses "instance_id" for property identification */
  instance_id: number;
  /** NewBook booking status string (e.g., "confirmed", "in_house", "checked_out", "cancelled") */
  status: string;
  /** ISO date string for arrival */
  arrival_date: string;
  /** ISO date string for departure */
  departure_date: string;
  /** NewBook calls it "site_name" or "room_name" */
  site_name: string | null;
  /** Category/type of the site or room */
  category_name: string | null;
  /** Total booking cost in NewBook */
  total_charge: number;
  /** Outstanding balance */
  balance_owing: number;
  /** Number of adults */
  adults: number;
  /** Number of children */
  children: number;
  /** Booking notes/comments */
  comments: string | null;
  /** Group booking reference, if applicable */
  group_id: number | null;
  /** ISO date string */
  date_created: string;
  /** ISO date string */
  date_modified: string;
  /** Extra charges or add-ons */
  extras: NewBookBookingExtra[] | null;
}

/** An extra/add-on attached to a NewBook booking. */
export interface NewBookBookingExtra {
  extra_id: number;
  name: string;
  quantity: number;
  /** Price per unit */
  unit_price: number;
  total_price: number;
}

// --- Invoice ---

/** NewBook's representation of an invoice. */
export interface NewBookInvoice {
  invoice_id: number;
  booking_id: number;
  guest_id: number;
  /** Total amount on the invoice */
  total_amount: number;
  /** Amount already paid */
  amount_paid: number;
  /** Outstanding balance on this invoice */
  balance_owing: number;
  /** NewBook invoice status (e.g., "open", "closed", "void") */
  status: string;
  /** ISO date string */
  due_date: string | null;
  /** ISO date string */
  date_paid: string | null;
  /** ISO date string */
  date_created: string;
  /** Line items / charges */
  line_items: NewBookInvoiceLineItem[];
  /** Description or reference */
  description: string | null;
}

/** A single line item on a NewBook invoice. */
export interface NewBookInvoiceLineItem {
  line_item_id: number;
  description: string;
  quantity: number;
  /** NewBook uses "unit_amount" */
  unit_amount: number;
  /** Total for this line */
  total_amount: number;
  /** Tax amount, if applicable */
  tax_amount: number;
  /** Charge category (e.g., "accommodation", "extra", "fee") */
  charge_category: string;
}

// --- Payment ---

/** NewBook's representation of a payment transaction. */
export interface NewBookPayment {
  payment_id: number;
  invoice_id: number;
  booking_id: number;
  guest_id: number;
  /** Payment amount */
  amount: number;
  /** Payment method used (e.g., "credit_card", "eftpos", "cash") */
  payment_method: string;
  /** Reference/transaction ID from payment processor */
  reference: string | null;
  /** NewBook payment status (e.g., "completed", "pending", "failed") */
  status: string;
  /** ISO date string */
  date_created: string;
}

/** Tokenized payment method stored in NewBook. */
export interface NewBookStoredPaymentMethod {
  token_id: string;
  guest_id: number;
  /** Card type or payment type */
  card_type: string | null;
  /** Last four digits */
  last_four: string;
  /** Whether this is the default payment method */
  is_default: boolean;
  /** ISO date string */
  date_created: string;
}

// --- Webhook Events ---

/** The shape of a webhook payload from NewBook. */
export interface NewBookWebhookPayload {
  /** Event type identifier */
  event_type: string;
  /** Instance/property that triggered the event */
  instance_id: number;
  /** ISO timestamp of when the event occurred */
  timestamp: string;
  /** The actual event data; shape depends on event_type */
  data: Record<string, unknown>;
  /** HMAC signature for verification */
  signature: string;
}

// --- API Response Wrappers ---

/**
 * Standard wrapper for NewBook API responses.
 * NewBook typically returns success/error at the top level.
 */
export interface NewBookApiResponse<T> {
  success: boolean;
  /** Present when success is false */
  error_message?: string;
  /** Present when success is false */
  error_code?: string;
  /** The response payload */
  data: T;
}

/**
 * Paginated response from NewBook list endpoints.
 * NewBook uses "total_records" and "page"/"per_page" conventions.
 */
export interface NewBookPaginatedResponse<T> {
  success: boolean;
  data: T[];
  total_records: number;
  page: number;
  per_page: number;
}
