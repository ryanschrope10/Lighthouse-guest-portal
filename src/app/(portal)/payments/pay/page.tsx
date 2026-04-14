"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  CheckCircle,
  CreditCard,
  Building2,
  ChevronLeft,
  Plus,
  ShieldCheck,
} from "lucide-react";
import clsx from "clsx";
import type { Invoice, Booking, PaymentMethod } from "@/types/index";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  PaymentMethodForm,
  type NewPaymentMethodData,
} from "@/components/payment-method-form";

// ────────────────────────────────────────────────────────────
// Mock Data (mirrors payments page)
// ────────────────────────────────────────────────────────────

const mockBookings: Booking[] = [
  {
    id: "bk-1",
    property_id: "prop-1",
    guest_id: "guest-1",
    newbook_booking_id: "NB-10042",
    status: "checked_in",
    check_in: "2026-04-10T15:00:00Z",
    check_out: "2026-04-17T11:00:00Z",
    site_or_room: "Site A-12",
    booking_type: "rv",
    group_booking_id: null,
    total_amount: 840,
    balance_due: 420,
    details: {},
    synced_at: "2026-04-10T12:00:00Z",
    created_at: "2026-03-15T10:00:00Z",
  },
  {
    id: "bk-2",
    property_id: "prop-1",
    guest_id: "guest-1",
    newbook_booking_id: "NB-10078",
    status: "upcoming",
    check_in: "2026-05-01T15:00:00Z",
    check_out: "2026-05-08T11:00:00Z",
    site_or_room: "Cabin 7",
    booking_type: "cabin",
    group_booking_id: null,
    total_amount: 1260,
    balance_due: 630,
    details: {},
    synced_at: "2026-04-01T12:00:00Z",
    created_at: "2026-03-20T14:00:00Z",
  },
];

const mockInvoices: Invoice[] = [
  {
    id: "inv-1",
    booking_id: "bk-1",
    property_id: "prop-1",
    guest_id: "guest-1",
    newbook_invoice_id: "NBI-5001",
    amount: 420,
    status: "pending",
    due_date: "2026-04-17T00:00:00Z",
    paid_at: null,
    description: "Site A-12 - Remaining Balance",
    line_items: [
      { description: "Nightly rate (7 nights)", quantity: 7, unit_price: 120, total: 840 },
      { description: "Deposit paid", quantity: 1, unit_price: -420, total: -420 },
    ],
    synced_at: "2026-04-10T12:00:00Z",
    booking: mockBookings[0],
  },
  {
    id: "inv-2",
    booking_id: "bk-2",
    property_id: "prop-1",
    guest_id: "guest-1",
    newbook_invoice_id: "NBI-5023",
    amount: 630,
    status: "pending",
    due_date: "2026-04-25T00:00:00Z",
    paid_at: null,
    description: "Cabin 7 - Deposit Due",
    line_items: [
      { description: "Cabin rental (7 nights)", quantity: 7, unit_price: 180, total: 1260 },
      { description: "50% deposit due", quantity: 1, unit_price: 630, total: 630 },
    ],
    synced_at: "2026-04-01T12:00:00Z",
    booking: mockBookings[1],
  },
  {
    id: "inv-3",
    booking_id: "bk-1",
    property_id: "prop-1",
    guest_id: "guest-1",
    newbook_invoice_id: "NBI-4890",
    amount: 65,
    status: "overdue",
    due_date: "2026-04-10T00:00:00Z",
    paid_at: null,
    description: "Electric hookup - overage charge",
    line_items: [
      { description: "Electric overage (130 kWh)", quantity: 130, unit_price: 0.5, total: 65 },
    ],
    synced_at: "2026-04-10T12:00:00Z",
    booking: mockBookings[0],
  },
];

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "pm-1",
    guest_id: "guest-1",
    type: "credit_card",
    last_four: "4242",
    brand: "Visa",
    is_preferred: true,
    auto_pay_enabled: false,
    newbook_payment_token: "tok_mock_1",
    created_at: "2026-01-15T10:00:00Z",
  },
  {
    id: "pm-2",
    guest_id: "guest-1",
    type: "credit_card",
    last_four: "1234",
    brand: "Mastercard",
    is_preferred: false,
    auto_pay_enabled: false,
    newbook_payment_token: "tok_mock_2",
    created_at: "2026-02-20T14:00:00Z",
  },
  {
    id: "pm-3",
    guest_id: "guest-1",
    type: "ach",
    last_four: "6789",
    brand: "Chase",
    is_preferred: false,
    auto_pay_enabled: true,
    newbook_payment_token: "tok_mock_3",
    created_at: "2026-03-01T08:00:00Z",
  },
];

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// ────────────────────────────────────────────────────────────
// PayContent — inner component that reads searchParams
// ────────────────────────────────────────────────────────────

