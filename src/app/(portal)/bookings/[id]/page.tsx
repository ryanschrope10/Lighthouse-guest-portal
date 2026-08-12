"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  Clock,
  Truck,
  Users,
  Repeat,
  CalendarClock,
  FileWarning,
  ChevronRight,
  Mail,
  AlertCircle,
} from "lucide-react";
import clsx from "clsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { ReviewFlow } from "@/components/reviews/review-flow";
import { RequestLateCheckout } from "@/components/addons/request-late-checkout";
import { RequestExtension } from "@/components/addons/request-extension";
import { AddonMarketplace } from "@/components/addons/addon-marketplace";
import { LockCodeCard } from "@/components/lock-codes/lock-code-card";
import { CheckinReminder } from "@/components/lock-codes/checkin-reminder";
import { SignatureStatusCard } from "@/components/signature-status/signature-status-card";
import { InvoiceDetailModal } from "@/components/invoice-detail-modal";
import { useGuest } from "@/lib/context/guest-context";
import type {
  Booking,
  BookingStatus,
  Invoice,
  InvoiceStatus,
  ApiResponse,
  BookingEquipment,
  BookingGuestSummary,
  RecurringCharge,
  PaymentPlan,
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

// Lodging accommodations have a door/lock and therefore an access code.
// RV sites (and anything not explicitly lodging) don't, so the access-code
// card is hidden for them.
const LODGING_BOOKING_TYPES: Booking["booking_type"][] = [
  "motel",
  "cabin",
  "mobile_home",
];

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

  // Cancel booking (staff-approval request — not an immediate cancel)
  const [showCancel, setShowCancel] = useState(false);
  const [cancelState, setCancelState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  async function submitCancellation() {
    if (!booking) return;
    setCancelState("submitting");
    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json: ApiResponse<unknown> = await res.json().catch(() => ({
        data: null,
        error: "Something went wrong.",
      }));
      if (!res.ok || json.error) {
        setCancelState("error");
        return;
      }
      setCancelState("success");
    } catch {
      setCancelState("error");
    }
  }

  // Add-on request
  const [showAddon, setShowAddon] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState("");
  const [addonSubmitted, setAddonSubmitted] = useState(false);

  // Invoice detail (itemized + print) — same modal the Payments tab uses.
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { guest, property } = useGuest();

  // Pay — emails a secure Newbook payment link for this booking, the same flow
  // the Payments tab uses. The link covers the booking's balance, so every Pay
  // button here (per-invoice or full balance) hits the same endpoint.
  const [paying, setPaying] = useState(false);
  const [payNotice, setPayNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function requestPayLink() {
    if (!booking || paying) return;
    setPaying(true);
    setPayNotice(null);
    try {
      const res = await fetch(
        `/api/bookings/${encodeURIComponent(booking.id)}/pay-link`,
        { method: "POST" },
      );
      const json: ApiResponse<unknown> = await res.json().catch(() => ({
        data: null,
        error: "We couldn't send your payment link.",
      }));
      if (!res.ok || json.error) {
        setPayNotice({
          type: "error",
          text: json.error ?? "We couldn't send your payment link.",
        });
        return;
      }
      setPayNotice({
        type: "success",
        text: `We've emailed you a secure payment link for ${booking.site_or_room}. Check your inbox to pay online.`,
      });
    } catch {
      setPayNotice({ type: "error", text: "Could not reach the server." });
    } finally {
      setPaying(false);
    }
  }

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

      <div className="mt-4 space-y-3">
        <CheckinReminder booking={booking} />
        <SignatureStatusCard booking={booking} />
        {LODGING_BOOKING_TYPES.includes(booking.booking_type) && (
          <LockCodeCard booking={booking} />
        )}
        {booking.required_checkin_document_ids &&
          booking.required_checkin_document_ids.length > 0 && (
            <RequiredDocsCallout
              count={booking.required_checkin_document_ids.length}
            />
          )}
      </div>

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
          {formatEta(booking.eta) && (
            <InfoRow
              icon={Clock}
              label="Expected Arrival"
              value={formatEta(booking.eta)!}
            />
          )}
          <InfoRow
            icon={Home}
            label="Booking Type"
            value={
              bookingTypeLabels[booking.booking_type] ?? booking.booking_type
            }
          />
        </CardBody>
      </Card>

      {/* ── Your Rig ── */}
      {booking.equipment && booking.equipment.length > 0 && (
        <RigCard equipment={booking.equipment} />
      )}

      {/* ── Additional Guests ── */}
      {booking.additional_guests && booking.additional_guests.length > 0 && (
        <AdditionalGuestsCard guests={booking.additional_guests} />
      )}

      {/* ── Invoices ── */}
      <section className="mt-6">
        <h2 className="text-base font-semibold text-gray-900">Invoices</h2>

        {!booking.invoices || booking.invoices.length === 0 ? (
          <p className="mt-3 text-sm text-sand-500">
            No invoices for this booking.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-sand-500">
              Tap an invoice to see the itemized detail or print it.
            </p>
            <div className="mt-3 flex flex-col gap-3">
              {booking.invoices.map((invoice) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  paying={paying}
                  onPay={requestPayLink}
                  onView={() =>
                    setSelectedInvoice({
                      ...invoice,
                      // Give the modal the reservation context it prints, minus
                      // the nested invoice list (avoids a self-referencing loop).
                      booking: { ...booking, invoices: [] },
                    })
                  }
                />
              ))}
            </div>
          </>
        )}
      </section>

      {payNotice && <PayNotice notice={payNotice} />}

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
              <Button
                size="md"
                disabled={paying}
                loading={paying}
                onClick={requestPayLink}
              >
                <CreditCard className="h-4 w-4" />
                Pay Full Balance
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* ── Recurring Charges ── */}
      {booking.recurring_charges && booking.recurring_charges.length > 0 && (
        <RecurringChargesCard charges={booking.recurring_charges} />
      )}

      {/* ── Payment Schedule ── */}
      {booking.payment_plans && booking.payment_plans.length > 0 && (
        <PaymentPlansCard plans={booking.payment_plans} />
      )}

      {booking.status === "checked_out" && (
        <div className="mt-6">
          <ReviewFlow bookingId={booking.id} title="How was your stay?" />
        </div>
      )}

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
                setCancelState("idle");
              }}
            >
              <XCircle className="h-4 w-4" />
              Request Cancellation
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

      {isActive && (
        <section className="mt-6 space-y-3">
          <h2 className="text-base font-semibold text-gray-900">
            Add-ons & Requests
          </h2>
          <RequestLateCheckout
            bookingId={booking.id}
            checkOutIso={booking.check_out}
          />
          <RequestExtension
            bookingId={booking.id}
            checkOutIso={booking.check_out}
          />
          <AddonMarketplace bookingId={booking.id} />
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

      {/* ── Request Cancellation Modal ── */}
      <Modal
        open={showCancel}
        onClose={() => setShowCancel(false)}
        title="Request Cancellation"
        footer={
          cancelState === "idle" || cancelState === "submitting" ? (
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowCancel(false)}
                disabled={cancelState === "submitting"}
              >
                Keep Booking
              </Button>
              <Button
                variant="danger"
                onClick={submitCancellation}
                disabled={cancelState === "submitting"}
              >
                {cancelState === "submitting"
                  ? "Requesting…"
                  : "Request Cancellation"}
              </Button>
            </div>
          ) : cancelState === "error" ? (
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowCancel(false)}>
                Close
              </Button>
              <Button variant="danger" onClick={submitCancellation}>
                Try Again
              </Button>
            </div>
          ) : undefined
        }
      >
        {cancelState === "success" ? (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="mt-3 text-base font-semibold text-gray-900">
              Cancellation Requested
            </p>
            <p className="mt-1 text-sm text-sand-500">
              The front desk will confirm your cancellation shortly. Your
              booking stays active until they do.
            </p>
          </div>
        ) : cancelState === "error" ? (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <p className="mt-3 text-base font-semibold text-gray-900">
              Couldn&apos;t submit your request
            </p>
            <p className="mt-1 text-sm text-sand-500">
              Something went wrong sending your cancellation request. Please
              try again, or contact the front desk.
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
              Request to cancel your booking at{" "}
              <span className="font-medium text-gray-900">
                {booking.site_or_room}
              </span>{" "}
              for{" "}
              <span className="font-medium text-gray-900">
                {format(parseISO(booking.check_in), "MMM d")} -{" "}
                {format(parseISO(booking.check_out), "MMM d, yyyy")}
              </span>
              ? The front desk will review and confirm — your booking stays
              active until then.
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

      {/* ── Invoice Detail (itemized + print) ── */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          guestName={
            [guest?.first_name, guest?.last_name].filter(Boolean).join(" ") ||
            null
          }
          guestEmail={guest?.email ?? null}
          property={property}
          onClose={() => setSelectedInvoice(null)}
          onPay={() => {
            setSelectedInvoice(null);
            requestPayLink();
          }}
          paying={paying}
        />
      )}
    </div>
  );
}

