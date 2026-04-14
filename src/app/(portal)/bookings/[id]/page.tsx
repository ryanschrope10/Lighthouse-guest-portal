"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  CalendarPlus,
  XCircle,
  PackagePlus,
  CreditCard,
  MapPin,
  CalendarDays,
  Home,
  AlertTriangle,
  Check,
} from "lucide-react";
import clsx from "clsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import type {
  Booking,
  BookingStatus,
  Invoice,
  InvoiceStatus,
  Property,
} from "@/types/index";

// ─── Status helpers ──────────────────────────────────────────
const bookingStatusBadge: Record<
  BookingStatus,
  { label: string; status: "info" | "success" | "neutral" | "danger" }
> = {
  upcoming: { label: "Upcoming", status: "info" },
  checked_in: { label: "Checked In", status: "success" },
  checked_out: { label: "Checked Out", status: "neutral" },
  cancelled: { label: "Cancelled", status: "danger" },
};

const invoiceStatusBadge: Record<
  InvoiceStatus,
  { label: string; status: "info" | "success" | "warning" | "danger" }
> = {
  pending: { label: "Pending", status: "warning" },
  paid: { label: "Paid", status: "success" },
  overdue: { label: "Overdue", status: "danger" },
  partial: { label: "Partial", status: "info" },
};

const bookingTypeLabels: Record<string, string> = {
  rv: "RV Site",
  motel: "Motel Room",
  cabin: "Cabin",
  mobile_home: "Mobile Home",
  other: "Other",
};

const ADDON_OPTIONS = [
  { label: "Select an add-on...", value: "" },
  { label: "Propane Delivery", value: "propane_delivery" },
  { label: "Early Check-in", value: "early_checkin" },
  { label: "Late Checkout", value: "late_checkout" },
  { label: "Extra Cleaning", value: "extra_cleaning" },
];

// ─── Mock Data (same bookings as listing) ────────────────────
const MOCK_PROPERTY: Property = {
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
};

