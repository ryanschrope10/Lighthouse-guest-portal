"use client";

import { useEffect, useState } from "react";
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
import { Spinner } from "@/components/ui/spinner";
import type {
  Booking,
  BookingStatus,
  Invoice,
  InvoiceStatus,
  ApiResponse,
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
  { label: "Propane Delivery", value: "propane_delivery" },
  { label: "Early Check-in", value: "early_checkin" },
  { label: "Late Checkout", value: "late_checkout" },
  { label: "Extra Cleaning", value: "extra_cleaning" },
];

// ─── Page ────────────────────────────────────────────────────
export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loadState, setLoadState] = useState<
    "loading" | "loaded" | "notfound" | "error"
  >("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/bookings/${params.id}`);
        const json: ApiResponse<Booking> = await res.json();
        if (cancelled) return;
        if (res.status === 404) {
          setLoadState("notfound");
          return;
        }
        if (json.error || !json.data) {
          setLoadState("error");
          return;
        }
        setBooking(json.data);
        setLoadState("loaded");
      } catch {
        if (!cancelled) setLoadState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

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

  if (loadState === "loading") {
    return (
      <div className="mx-auto max-w-3xl">
        <BackButton onClick={() => router.push("/bookings")} />
        <div className="mt-12 flex justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  if (loadState !== "loaded" || !booking) {
    return (
      <div className="mx-auto max-w-3xl">
        <BackButton onClick={() => router.push("/bookings")} />
        <div className="mt-12 text-center">
          <p className="text-base font-semibold text-sand-900">
            {loadState === "notfound"
              ? "Booking not found"
              : "Couldn't load this booking"}
          </p>
          <p className="mt-1 text-sm text-sand-500">
            {loadState === "notfound"
              ? "This booking may have been removed or the link is incorrect."
              : "There was a problem reaching the booking service. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  const badge = bookingStatusBadge[booking.status];
  const isActive =
    booking.status === "upcoming" || booking.status === "checked_in";

  return (
    <div className="mx-auto max-w-3xl">
      <BackButton onClick={() => router.push("/bookings")} />

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
            value={format(
              parseISO(booking.check_in),
              "EEE, MMM d, yyyy 'at' h:mm a",
            )}
          />
          <InfoRow
            icon={CalendarDays}
            label="Check-out"
            value={format(
              parseISO(booking.check_out),
              "EEE, MMM d, yyyy 'at' h:mm a",
            )}
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

        {!booking.invoices || booking.invoices.length === 0 ? (
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
                onClick={() => setExtendSubmitted(true)}
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
              <Button
                variant="danger"
                onClick={() => setCancelConfirmed(true)}
              >
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
                onClick={() => setAddonSubmitted(true)}
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
              options={ADDON_OPTIONS}
              placeholder="Select an add-on..."
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm font-medium text-gold-700 hover:text-gold-800 transition-colors min-h-[44px]"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Bookings
    </button>
  );
}

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