// ─── Formatting helpers ──────────────────────────────────────
function safeFormat(
  iso: string | null | undefined,
  fmt: string,
): string | null {
  if (!iso) return null;
  try {
    return format(parseISO(iso), fmt);
  } catch {
    return null;
  }
}

// Newbook ETA may arrive as a full datetime OR a bare "HH:MM:SS" time.
// parseISO can't handle time-only, so format that case directly.
function formatEta(eta: string | null | undefined): string | null {
  if (!eta) return null;
  const timeOnly = eta.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (timeOnly) {
    let h = Number(timeOnly[1]);
    const m = timeOnly[2];
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }
  return safeFormat(eta, "h:mm a");
}

function money(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function statusBadgeFor(
  status: string | null | undefined,
): "success" | "warning" | "danger" | "info" | "neutral" {
  const s = (status ?? "").toLowerCase();
  if (s.includes("paid") || s.includes("complete") || s.includes("active"))
    return "success";
  if (s.includes("overdue") || s.includes("failed") || s.includes("cancel"))
    return "danger";
  if (s.includes("pending") || s.includes("due") || s.includes("upcoming"))
    return "warning";
  return "neutral";
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

function InvoiceRow({
  invoice,
  onView,
  onPay,
  paying = false,
}: {
  invoice: Invoice;
  onView?: () => void;
  onPay?: () => void;
  paying?: boolean;
}) {
  const invBadge = invoiceStatusBadge[invoice.status];
  const isPayable =
    invoice.status === "pending" ||
    invoice.status === "overdue" ||
    invoice.status === "partial";

  return (
    <Card
      onClick={onView}
      role={onView ? "button" : undefined}
      tabIndex={onView ? 0 : undefined}
      onKeyDown={
        onView
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onView();
              }
            }
          : undefined
      }
      className={clsx(
        onView &&
          "cursor-pointer transition-colors hover:border-gold-300 hover:bg-sand-50/50",
      )}
    >
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
            <div className="flex items-center gap-1.5">
              <p className="text-base font-semibold text-gray-900">
                ${invoice.amount.toFixed(2)}
              </p>
              {onView && (
                <ChevronRight className="h-4 w-4 shrink-0 text-sand-400" />
              )}
            </div>
            {isPayable && onPay && (
              <Button
                size="sm"
                disabled={paying}
                loading={paying}
                onClick={(e) => {
                  e.stopPropagation();
                  onPay();
                }}
              >
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

function PayNotice({
  notice,
}: {
  notice: { type: "success" | "error"; text: string };
}) {
  const ok = notice.type === "success";
  return (
    <div
      className={clsx(
        "mt-4 flex items-start gap-3 rounded-xl border p-4",
        ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50",
      )}
    >
      {ok ? (
        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
      ) : (
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
      )}
      <p className={clsx("text-sm", ok ? "text-green-800" : "text-red-700")}>
        {notice.text}
      </p>
    </div>
  );
}

function RequiredDocsCallout({ count }: { count: number }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <FileWarning className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-amber-800">
          Documents required at check-in
        </p>
        <p className="mt-1 text-sm text-amber-700">
          This booking requires {count} document{count === 1 ? "" : "s"} to be
          completed before check-in. Please upload{" "}
          {count === 1 ? "it" : "them"} under{" "}
          <Link
            href="/documents"
            className="font-medium text-amber-800 underline hover:text-amber-900"
          >
            Documents
          </Link>{" "}
          or bring {count === 1 ? "it" : "them"} with you.
        </p>
      </div>
    </div>
  );
}

function RigCard({ equipment }: { equipment: BookingEquipment[] }) {
  return (
    <Card className="mt-5">
      <CardBody>
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-sand-400" />
          <h2 className="text-base font-semibold text-gray-900">Your Rig</h2>
        </div>
        <div className="mt-3 space-y-4">
          {equipment.map((rig, i) => (
            <RigItem key={i} rig={rig} showDivider={i > 0} />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function RigItem({
  rig,
  showDivider,
}: {
  rig: BookingEquipment;
  showDivider: boolean;
}) {
  const title =
    rig.name ??
    [rig.make, rig.model].filter(Boolean).join(" ") ??
    "Equipment";
  const dims = [
    rig.length_ft != null ? `${rig.length_ft} ft L` : null,
    rig.width_ft != null ? `${rig.width_ft} ft W` : null,
    rig.height_ft != null ? `${rig.height_ft} ft H` : null,
  ]
    .filter(Boolean)
    .join(" × ");
  const regExpiry = safeFormat(rig.registration_expires, "MMM d, yyyy");

  return (
    <div
      className={clsx(
        showDivider && "border-t border-sand-100 pt-4",
      )}
    >
      <p className="text-sm font-medium text-gray-900">
        {title || "Equipment"}
      </p>
      <div className="mt-1.5 space-y-1">
        {rig.type && (
          <RigDetail label="Type" value={rig.type} />
        )}
        {dims && <RigDetail label="Dimensions" value={dims} />}
        {rig.slideouts && (
          <RigDetail label="Slide-outs" value={rig.slideouts} />
        )}
        {rig.registration && (
          <RigDetail
            label="Registration"
            value={
              regExpiry
                ? `${rig.registration} (expires ${regExpiry})`
                : rig.registration
            }
          />
        )}
      </div>
    </div>
  );
}

function RigDetail({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm text-sand-600">
      <span className="text-sand-500">{label}:</span>{" "}
      <span className="font-medium text-gray-900">{value}</span>
    </p>
  );
}

function AdditionalGuestsCard({
  guests,
}: {
  guests: BookingGuestSummary[];
}) {
  return (
    <Card className="mt-5">
      <CardBody>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-sand-400" />
          <h2 className="text-base font-semibold text-gray-900">
            Who&apos;s Staying
          </h2>
        </div>
        <ul className="mt-3 space-y-2">
          {guests.map((g, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="font-medium text-gray-900">{g.name}</span>
              {g.type && (
                <span className="text-xs capitalize text-sand-500">
                  {g.type}
                </span>
              )}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

function RecurringChargesCard({ charges }: { charges: RecurringCharge[] }) {
  return (
    <Card className="mt-6">
      <CardBody>
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-sand-400" />
          <h2 className="text-base font-semibold text-gray-900">
            Recurring Charges
          </h2>
        </div>
        <div className="mt-3 space-y-3">
          {charges.map((charge, i) => {
            const nextRun = safeFormat(charge.next_run, "MMM d, yyyy");
            return (
              <div
                key={i}
                className={clsx(
                  "flex items-start justify-between gap-3",
                  i > 0 && "border-t border-sand-100 pt-3",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {charge.description}
                  </p>
                  {nextRun && (
                    <p className="mt-0.5 text-xs text-sand-500">
                      Next charge: {nextRun}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {money(charge.amount)}
                  </p>
                  {charge.interval_label && (
                    <p className="text-xs text-sand-500">
                      {charge.interval_label}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

function PaymentPlansCard({ plans }: { plans: PaymentPlan[] }) {
  return (
    <Card className="mt-6">
      <CardBody>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-sand-400" />
          <h2 className="text-base font-semibold text-gray-900">
            Payment Schedule
          </h2>
        </div>
        <div className="mt-3 space-y-3">
          {plans.map((plan, i) => {
            const dueDate = safeFormat(plan.due_date, "MMM d, yyyy");
            return (
              <div
                key={i}
                className={clsx(
                  "flex items-start justify-between gap-3",
                  i > 0 && "border-t border-sand-100 pt-3",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {plan.description ?? "Installment"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {plan.status && (
                      <Badge status={statusBadgeFor(plan.status)}>
                        <span className="capitalize">{plan.status}</span>
                      </Badge>
                    )}
                    {dueDate && (
                      <span className="text-xs text-sand-500">
                        Due {dueDate}
                      </span>
                    )}
                  </div>
                </div>
                <p className="flex-shrink-0 text-sm font-semibold text-gray-900">
                  {money(plan.amount)}
                </p>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
