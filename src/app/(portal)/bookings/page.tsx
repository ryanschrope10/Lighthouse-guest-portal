"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { BookingCard } from "@/components/booking-card";
import type { Booking } from "@/types/index";

// ─── Mock Data ───────────────────────────────────────────────
const MOCK_BOOKINGS: Booking[] = [
  {
    id: "bk-001",
    property_id: "prop-1",
    guest_id: "guest-1",
    newbook_booking_id: "NB-1001",
    status: "upcoming",
    check_in: "2026-05-10T15:00:00Z",
    check_out: "2026-05-17T11:00:00Z",
    site_or_room: "RV Site #42",
    booking_type: "rv",
    group_booking_id: null,
    total_amount: 595.0,
    balance_due: 297.5,
    details: {},
    synced_at: "2026-04-10T12:00:00Z",
    created_at: "2026-03-01T10:00:00Z",
    property: {
      id: "prop-1",
      name: "Lakeside RV Resort",
      slug: "lakeside-rv",
      newbook_instance_url: null,
      newbook_api_key: null,
      timezone: "America/Chicago",
      cancellation_policy: {
        refund_eligible: true,
        cutoff_days: 7,
        policy_text:
          "Full refund if cancelled 7+ days before check-in. 50% refund within 3-7 days. No refund within 3 days.",
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
        phone: "(555) 123-4567",
        email: "info@lakesiderv.com",
      },
      smart_lock_provider: null,
      smart_lock_config: {},
      branding: {},
      created_at: "2025-01-01T00:00:00Z",
    },
    invoices: [
      {
        id: "inv-001",
        booking_id: "bk-001",
        property_id: "prop-1",
        guest_id: "guest-1",
        newbook_invoice_id: null,
        amount: 297.5,
        status: "paid",
        due_date: "2026-03-15T00:00:00Z",
        paid_at: "2026-03-14T09:30:00Z",
        description: "Deposit - RV Site #42",
        line_items: [
          {
            description: "Site rental deposit",
            quantity: 1,
            unit_price: 297.5,
            total: 297.5,
          },
        ],
        synced_at: "2026-04-10T12:00:00Z",
      },
      {
        id: "inv-002",
        booking_id: "bk-001",
        property_id: "prop-1",
        guest_id: "guest-1",
        newbook_invoice_id: null,
        amount: 297.5,
        status: "pending",
        due_date: "2026-05-01T00:00:00Z",
        paid_at: null,
        description: "Balance - RV Site #42",
        line_items: [
          {
            description: "Remaining site rental",
            quantity: 1,
            unit_price: 297.5,
            total: 297.5,
          },
        ],
        synced_at: "2026-04-10T12:00:00Z",
      },
    ],
  },
  {
    id: "bk-002",
    property_id: "prop-1",
    guest_id: "guest-1",
    newbook_booking_id: "NB-1002",
    status: "upcoming",
    check_in: "2026-06-20T15:00:00Z",
    check_out: "2026-06-27T11:00:00Z",
    site_or_room: "Cabin 7 - Lakeview",
    booking_type: "cabin",
    group_booking_id: null,
    total_amount: 1190.0,
    balance_due: 1190.0,
    details: {},
    synced_at: "2026-04-10T12:00:00Z",
    created_at: "2026-04-05T14:00:00Z",
    property: {
      id: "prop-1",
      name: "Lakeside RV Resort",
      slug: "lakeside-rv",
      newbook_instance_url: null,
      newbook_api_key: null,
      timezone: "America/Chicago",
      cancellation_policy: {
        refund_eligible: true,
        cutoff_days: 7,
        policy_text:
          "Full refund if cancelled 7+ days before check-in. 50% refund within 3-7 days. No refund within 3 days.",
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
        phone: "(555) 123-4567",
        email: "info@lakesiderv.com",
      },
      smart_lock_provider: null,
      smart_lock_config: {},
      branding: {},
      created_at: "2025-01-01T00:00:00Z",
    },
    invoices: [
      {
        id: "inv-003",
        booking_id: "bk-002",
        property_id: "prop-1",
        guest_id: "guest-1",
        newbook_invoice_id: null,
        amount: 1190.0,
        status: "pending",
        due_date: "2026-06-10T00:00:00Z",
        paid_at: null,
        description: "Full stay - Cabin 7",
        line_items: [
          {
            description: "Cabin rental (7 nights)",
            quantity: 7,
            unit_price: 170.0,
            total: 1190.0,
          },
        ],
        synced_at: "2026-04-10T12:00:00Z",
      },
    ],
  },
  {
    id: "bk-003",
    property_id: "prop-1",
    guest_id: "guest-1",
    newbook_booking_id: "NB-1003",
    status: "checked_in",
    check_in: "2026-04-12T15:00:00Z",
    check_out: "2026-04-19T11:00:00Z",
    site_or_room: "RV Site #18 - Pull-through",
    booking_type: "rv",
    group_booking_id: null,
    total_amount: 490.0,
    balance_due: 0,
    details: {},
    synced_at: "2026-04-12T15:30:00Z",
    created_at: "2026-03-20T08:00:00Z",
    property: {
      id: "prop-1",
      name: "Lakeside RV Resort",
      slug: "lakeside-rv",
      newbook_instance_url: null,
      newbook_api_key: null,
      timezone: "America/Chicago",
      cancellation_policy: {
        refund_eligible: true,
        cutoff_days: 7,
        policy_text:
          "Full refund if cancelled 7+ days before check-in. 50% refund within 3-7 days. No refund within 3 days.",
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
        phone: "(555) 123-4567",
        email: "info@lakesiderv.com",
      },
      smart_lock_provider: null,
      smart_lock_config: {},
      branding: {},
      created_at: "2025-01-01T00:00:00Z",
    },
    invoices: [
      {
        id: "inv-004",
        booking_id: "bk-003",
        property_id: "prop-1",
        guest_id: "guest-1",
        newbook_invoice_id: null,
        amount: 490.0,
        status: "paid",
        due_date: "2026-04-01T00:00:00Z",
        paid_at: "2026-03-30T10:15:00Z",
        description: "Full stay - RV Site #18",
        line_items: [
          {
            description: "Site rental (7 nights)",
            quantity: 7,
            unit_price: 70.0,
            total: 490.0,
          },
        ],
        synced_at: "2026-04-10T12:00:00Z",
      },
    ],
  },
  {
    id: "bk-004",
    property_id: "prop-1",
    guest_id: "guest-1",
    newbook_booking_id: "NB-1004",
    status: "checked_out",
    check_in: "2026-02-14T15:00:00Z",
    check_out: "2026-02-21T11:00:00Z",
    site_or_room: "Motel Room 12",
    booking_type: "motel",
    group_booking_id: null,
    total_amount: 665.0,
    balance_due: 0,
    details: {},
    synced_at: "2026-02-21T12:00:00Z",
    created_at: "2026-01-15T16:00:00Z",
    property: {
      id: "prop-1",
      name: "Lakeside RV Resort",
      slug: "lakeside-rv",
      newbook_instance_url: null,
      newbook_api_key: null,
      timezone: "America/Chicago",
      cancellation_policy: {
        refund_eligible: true,
        cutoff_days: 7,
        policy_text:
          "Full refund if cancelled 7+ days before check-in. 50% refund within 3-7 days. No refund within 3 days.",
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
        phone: "(555) 123-4567",
        email: "info@lakesiderv.com",
      },
      smart_lock_provider: null,
      smart_lock_config: {},
      branding: {},
      created_at: "2025-01-01T00:00:00Z",
    },
    invoices: [
      {
        id: "inv-005",
        booking_id: "bk-004",
        property_id: "prop-1",
        guest_id: "guest-1",
        newbook_invoice_id: null,
        amount: 665.0,
        status: "paid",
        due_date: "2026-02-01T00:00:00Z",
        paid_at: "2026-01-30T11:00:00Z",
        description: "Full stay - Motel Room 12",
        line_items: [
          {
            description: "Room rental (7 nights)",
            quantity: 7,
            unit_price: 95.0,
            total: 665.0,
          },
        ],
        synced_at: "2026-02-21T12:00:00Z",
      },
    ],
  },
  {
    id: "bk-005",
    property_id: "prop-1",
    guest_id: "guest-1",
    newbook_booking_id: "NB-1005",
    status: "cancelled",
    check_in: "2026-03-05T15:00:00Z",
    check_out: "2026-03-10T11:00:00Z",
    site_or_room: "RV Site #31",
    booking_type: "rv",
    group_booking_id: null,
    total_amount: 350.0,
    balance_due: 0,
    details: {},
    synced_at: "2026-03-01T09:00:00Z",
    created_at: "2026-02-10T12:00:00Z",
    property: {
      id: "prop-1",
      name: "Lakeside RV Resort",
      slug: "lakeside-rv",
      newbook_instance_url: null,
      newbook_api_key: null,
      timezone: "America/Chicago",
      cancellation_policy: {
        refund_eligible: true,
        cutoff_days: 7,
        policy_text:
          "Full refund if cancelled 7+ days before check-in. 50% refund within 3-7 days. No refund within 3 days.",
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
        phone: "(555) 123-4567",
        email: "info@lakesiderv.com",
      },
      smart_lock_provider: null,
      smart_lock_config: {},
      branding: {},
      created_at: "2025-01-01T00:00:00Z",
    },
    invoices: [],
  },
];

