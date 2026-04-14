import type {
  Guest,
  Property,
  Booking,
  Invoice,
  PaymentMethod,
  Notification,
  GuestDocument,
  Vehicle,
} from "@/types/index";

// ============================================================
// Mock Property
// ============================================================

export const mockProperty: Property = {
  id: "prop_001",
  name: "Sunset Shores RV Resort",
  slug: "sunset-shores",
  newbook_instance_url: null,
  newbook_api_key: null,
  timezone: "America/Chicago",
  cancellation_policy: {
    refund_eligible: true,
    cutoff_days: 7,
    policy_text:
      "Full refund if cancelled 7 or more days before check-in. 50% refund within 3-6 days. No refund within 48 hours.",
  },
  features_enabled: {
    check_in: true,
    food_trucks: true,
    local_guide: true,
    push_notifications: true,
    add_ons: true,
    document_uploads: true,
  },
  contact_info: {
    phone: "(512) 555-0147",
    email: "office@sunsetshorresrv.com",
    address: "4200 Lakeview Drive, Canyon Lake, TX 78133",
    emergency_phone: "(512) 555-0911",
  },
  branding: {
    logo_url: "/logo.png",
    primary_color: "#b47a24",
    accent_color: "#fdf8f0",
    welcome_message: "Welcome to Sunset Shores! Enjoy your stay.",
  },
  smart_lock_provider: null,
  smart_lock_config: {},
  created_at: "2024-01-15T00:00:00Z",
};

// ============================================================
// Mock Guest
// ============================================================

export const mockGuest: Guest = {
  id: "guest_001",
  auth_user_id: "auth_abc123",
  newbook_guest_id: "NB-44821",
  email: "mike.henderson@email.com",
  first_name: "Mike",
  last_name: "Henderson",
  phone: "(469) 555-0312",
  address: {
    street: "1842 Elm Creek Blvd",
    city: "Plano",
    state: "TX",
    zip: "75025",
    country: "US",
  },
  preferences: {
    kids_count: 2,
    kids_ages: [7, 11],
    pets: [{ type: "dog", breed: "Golden Retriever", name: "Buddy" }],
    site_preferences: "Pull-through, shaded, near pool",
    special_needs: undefined,
  },
  created_at: "2024-06-10T14:30:00Z",
  updated_at: "2026-03-28T09:15:00Z",
};

// ============================================================
// Mock Bookings
// ============================================================

export const mockBookings: Booking[] = [
  // Past booking
  {
    id: "book_001",
    property_id: "prop_001",
    guest_id: "guest_001",
    newbook_booking_id: "NB-BK-10231",
    status: "checked_out",
    check_in: "2026-01-10T15:00:00Z",
    check_out: "2026-01-17T11:00:00Z",
    site_or_room: "Site A-14",
    booking_type: "rv",
    group_booking_id: null,
    total_amount: 490.0,
    balance_due: 0,
    details: { hookups: "Full (50 amp)", site_type: "Pull-through" },
    synced_at: "2026-01-17T12:00:00Z",
    created_at: "2025-12-01T10:00:00Z",
  },
  // Current booking
  {
    id: "book_002",
    property_id: "prop_001",
    guest_id: "guest_001",
    newbook_booking_id: "NB-BK-10587",
    status: "checked_in",
    check_in: "2026-04-12T15:00:00Z",
    check_out: "2026-04-19T11:00:00Z",
    site_or_room: "Site B-07",
    booking_type: "rv",
    group_booking_id: null,
    total_amount: 595.0,
    balance_due: 245.0,
    details: { hookups: "Full (50 amp)", site_type: "Back-in", lake_view: true },
    synced_at: "2026-04-12T16:00:00Z",
    created_at: "2026-03-05T08:20:00Z",
  },
  // Upcoming booking
  {
    id: "book_003",
    property_id: "prop_001",
    guest_id: "guest_001",
    newbook_booking_id: "NB-BK-11042",
    status: "upcoming",
    check_in: "2026-06-20T15:00:00Z",
    check_out: "2026-06-27T11:00:00Z",
    site_or_room: "Site A-22",
    booking_type: "rv",
    group_booking_id: null,
    total_amount: 665.0,
    balance_due: 665.0,
    details: {
      hookups: "Full (50 amp)",
      site_type: "Pull-through",
      lake_view: true,
    },
    synced_at: "2026-04-10T09:00:00Z",
    created_at: "2026-04-02T14:45:00Z",
  },
];

// ============================================================
// Mock Invoices
// ============================================================

