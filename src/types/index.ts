// ============================================================
// Core Types for Guest Portal
// ============================================================

// --- Multi-Tenancy ---

export interface Property {
  id: string;
  name: string;
  slug: string;
  newbook_instance_url: string | null;
  newbook_api_key: string | null;
  timezone: string;
  cancellation_policy: CancellationPolicy;
  features_enabled: FeaturesEnabled;
  contact_info: ContactInfo;
  smart_lock_provider: string | null;
  smart_lock_config: Record<string, unknown>;
  branding: PropertyBranding;
  created_at: string;
}

export interface CancellationPolicy {
  refund_eligible: boolean;
  cutoff_days: number;
  policy_text: string;
}

export interface FeaturesEnabled {
  check_in: boolean;
  food_trucks: boolean;
  local_guide: boolean;
  push_notifications: boolean;
  add_ons: boolean;
  document_uploads: boolean;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  emergency_phone?: string;
}

export interface PropertyBranding {
  logo_url?: string;
  primary_color?: string;
  accent_color?: string;
  welcome_message?: string;
}

// --- Guest / Auth ---

export interface Guest {
  id: string;
  auth_user_id: string;
  newbook_guest_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: GuestAddress;
  preferences: GuestPreferences;
  created_at: string;
  updated_at: string;
}

export interface GuestAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface GuestPreferences {
  kids_count?: number;
  kids_ages?: number[];
  pets?: PetInfo[];
  site_preferences?: string;
  special_needs?: string;
}

export interface PetInfo {
  type: string;
  breed?: string;
  name?: string;
}

// --- Vehicles ---

export interface Vehicle {
  id: string;
  guest_id: string;
  property_id: string;
  type: 'rv' | 'trailer' | 'motorhome' | 'vehicle' | 'other';
  make: string | null;
  model: string | null;
  year: number | null;
  license_plate: string | null;
  length_ft: number | null;
  details: Record<string, unknown>;
  created_at: string;
}

// --- Documents ---

export interface GuestDocument {
  id: string;
  guest_id: string;
  property_id: string;
  type: 'insurance' | 'registration' | 'license' | 'signed_agreement';
  label: string | null;
  file_path: string;
  file_url?: string;
  expires_at: string | null;
  uploaded_at: string;
  verified_by: string | null;
  verified_at: string | null;
}

// --- Bookings ---

export type BookingStatus = 'upcoming' | 'checked_in' | 'checked_out' | 'cancelled';

export interface Booking {
  id: string;
  property_id: string;
  guest_id: string;
  newbook_booking_id: string;
  status: BookingStatus;
  check_in: string;
  check_out: string;
  site_or_room: string | null;
  booking_type: 'rv' | 'motel' | 'cabin' | 'mobile_home' | 'other';
  group_booking_id: string | null;
  total_amount: number;
  balance_due: number;
  details: Record<string, unknown>;
  synced_at: string;
  created_at: string;
  // Joined data
  property?: Property;
  invoices?: Invoice[];
}

// --- Invoices ---

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'partial';

export interface Invoice {
  id: string;
  booking_id: string;
  property_id: string;
  guest_id: string;
  newbook_invoice_id: string | null;
  amount: number;
  status: InvoiceStatus;
  due_date: string | null;
  paid_at: string | null;
  description: string | null;
  line_items: InvoiceLineItem[];
  synced_at: string;
  // Joined data
  booking?: Booking;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

// --- Payment Methods ---

export interface PaymentMethod {
  id: string;
  guest_id: string;
  type: 'credit_card' | 'ach';
  last_four: string;
  brand: string | null;
  is_preferred: boolean;
  auto_pay_enabled: boolean;
  newbook_payment_token: string | null;
  created_at: string;
}

// --- Add-on Requests ---

export type AddonStatus = 'requested' | 'approved' | 'fulfilled' | 'denied';

export interface AddonRequest {
  id: string;
  booking_id: string;
  guest_id: string;
  property_id: string;
  addon_type: string;
  status: AddonStatus;
  details: Record<string, unknown>;
  requested_at: string;
  resolved_at: string | null;
}

// --- Notifications ---

export interface Notification {
  id: string;
  property_id: string;
  target_type: 'all_guests' | 'specific_guest' | 'booking_group';
  target_id: string | null;
  title: string;
  body: string;
  channel: 'push' | 'email' | 'both';
  sent_at: string | null;
  created_by: string | null;
  read?: boolean;
}

// --- Property Content ---

export type ContentType = 'local_guide' | 'food_truck_schedule' | 'tutorial' | 'faq' | 'event';

export interface PropertyContent {
  id: string;
  property_id: string;
  type: ContentType;
  title: string;
  body: string | null;
  media_url: string | null;
  schedule: Record<string, unknown> | null;
  sort_order: number;
  active: boolean;
  created_at: string;
}

// --- Analytics ---

export interface AnalyticsEvent {
  id: string;
  guest_id: string | null;
  property_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

// --- API Response Wrappers ---

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}