const MOCK_BOOKINGS: Record<string, Booking> = {
  "bk-001": {
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
    property: MOCK_PROPERTY,
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
  "bk-002": {
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
    property: MOCK_PROPERTY,
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
  "bk-003": {
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
    property: MOCK_PROPERTY,
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
  "bk-004": {
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
    property: MOCK_PROPERTY,
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
  "bk-005": {
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
    property: MOCK_PROPERTY,
    invoices: [],
  },
};

// ─── Page ────────────────────────────────────────────────────
export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const booking = MOCK_BOOKINGS[params.id];

  // Extend stay
  const [showExtend, setShowExtend] = useState(false);
  const [newCheckout, setNewCheckout] = useState("");
  const [extendSubmitted, setExtendSubmitted] = useState(false);

  // Cancel booking
  const [showCancel, setShowCancel] = useState(false);
  const [cancelConfirmed, setCancelConfirmed] = useState(false);

  // Add-on request
  const [showAddon, setShowAddon] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState("");
  const [addonSubmitted, setAddonSubmitted] = useState(false);

  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => router.push("/bookings")}
          className="flex items-center gap-1.5 text-sm font-medium text-gold-700 hover:text-gold-800 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bookings
        </button>
        <div className="mt-12 text-center">
          <p className="text-base font-semibold text-sand-900">
            Booking not found
          </p>
          <p className="mt-1 text-sm text-sand-500">
            This booking may have been removed or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  const badge = bookingStatusBadge[booking.status];
  const isActive =
    booking.status === "upcoming" || booking.status === "checked_in";

  function handleExtendSubmit() {
    setExtendSubmitted(true);
    // In production: call API to extend stay
  }

  function handleCancelConfirm() {
    setCancelConfirmed(true);
    // In production: call API to cancel booking
  }

  function handleAddonSubmit() {
    setAddonSubmitted(true);
    // In production: call API to request add-on
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Back button */}
      <button
        onClick={() => router.push("/bookings")}
        className="flex items-center gap-1.5 text-sm font-medium text-gold-700 hover:text-gold-800 transition-colors min-h-[44px]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Bookings
      </button>

      {/* ── Header ── */}
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <Badge status={badge.status}>{badge.label}</Badge>
        <span className="text-sm text-sand-500 capitalize">
          {bookingTypeLabels[booking.booking_type] ?? booking.booking_type}
        </span>
      </div>

      <h1 className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">
        {booking.property?.name ?? "Property"}
      </h1>

      {/* ── Booking Info ── */}
      <Card className="mt-5">
        <CardBody className="space-y-3">
          <InfoRow
            icon={MapPin}
            label="Property"
            value={booking.property?.name ?? "N/A"}
          />
          <InfoRow
            icon={Home}
            label="Site / Room"
            value={booking.site_or_room ?? "N/A"}
          />
          <InfoRow
            icon={CalendarDays}
            label="Check-in"
            value={format(parseISO(booking.check_in), "EEE, MMM d, yyyy 'at' h:mm a")}
          />
          <InfoRow
            icon={CalendarDays}
            label="Check-out"
            value={format(parseISO(booking.check_out), "EEE, MMM d, yyyy 'at' h:mm a")}
          />
          <InfoRow
            icon={Home}
            label="Booking Type"
            value={
              bookingTypeLabels[booking.booking_type] ?? booking.booking_type
            }
          />
        </CardBody>
      </Card>

      {/* ── Invoices ── */}
      <section className="mt-6">
        <h2 className="text-base font-semibold text-gray-900">Invoices</h2>

        {(!booking.invoices || booking.invoices.length === 0) ? (
          <p className="mt-3 text-sm text-sand-500">
            No invoices for this booking.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {booking.invoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} />
            ))}
          </div>
        )}
      </section>

      {/* ── Balance ── */}
      <Card className="mt-6">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-sand-600">Total Balance Due</p>
              <p
                className={clsx(
                  "mt-0.5 text-2xl font-bold",
                  booking.balance_due > 0 ? "text-gold-600" : "text-gray-900",
                )}
              >
                ${booking.balance_due.toFixed(2)}
              </p>
            </div>
            {booking.balance_due > 0 && (
              <Button size="md">
                <CreditCard className="h-4 w-4" />
                Pay Full Balance
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* ── Actions ── */}
      {isActive && (
        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">Actions</h2>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              variant="secondary"
              onClick={() => {
                setShowExtend(true);
                setExtendSubmitted(false);
                setNewCheckout("");
              }}
            >
              <CalendarPlus className="h-4 w-4" />
              Extend Stay
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setShowCancel(true);
                setCancelConfirmed(false);
              }}
            >
              <XCircle className="h-4 w-4" />
              Cancel Booking
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddon(true);
                setAddonSubmitted(false);
                setSelectedAddon("");
              }}
            >
              <PackagePlus className="h-4 w-4" />
              Request Add-on
            </Button>
          </div>
        </section>
      )}

      {/* ── Extend Stay Modal ── */}
      <Modal
        open={showExtend}
        onClose={() => setShowExtend(false)}
        title="Extend Your Stay"
        footer={
          !extendSubmitted ? (
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowExtend(false)}>
                Cancel
              </Button>
              <Button
                disabled={!newCheckout}
                onClick={handleExtendSubmit}
              >
                Confirm Extension
              </Button>
            </div>
          ) : undefined
        }
      >
        {extendSubmitted ? (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="mt-3 text-base font-semibold text-gray-900">
              Extension Requested
            </p>
            <p className="mt-1 text-sm text-sand-500">
              Your request to extend your stay has been submitted. You will
              receive a confirmation shortly.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-sand-600">
              Current check-out:{" "}
              <span className="font-medium text-gray-900">
                {format(parseISO(booking.check_out), "EEE, MMM d, yyyy")}
              </span>
            </p>
            <Input
              type="date"
              label="New Check-out Date"
              value={newCheckout}
              onChange={(e) => setNewCheckout(e.target.value)}
              min={format(parseISO(booking.check_out), "yyyy-MM-dd")}
            />
          </div>
        )}
      </Modal>

      {/* ── Cancel Booking Modal ── */}
      <Modal
        open={showCancel}
        onClose={() => setShowCancel(false)}
        title="Cancel Booking"
        footer={
          !cancelConfirmed ? (
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowCancel(false)}>
                Keep Booking
              </Button>
              <Button variant="danger" onClick={handleCancelConfirm}>
                Confirm Cancellation
              </Button>
            </div>
          ) : undefined
        }
      >
        {cancelConfirmed ? (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <p className="mt-3 text-base font-semibold text-gray-900">
              Booking Cancelled
            </p>
            <p className="mt-1 text-sm text-sand-500">
              Your booking has been cancelled. Any eligible refund will be
              processed within 5-7 business days.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Cancellation Policy
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  {booking.property?.cancellation_policy.policy_text ??
                    "Please contact the property for cancellation details."}
                </p>
              </div>
            </div>
            <p className="text-sm text-sand-600">
              Are you sure you want to cancel your booking at{" "}
              <span className="font-medium text-gray-900">
                {booking.site_or_room}
              </span>{" "}
              for{" "}
              <span className="font-medium text-gray-900">
                {format(parseISO(booking.check_in), "MMM d")} -{" "}
                {format(parseISO(booking.check_out), "MMM d, yyyy")}
              </span>
              ?
            </p>
          </div>
        )}
      </Modal>

      {/* ── Request Add-on Modal ── */}
      <Modal
        open={showAddon}
        onClose={() => setShowAddon(false)}
        title="Request an Add-on"
        footer={
          !addonSubmitted ? (
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowAddon(false)}>
                Cancel
              </Button>
              <Button
                disabled={!selectedAddon}
                onClick={handleAddonSubmit}
              >
                Submit Request
              </Button>
            </div>
          ) : undefined
        }
      >
        {addonSubmitted ? (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="mt-3 text-base font-semibold text-gray-900">
              Add-on Requested
            </p>
            <p className="mt-1 text-sm text-sand-500">
              Your add-on request has been submitted. The property team will
              follow up with you shortly.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-sand-600">
              Select the type of add-on you would like to request for your
              stay.
            </p>
            <Select
              label="Add-on Type"
              value={selectedAddon}
              onChange={(e) => setSelectedAddon(e.target.value)}
              options={ADDON_OPTIONS.slice(1)}
              placeholder="Select an add-on..."
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-sand-400" />
      <div className="min-w-0">
        <p className="text-xs text-sand-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const invBadge = invoiceStatusBadge[invoice.status];
  const isPayable =
    invoice.status === "pending" ||
    invoice.status === "overdue" ||
    invoice.status === "partial";

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {invoice.description ?? "Invoice"}
            </p>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <Badge status={invBadge.status}>{invBadge.label}</Badge>
              {invoice.due_date && (
                <span className="text-xs text-sand-500">
                  Due {format(parseISO(invoice.due_date), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <p className="text-base font-semibold text-gray-900">
              ${invoice.amount.toFixed(2)}
            </p>
            {isPayable && (
              <Button size="sm">
                <CreditCard className="h-3.5 w-3.5" />
                Pay
              </Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