export const mockInvoices: Invoice[] = [
  // Paid invoice for past booking
  {
    id: "inv_001",
    booking_id: "book_001",
    property_id: "prop_001",
    guest_id: "guest_001",
    newbook_invoice_id: "NB-INV-8001",
    amount: 490.0,
    status: "paid",
    due_date: "2026-01-10T00:00:00Z",
    paid_at: "2025-12-28T10:00:00Z",
    description: "Site A-14 — 7 nights (Jan 10-17)",
    line_items: [
      {
        description: "Nightly rate — Pull-through Full Hookup",
        quantity: 7,
        unit_price: 65.0,
        total: 455.0,
      },
      { description: "Pet fee", quantity: 1, unit_price: 35.0, total: 35.0 },
    ],
    synced_at: "2026-01-17T12:00:00Z",
  },
  // Partially paid invoice for current booking
  {
    id: "inv_002",
    booking_id: "book_002",
    property_id: "prop_001",
    guest_id: "guest_001",
    newbook_invoice_id: "NB-INV-8234",
    amount: 595.0,
    status: "partial",
    due_date: "2026-04-12T00:00:00Z",
    paid_at: null,
    description: "Site B-07 — 7 nights (Apr 12-19)",
    line_items: [
      {
        description: "Nightly rate — Back-in Full Hookup (Lake View)",
        quantity: 7,
        unit_price: 75.0,
        total: 525.0,
      },
      { description: "Pet fee", quantity: 1, unit_price: 35.0, total: 35.0 },
      { description: "Pool pass (family)", quantity: 1, unit_price: 35.0, total: 35.0 },
    ],
    synced_at: "2026-04-12T16:00:00Z",
  },
  // Overdue add-on invoice
  {
    id: "inv_003",
    booking_id: "book_002",
    property_id: "prop_001",
    guest_id: "guest_001",
    newbook_invoice_id: "NB-INV-8240",
    amount: 45.0,
    status: "overdue",
    due_date: "2026-04-10T00:00:00Z",
    paid_at: null,
    description: "Firewood delivery + late checkout request",
    line_items: [
      { description: "Firewood bundle (x3)", quantity: 3, unit_price: 10.0, total: 30.0 },
      { description: "Late checkout fee", quantity: 1, unit_price: 15.0, total: 15.0 },
    ],
    synced_at: "2026-04-10T09:00:00Z",
  },
  // Pending invoice for upcoming booking
  {
    id: "inv_004",
    booking_id: "book_003",
    property_id: "prop_001",
    guest_id: "guest_001",
    newbook_invoice_id: "NB-INV-8401",
    amount: 665.0,
    status: "pending",
    due_date: "2026-06-13T00:00:00Z",
    paid_at: null,
    description: "Site A-22 — 7 nights (Jun 20-27)",
    line_items: [
      {
        description: "Nightly rate — Pull-through Full Hookup (Lake View)",
        quantity: 7,
        unit_price: 85.0,
        total: 595.0,
      },
      { description: "Pet fee", quantity: 1, unit_price: 35.0, total: 35.0 },
      { description: "Pool pass (family)", quantity: 1, unit_price: 35.0, total: 35.0 },
    ],
    synced_at: "2026-04-10T09:00:00Z",
  },
];

// ============================================================
// Mock Payment Methods
// ============================================================

export const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "pm_001",
    guest_id: "guest_001",
    type: "credit_card",
    last_four: "4242",
    brand: "Visa",
    is_preferred: true,
    auto_pay_enabled: true,
    newbook_payment_token: null,
    created_at: "2024-06-10T14:35:00Z",
  },
  {
    id: "pm_002",
    guest_id: "guest_001",
    type: "credit_card",
    last_four: "1881",
    brand: "Mastercard",
    is_preferred: false,
    auto_pay_enabled: false,
    newbook_payment_token: null,
    created_at: "2025-08-22T11:00:00Z",
  },
];

// ============================================================
// Mock Documents
// ============================================================

export const mockDocuments: GuestDocument[] = [
  {
    id: "doc_001",
    guest_id: "guest_001",
    property_id: "prop_001",
    type: "insurance",
    label: "RV Insurance — State Farm",
    file_path: "/uploads/guest_001/insurance_2026.pdf",
    expires_at: "2026-04-20T00:00:00Z", // Expiring in 6 days
    uploaded_at: "2025-11-15T09:00:00Z",
    verified_by: "staff_001",
    verified_at: "2025-11-16T10:30:00Z",
  },
  {
    id: "doc_002",
    guest_id: "guest_001",
    property_id: "prop_001",
    type: "registration",
    label: "TX Vehicle Registration",
    file_path: "/uploads/guest_001/registration_2026.pdf",
    expires_at: "2026-09-30T00:00:00Z",
    uploaded_at: "2026-02-01T14:00:00Z",
    verified_by: "staff_001",
    verified_at: "2026-02-02T08:00:00Z",
  },
  {
    id: "doc_003",
    guest_id: "guest_001",
    property_id: "prop_001",
    type: "signed_agreement",
    label: "Park Rules & Regulations Agreement",
    file_path: "/uploads/guest_001/park_rules_signed.pdf",
    expires_at: null,
    uploaded_at: "2024-06-10T15:00:00Z",
    verified_by: "staff_001",
    verified_at: "2024-06-10T15:30:00Z",
  },
  // Unsigned agreement (no file)
  {
    id: "doc_004",
    guest_id: "guest_001",
    property_id: "prop_001",
    type: "signed_agreement",
    label: "2026 Season Pet Policy Addendum",
    file_path: "",
    expires_at: null,
    uploaded_at: "2026-04-01T00:00:00Z",
    verified_by: null,
    verified_at: null,
  },
];

