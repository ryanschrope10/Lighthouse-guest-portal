"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, isPast, addDays } from "date-fns";
import {
  CheckCircle,
  Receipt,
  Search,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import type { Invoice, Booking, InvoiceStatus } from "@/types/index";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { InvoiceTable } from "@/components/invoice-table";

// ────────────────────────────────────────────────────────────
// Mock Data
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
  // Paid invoices
  {
    id: "inv-4",
    booking_id: "bk-1",
    property_id: "prop-1",
    guest_id: "guest-1",
    newbook_invoice_id: "NBI-4801",
    amount: 420,
    status: "paid",
    due_date: "2026-03-25T00:00:00Z",
    paid_at: "2026-03-24T16:30:00Z",
    description: "Site A-12 - Initial Deposit",
    line_items: [
      { description: "50% booking deposit", quantity: 1, unit_price: 420, total: 420 },
    ],
    synced_at: "2026-03-24T17:00:00Z",
    booking: mockBookings[0],
  },
  {
    id: "inv-5",
    booking_id: "bk-2",
    property_id: "prop-1",
    guest_id: "guest-1",
    newbook_invoice_id: "NBI-4750",
    amount: 50,
    status: "paid",
    due_date: "2026-03-20T00:00:00Z",
    paid_at: "2026-03-20T09:15:00Z",
    description: "Reservation fee",
    line_items: [
      { description: "Non-refundable reservation fee", quantity: 1, unit_price: 50, total: 50 },
    ],
    synced_at: "2026-03-20T10:00:00Z",
    booking: mockBookings[1],
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
// Page Component
// ────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const unpaidInvoices = useMemo(
    () => mockInvoices.filter((inv) => inv.status !== "paid"),
    [],
  );

  const paidInvoices = useMemo(
    () => mockInvoices.filter((inv) => inv.status === "paid"),
    [],
  );

  const totalBalanceDue = useMemo(
    () => unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    [unpaidInvoices],
  );

  // Filter invoices by search query
  const filteredUnpaid = useMemo(() => {
    if (!searchQuery.trim()) return unpaidInvoices;
    const q = searchQuery.toLowerCase();
    return unpaidInvoices.filter(
      (inv) =>
        inv.description?.toLowerCase().includes(q) ||
        inv.booking?.site_or_room?.toLowerCase().includes(q) ||
        (inv.due_date &&
          format(new Date(inv.due_date), "MMM d, yyyy").toLowerCase().includes(q)),
    );
  }, [unpaidInvoices, searchQuery]);

  const filteredPaid = useMemo(() => {
    if (!searchQuery.trim()) return paidInvoices;
    const q = searchQuery.toLowerCase();
    return paidInvoices.filter(
      (inv) =>
        inv.description?.toLowerCase().includes(q) ||
        inv.booking?.site_or_room?.toLowerCase().includes(q) ||
        (inv.paid_at &&
          format(new Date(inv.paid_at), "MMM d, yyyy").toLowerCase().includes(q)),
    );
  }, [paidInvoices, searchQuery]);

  function handlePayInvoice(invoice: Invoice) {
    router.push(`/payments/pay?invoiceId=${invoice.id}`);
  }

  function handlePayAll() {
    router.push("/payments/pay?all=true");
  }

  const hasBalance = totalBalanceDue > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Payments
        </h1>
        <p className="mt-1 text-sm text-sand-500">
          View invoices, make payments, and see your payment history.
        </p>
      </div>

      {/* ── Outstanding Balance Banner ── */}
      {hasBalance ? (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-gold-50 to-gold-100/50 px-4 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gold-700">
                  Outstanding Balance
                </p>
                <p className="mt-1 text-3xl font-bold text-gray-900 sm:text-4xl">
                  {formatCurrency(totalBalanceDue)}
                </p>
                <p className="mt-1 text-xs text-sand-500">
                  Across {unpaidInvoices.length} unpaid{" "}
                  {unpaidInvoices.length === 1 ? "invoice" : "invoices"}
                </p>
              </div>
              <Button size="lg" onClick={handlePayAll} className="sm:w-auto">
                Pay All ({formatCurrency(totalBalanceDue)})
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <CardBody className="flex flex-col items-center py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <p className="mt-3 text-base font-semibold text-gray-900">
              All Paid
            </p>
            <p className="mt-1 text-sm text-sand-500">
              You have no outstanding invoices. You&apos;re all set!
            </p>
          </CardBody>
        </Card>
      )}

      {/* ── Search / Filter Bar ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-400" />
        <input
          type="text"
          placeholder="Search invoices by description or date..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full rounded-lg border border-sand-300 bg-white py-2.5 pl-10 pr-4 text-sm text-sand-900 placeholder:text-sand-400 transition-colors focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 min-h-[44px]"
        />
      </div>

      {/* ── Unpaid Invoices Section ── */}
      {filteredUnpaid.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-sand-700">
              Unpaid Invoices
            </h2>
            <span className="ml-auto text-xs font-medium text-sand-500">
              {filteredUnpaid.length}{" "}
              {filteredUnpaid.length === 1 ? "invoice" : "invoices"}
            </span>
          </div>
          <InvoiceTable invoices={filteredUnpaid} onPay={handlePayInvoice} />
        </section>
      )}

      {/* ── Payment History Section ── */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-sand-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-sand-700">
            Payment History
          </h2>
          <span className="ml-auto text-xs font-medium text-sand-500">
            {filteredPaid.length}{" "}
            {filteredPaid.length === 1 ? "payment" : "payments"}
          </span>
        </div>
        {filteredPaid.length > 0 ? (
          <InvoiceTable invoices={filteredPaid} readonly />
        ) : (
          <Card>
            <CardBody className="py-8 text-center">
              <p className="text-sm text-sand-500">
                {searchQuery
                  ? "No payments match your search."
                  : "No payment history yet."}
              </p>
            </CardBody>
          </Card>
        )}
      </section>

      {/* Empty state if search yields nothing across both sections */}
      {searchQuery && filteredUnpaid.length === 0 && filteredPaid.length === 0 && (
        <Card>
          <CardBody className="flex flex-col items-center py-12 text-center">
            <Search className="h-8 w-8 text-sand-300" />
            <p className="mt-3 text-sm font-medium text-sand-600">
              No invoices found
            </p>
            <p className="mt-1 text-xs text-sand-400">
              Try adjusting your search terms.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
