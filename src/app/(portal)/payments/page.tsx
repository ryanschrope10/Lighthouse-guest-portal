"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format, parseISO } from "date-fns";
import {
  CheckCircle,
  Receipt,
  Search,
  AlertCircle,
  Mail,
  RefreshCw,
} from "lucide-react";
import type { Invoice, ApiResponse } from "@/types/index";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { InvoiceTable } from "@/components/invoice-table";
import { InvoiceDetailModal } from "@/components/invoice-detail-modal";
import { useGuest } from "@/lib/context/guest-context";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [busyBooking, setBusyBooking] = useState<string | null>(null);
  const [notice, setNotice] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [autoPayStatus, setAutoPayStatus] = useState<
    "idle" | "sending" | "requested"
  >("idle");
  const { guest, property } = useGuest();

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/invoices");
      const json: ApiResponse<Invoice[]> = await res.json();
      if (!res.ok || json.error || !json.data) {
        setLoadError(json.error ?? "Failed to load your invoices.");
        return;
      }
      setInvoices(json.data);
    } catch {
      setLoadError("Could not reach the server.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unpaidInvoices = useMemo(
    () => (invoices ?? []).filter((inv) => inv.status !== "paid"),
    [invoices],
  );
  const paidInvoices = useMemo(
    () => (invoices ?? []).filter((inv) => inv.status === "paid"),
    [invoices],
  );
  const totalBalanceDue = useMemo(
    () => unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    [unpaidInvoices],
  );

  const matchesSearch = useCallback(
    (inv: Invoice, dateField: "due_date" | "paid_at") => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const d = inv[dateField];
      return (
        (inv.description?.toLowerCase().includes(q) ?? false) ||
        (inv.booking?.site_or_room?.toLowerCase().includes(q) ?? false) ||
        (!!d && format(parseISO(d), "MMM d, yyyy").toLowerCase().includes(q))
      );
    },
    [searchQuery],
  );

  const filteredUnpaid = useMemo(
    () => unpaidInvoices.filter((inv) => matchesSearch(inv, "due_date")),
    [unpaidInvoices, matchesSearch],
  );
  const filteredPaid = useMemo(
    () => paidInvoices.filter((inv) => matchesSearch(inv, "paid_at")),
    [paidInvoices, matchesSearch],
  );

  const sendPayLink = useCallback(
    async (bookingPortalId: string, label: string) => {
      setBusyBooking(bookingPortalId);
      setNotice(null);
      try {
        const res = await fetch(
          `/api/bookings/${encodeURIComponent(bookingPortalId)}/pay-link`,
          { method: "POST" },
        );
        const json: ApiResponse<unknown> = await res.json();
        if (!res.ok || json.error) {
          setNotice({
            type: "error",
            text: json.error ?? "We couldn't send your payment link.",
          });
          return;
        }
        setNotice({
          type: "success",
          text: `We've emailed you a secure payment link for ${label}. Check your inbox to pay online.`,
        });
      } catch {
        setNotice({ type: "error", text: "Could not reach the server." });
      } finally {
        setBusyBooking(null);
      }
    },
    [],
  );

  const handlePayInvoice = useCallback(
    (invoice: Invoice) => {
      if (busyBooking) return;
      sendPayLink(
        invoice.booking_id,
        invoice.booking?.site_or_room ?? "your booking",
      );
    },
    [busyBooking, sendPayLink],
  );

  const hasBalance = totalBalanceDue > 0;

  // AutoPay enrollment attaches to one of the guest's bookings (addon_requests
  // infra requires a booking FK). Use any booking the guest has an invoice for.
  const autoPayBookingId = useMemo(
    () => invoices?.find((inv) => inv.booking_id)?.booking_id ?? null,
    [invoices],
  );

  const requestAutoPay = useCallback(async () => {
    if (!autoPayBookingId || autoPayStatus !== "idle") return;
    setAutoPayStatus("sending");
    setNotice(null);
    try {
      const res = await fetch("/api/payments/autopay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: autoPayBookingId }),
      });
      const json: ApiResponse<{ message?: string }> = await res.json();
      if (!res.ok || json.error) {
        setNotice({
          type: "error",
          text: json.error ?? "We couldn't submit your AutoPay request.",
        });
        setAutoPayStatus("idle");
        return;
      }
      setNotice({
        type: "success",
        text:
          json.data?.message ??
          "AutoPay requested — the front desk will follow up shortly.",
      });
      setAutoPayStatus("requested");
    } catch {
      setNotice({ type: "error", text: "Could not reach the server." });
      setAutoPayStatus("idle");
    }
  }, [autoPayBookingId, autoPayStatus]);

  if (invoices === null && !loadError) {
    return (
      <div className="mx-auto flex max-w-5xl justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Payments</h1>
        <p className="mt-1 text-sm text-sand-500">
          View your invoices, pay online, and see your payment history.
        </p>
      </div>

      {loadError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{loadError}</p>
        </div>
      )}

      {notice && (
        <div
          className={
            "flex items-start gap-3 rounded-xl border p-4 " +
            (notice.type === "success"
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50")
          }
        >
          {notice.type === "success" ? (
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          )}
          <p
            className={
              "text-sm " +
              (notice.type === "success" ? "text-green-800" : "text-red-700")
            }
          >
            {notice.text}
          </p>
        </div>
      )}

      {/* Outstanding balance */}
      {hasBalance ? (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-gold-50 to-gold-100/50 px-4 py-5 sm:px-6 sm:py-6">
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
            <p className="mt-3 text-xs text-sand-500">
              Select an invoice below to receive a secure payment link by email.
            </p>
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

      {/* AutoPay enrollment */}
      {autoPayBookingId && (
        <Card>
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-50">
                <RefreshCw className="h-5 w-5 text-gold-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">AutoPay</p>
                <p className="mt-0.5 text-sm text-sand-500">
                  Have your balance charged automatically each cycle. Request it
                  and the front desk will get you set up.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="shrink-0"
              disabled={autoPayStatus !== "idle"}
              loading={autoPayStatus === "sending"}
              onClick={requestAutoPay}
            >
              {autoPayStatus === "requested" ? "Requested" : "Request AutoPay"}
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Search */}
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

      {/* Unpaid */}
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
          <InvoiceTable
            invoices={filteredUnpaid}
            onPay={handlePayInvoice}
            onView={setSelected}
          />
        </section>
      )}

      {/* History */}
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
          <InvoiceTable invoices={filteredPaid} onView={setSelected} readonly />
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

      {/* Empty search */}
      {searchQuery &&
        filteredUnpaid.length === 0 &&
        filteredPaid.length === 0 && (
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

      {selected && (
        <InvoiceDetailModal
          invoice={selected}
          guestName={
            [guest?.first_name, guest?.last_name].filter(Boolean).join(" ") ||
            null
          }
          guestEmail={guest?.email ?? null}
          property={property}
          onClose={() => setSelected(null)}
          onPay={(inv) => {
            setSelected(null);
            sendPayLink(
              inv.booking_id,
              inv.booking?.site_or_room ?? "your booking",
            );
          }}
          paying={busyBooking === selected.booking_id}
        />
      )}
    </div>
  );
}