// ============================================================
// Mock Vehicles
// ============================================================

export const mockVehicles: Vehicle[] = [
  {
    id: "veh_001",
    guest_id: "guest_001",
    property_id: "prop_001",
    type: "motorhome",
    make: "Thor",
    model: "Palazzo 33.5",
    year: 2023,
    license_plate: "TX-RV4821",
    length_ft: 34,
    details: { slides: 3, fuel: "diesel" },
    created_at: "2024-06-10T14:40:00Z",
  },
  {
    id: "veh_002",
    guest_id: "guest_001",
    property_id: "prop_001",
    type: "vehicle",
    make: "Ford",
    model: "F-150",
    year: 2022,
    license_plate: "TX-BKN7790",
    length_ft: null,
    details: {},
    created_at: "2024-06-10T14:42:00Z",
  },
];

// ============================================================
// Mock Notifications
// ============================================================

export const mockNotifications: Notification[] = [
  {
    id: "notif_001",
    property_id: "prop_001",
    target_type: "all_guests",
    target_id: null,
    title: "Pool Hours Extended",
    body: "Great news! The pool will now be open until 10 PM on Fridays and Saturdays through the end of summer.",
    channel: "push",
    sent_at: "2026-04-13T09:00:00Z",
    created_by: "staff_001",
    read: false,
  },
  {
    id: "notif_002",
    property_id: "prop_001",
    target_type: "specific_guest",
    target_id: "guest_001",
    title: "Insurance Expiring Soon",
    body: "Your RV insurance document expires on April 20. Please upload a current copy to avoid any issues.",
    channel: "both",
    sent_at: "2026-04-12T08:00:00Z",
    created_by: null,
    read: true,
  },
  {
    id: "notif_003",
    property_id: "prop_001",
    target_type: "specific_guest",
    target_id: "guest_001",
    title: "Booking Confirmed",
    body: "Your reservation for Site A-22 (Jun 20-27) has been confirmed. We look forward to seeing you!",
    channel: "email",
    sent_at: "2026-04-02T15:00:00Z",
    created_by: null,
    read: true,
  },
  {
    id: "notif_004",
    property_id: "prop_001",
    target_type: "all_guests",
    target_id: null,
    title: "Food Truck Friday",
    body: "Smokin' Joe's BBQ will be at the pavilion this Friday from 5-8 PM. Don't miss their brisket tacos!",
    channel: "push",
    sent_at: "2026-04-09T10:00:00Z",
    created_by: "staff_001",
    read: true,
  },
];

// ============================================================
// Mock Activity (derived display data)
// ============================================================

export interface ActivityItem {
  id: string;
  type: "payment" | "booking" | "document" | "checkin" | "notification";
  title: string;
  description: string;
  timestamp: string;
}

export const mockActivity: ActivityItem[] = [
  {
    id: "act_001",
    type: "checkin",
    title: "Checked in",
    description: "Site B-07 — Sunset Shores RV Resort",
    timestamp: "2026-04-12T15:12:00Z",
  },
  {
    id: "act_002",
    type: "payment",
    title: "Payment received",
    description: "$350.00 applied to Site B-07 booking",
    timestamp: "2026-04-11T10:30:00Z",
  },
  {
    id: "act_003",
    type: "booking",
    title: "Booking confirmed",
    description: "Site A-22 — Jun 20 to Jun 27",
    timestamp: "2026-04-02T14:45:00Z",
  },
  {
    id: "act_004",
    type: "document",
    title: "Document uploaded",
    description: "TX Vehicle Registration",
    timestamp: "2026-02-01T14:00:00Z",
  },
  {
    id: "act_005",
    type: "payment",
    title: "Payment received",
    description: "$490.00 — Site A-14 paid in full",
    timestamp: "2025-12-28T10:00:00Z",
  },
];
