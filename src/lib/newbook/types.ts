// ============================================================
// Newbook API response types
// ============================================================
//
// Shapes verified against the live Holiday Motel instance.
// Newbook returns numbers/booleans as strings in many fields
// ("0.00", "1", "0"), dates as "YYYY-MM-DD HH:MM:SS"
// (property-local time), and `success` as "true"/"false".
// Only the fields the portal consumes are typed; the real
// payload carries more.
// ============================================================

/** Every Newbook action returns this envelope. */
export interface NewBookEnvelope<T> {
  success: 'true' | 'false';
  data: T;
  message: string;
  timestamp?: string;
  timezone?: string;
}

/** One contact channel on a guest (email, mobile, phone, ...). */
export interface NewBookContactDetail {
  id: string;
  type: string; // "email" | "mobile" | "phone" | ...
  content: string;
  notes?: string;
  allow_marketing?: number | boolean;
  allow_transactional?: number | boolean;
}

/** An insurance policy on a guest or a piece of equipment. */
export interface NewBookInsurancePolicy {
  id?: string;
  provider?: string | null;
  insurer?: string | null;
  policy_number?: string | null;
  type?: string | null;
  expiry?: string | null;
  expiry_date?: string | null;
}

/** Guest equipment (RV/rig) attached to a guest record. */
export interface NewBookEquipment {
  equipment_id: string;
  equipment_name: string;
  equipment_make: string;
  equipment_model: string;
  equipment_registration: string;
  equipment_registration_expiry?: string | null;
  equipment_length: string;
  equipment_width?: string;
  equipment_height?: string;
  equipment_measurement_unit: string;
  equipment_type_name?: string | null;
  slideouts?: string;
  active?: string;
  insurance_policies?: NewBookInsurancePolicy[];
}

/** A guest, as embedded in a booking and returned by guests_list. */
export interface NewBookGuest {
  guest_id: string;
  id?: string;
  firstname: string;
  lastname: string;
  othername?: string;
  title?: string;
  primary_client?: string; // "1" for the booking's lead guest
  contact_details: NewBookContactDetail[];
  street?: string;
  city?: string;
  state_shortname?: string;
  state_name?: string;
  postcode?: string;
  country_code?: string;
  country_name?: string;
  account_id?: string;
  account_balance?: string;
  date_of_birth?: string | null;
  equipment?: NewBookEquipment[];
  insurance_policies?: NewBookInsurancePolicy[];
  date_created?: string;
  modified_when?: string;
}

/** Per-stay-date tariff line on a booking. */
export interface NewBookTariffQuoted {
  tariff_quoted_id: string;
  label: string;
  stay_date: string; // "YYYY-MM-DD"
  charge_amount: string;
  calculated_amount: string;
  original_amount: string;
  taxes?: {
    tax_id: number;
    tax_name: string;
    tax_amount: number | string;
    tax_inclusive?: boolean;
  }[];
}

/** An inventory item / fee / extra charged on a booking. */
export interface NewBookInventoryItem {
  id: string;
  name: string;
  description: string;
  amount: string;
  stay_date?: string;
}

/** A discount applied to a booking. */
export interface NewBookDiscount {
  discount_id?: string;
  discount_name?: string;
  discount_total?: string;
}

/** A recurring/repeat charge (e.g. a monthly site rate) on a booking. */
export interface NewBookRepeatCharge {
  repeat_charge_id: number | string;
  description: string;
  amount: string;
  interval?: string;
  interval_label?: string;
  interval_multiplier?: string;
  period_from?: string | null;
  period_to?: string | null;
  next_run?: string | null;
  status?: string;
  guest_visible?: string | number;
}

/** A scheduled payment-plan installment on a booking. */
export interface NewBookPaymentPlan {
  id?: string | number;
  amount?: string | number;
  due_date?: string | null;
  date?: string | null;
  status?: string | null;
  description?: string | null;
}

export interface NewBookBooking {
  booking_id: number;
  booking_status: string; // "Unconfirmed" | "Confirmed" | "Arrived" | "Departed"
  booking_arrival: string; // "YYYY-MM-DD HH:MM:SS"
  booking_departure: string;
  booking_eta?: string | null;
  booking_checkedin: string | null;
  booking_checkedout: string | null;
  booking_cancelled: string | null;
  booking_cancelled_reason_name?: string | null;
  booking_length: number;
  booking_adults: string;
  booking_children: string;
  booking_infants: string;
  booking_animals: string;
  booking_total: string;
  booking_placed: string;
  booking_modified: string;
  account_id?: string;
  account_balance?: string;
  site_id?: string;
  site_name?: string | null;
  category_id?: string;
  category_name?: string | null;
  bookings_group_id?: number | string | null;
  tariff_total?: string;
  tariffs_quoted?: NewBookTariffQuoted[];
  inventory_items?: NewBookInventoryItem[];
  discounts?: NewBookDiscount[];
  discount_total?: string;
  repeat_charges?: NewBookRepeatCharge[];
  payment_plans?: NewBookPaymentPlan[];
  required_checkin_documents_ids?: (string | number)[];
  additional_guests?: { guest_id: string; guest_type?: string }[];
  guests?: NewBookGuest[];
  notes?: unknown[];
}