// ─── Helpers ─────────────────────────────────────────────────
function filterBookings(
  bookings: Booking[],
  tab: string,
): Booking[] {
  switch (tab) {
    case "upcoming":
      return bookings.filter((b) => b.status === "upcoming");
    case "current":
      return bookings.filter((b) => b.status === "checked_in");
    case "past":
      return bookings.filter(
        (b) => b.status === "checked_out" || b.status === "cancelled",
      );
    default:
      return bookings;
  }
}

const TABS = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Current", value: "current" },
  { label: "Past", value: "past" },
];

const EMPTY_MESSAGES: Record<string, string> = {
  upcoming: "No upcoming bookings",
  current: "No current bookings",
  past: "No past bookings",
};

// ─── Page ────────────────────────────────────────────────────
export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState("upcoming");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
        My Bookings
      </h1>

      <div className="mt-4">
        <Tabs
          tabs={TABS}
          value={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {TABS.map((tab) => (
        <TabPanel key={tab.value} value={tab.value} activeValue={activeTab}>
          <BookingList
            bookings={filterBookings(MOCK_BOOKINGS, tab.value)}
            emptyMessage={EMPTY_MESSAGES[tab.value]}
          />
        </TabPanel>
      ))}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────
function BookingList({
  bookings,
  emptyMessage,
}: {
  bookings: Booking[];
  emptyMessage: string;
}) {
  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title={emptyMessage}
        description="When you have bookings they will appear here."
      />
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {bookings.map((booking) => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  );
}