type PayStep = "review" | "processing" | "success";

function PayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const invoiceId = searchParams.get("invoiceId");
  const payAll = searchParams.get("all") === "true";

  // Determine which invoices to pay
  const invoicesToPay = useMemo(() => {
    if (payAll) {
      return mockInvoices.filter((inv) => inv.status !== "paid");
    }
    if (invoiceId) {
      const found = mockInvoices.find((inv) => inv.id === invoiceId);
      return found ? [found] : [];
    }
    return [];
  }, [invoiceId, payAll]);

  const totalAmount = useMemo(
    () => invoicesToPay.reduce((sum, inv) => sum + inv.amount, 0),
    [invoicesToPay],
  );

  // State
  const [step, setStep] = useState<PayStep>("review");
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    () => mockPaymentMethods.find((m) => m.is_preferred)?.id ?? mockPaymentMethods[0]?.id ?? "",
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState(mockPaymentMethods);

  // If no invoices to pay, redirect back
  useEffect(() => {
    if (invoicesToPay.length === 0 && step === "review") {
      router.replace("/payments");
    }
  }, [invoicesToPay.length, step, router]);

  function handleAddMethod(data: NewPaymentMethodData) {
    const newMethod: PaymentMethod = {
      id: `pm-new-${Date.now()}`,
      guest_id: "guest-1",
      type: data.type,
      last_four: data.type === "credit_card"
        ? (data.cardNumber?.replace(/\s/g, "").slice(-4) ?? "0000")
        : (data.accountNumber?.slice(-4) ?? "0000"),
      brand: data.type === "credit_card" ? "Card" : "Bank",
      is_preferred: false,
      auto_pay_enabled: false,
      newbook_payment_token: null,
      created_at: new Date().toISOString(),
    };
    setPaymentMethods((prev) => [...prev, newMethod]);
    setSelectedMethodId(newMethod.id);
    setShowAddForm(false);
  }

  function handleConfirmPayment() {
    setStep("processing");
    // Simulate payment processing
    setTimeout(() => {
      setStep("success");
    }, 2000);
  }

  if (invoicesToPay.length === 0) {
    return null;
  }

  // ── Success Screen ──
  if (step === "success") {
    const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId);
    return (
      <div className="mx-auto max-w-lg">
        <div className="flex flex-col items-center py-8 text-center">
          {/* Animated checkmark */}
          <div className="success-checkmark mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
            <CheckCircle className="h-10 w-10 text-green-600 animate-check" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Successful</h1>
          <p className="mt-2 text-sm text-sand-500">
            Your payment has been processed successfully.
          </p>
        </div>

        {/* Receipt summary */}
        <Card className="mt-4">
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">
              Receipt Summary
            </h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {invoicesToPay.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">
                    {inv.description}
                  </p>
                  {inv.booking && (
                    <p className="text-xs text-sand-500">
                      {inv.booking.site_or_room}
                    </p>
                  )}
                </div>
                <span className="ml-4 font-semibold text-gray-900">
                  {formatCurrency(inv.amount)}
                </span>
              </div>
            ))}
            <div className="border-t border-sand-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  Total Paid
                </span>
                <span className="text-lg font-bold text-green-700">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              {selectedMethod && (
                <p className="mt-1 text-xs text-sand-500">
                  Charged to {selectedMethod.brand} ending in{" "}
                  {selectedMethod.last_four}
                </p>
              )}
              <p className="mt-0.5 text-xs text-sand-500">
                {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </CardBody>
        </Card>

        <div className="mt-6 space-y-3">
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="ghost"
            size="md"
            className="w-full"
            onClick={() => router.push("/payments")}
          >
            View All Payments
          </Button>
        </div>

        {/* CSS animation for the checkmark */}
        <style jsx>{`
          @keyframes checkScale {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            50% {
              transform: scale(1.2);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          .success-checkmark {
            animation: checkScale 0.5s ease-out;
          }
          :global(.animate-check) {
            animation: checkScale 0.6s ease-out 0.2s both;
          }
        `}</style>
      </div>
    );
  }

  // ── Processing Screen ──
  if (step === "processing") {
    return (
      <div className="mx-auto max-w-lg">
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-6 h-12 w-12 animate-spin rounded-full border-4 border-gold-200 border-t-gold-600" />
          <h1 className="text-xl font-bold text-gray-900">
            Processing Payment
          </h1>
          <p className="mt-2 text-sm text-sand-500">
            Please wait while we process your payment of{" "}
            {formatCurrency(totalAmount)}...
          </p>
        </div>
      </div>
    );
  }

  // ── Review Step ──
  return (
    <div className="mx-auto max-w-lg space-y-5">
      {/* Back link */}
      <button
        onClick={() => router.push("/payments")}
        className="inline-flex items-center gap-1 text-sm font-medium text-sand-600 transition-colors hover:text-gray-900 min-h-[44px]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Payments
      </button>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          {payAll ? "Pay All Invoices" : "Make a Payment"}
        </h1>
        <p className="mt-1 text-sm text-sand-500">
          Review the details below and confirm your payment.
        </p>
      </div>

      {/* ── Payment Summary ── */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">
            Payment Summary
          </h2>
        </CardHeader>
        <CardBody className="space-y-3">
          {invoicesToPay.map((inv) => (
            <div
              key={inv.id}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">
                  {inv.description}
                </p>
                {inv.booking && (
                  <p className="text-xs text-sand-500">
                    {inv.booking.site_or_room} &middot;{" "}
                    {format(new Date(inv.booking.check_in), "MMM d")} -{" "}
                    {format(new Date(inv.booking.check_out), "MMM d, yyyy")}
                  </p>
                )}
                {inv.due_date && (
                  <p className="text-xs text-sand-400">
                    Due {format(new Date(inv.due_date), "MMM d, yyyy")}
                  </p>
                )}
              </div>
              <span className="font-semibold text-gray-900 whitespace-nowrap">
                {formatCurrency(inv.amount)}
              </span>
            </div>
          ))}
          <div className="border-t border-sand-200 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-gray-900">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── Payment Method Selector ── */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">
            Payment Method
          </h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-2">
            {paymentMethods.map((method) => {
              const isSelected = selectedMethodId === method.id;
              const Icon = method.type === "credit_card" ? CreditCard : Building2;
              return (
                <label
                  key={method.id}
                  className={clsx(
                    "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors min-h-[44px]",
                    isSelected
                      ? "border-gold-500 bg-gold-50 ring-1 ring-gold-500/30"
                      : "border-sand-200 bg-white hover:bg-sand-50",
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={isSelected}
                    onChange={() => {
                      setSelectedMethodId(method.id);
                      setShowAddForm(false);
                    }}
                    className="h-4 w-4 border-sand-300 text-gold-600 focus:ring-gold-500"
                  />
                  <Icon
                    className={clsx(
                      "h-5 w-5 flex-shrink-0",
                      isSelected ? "text-gold-600" : "text-sand-400",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {method.brand} ending in {method.last_four}
                    </p>
                    <p className="text-xs text-sand-500">
                      {method.type === "credit_card" ? "Credit Card" : "Bank Account"}
                      {method.is_preferred && (
                        <span className="ml-1.5 text-gold-600 font-medium">
                          - Preferred
                        </span>
                      )}
                    </p>
                  </div>
                </label>
              );
            })}

            {/* Add new method toggle */}
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex w-full items-center gap-3 rounded-lg border border-dashed border-sand-300 px-4 py-3 text-sm font-medium text-sand-600 transition-colors hover:border-gold-400 hover:bg-gold-50 hover:text-gold-700 min-h-[44px]"
              >
                <Plus className="h-5 w-5" />
                Add New Payment Method
              </button>
            )}
          </div>

          {/* Inline add form */}
          {showAddForm && (
            <div className="mt-4 rounded-lg border border-sand-200 bg-sand-50/50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                Add Payment Method
              </h3>
              <PaymentMethodForm
                onSubmit={handleAddMethod}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Confirm Button ── */}
      <div className="space-y-3 pb-4">
        <Button
          size="lg"
          className="w-full"
          onClick={handleConfirmPayment}
          disabled={!selectedMethodId}
        >
          <ShieldCheck className="mr-1.5 h-4 w-4" />
          Pay {formatCurrency(totalAmount)}
        </Button>
        <div className="flex items-center justify-center gap-1.5 text-xs text-sand-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Payments are processed securely through NewBook</span>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Page — Suspense wrapper required for useSearchParams
// ────────────────────────────────────────────────────────────

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg py-16 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gold-200 border-t-gold-600" />
          <p className="mt-3 text-sm text-sand-500">Loading...</p>
        </div>
      }
    >
      <PayContent />
    </Suspense>
  );
}
