"use client";

import { format } from "date-fns";
import { Printer } from "lucide-react";
import type { Invoice, InvoiceStatus, Property } from "@/types/index";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function money(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

const STATUS: Record<
  InvoiceStatus,
  { label: string; badge: "warning" | "danger" | "info" | "success" }
> = {
  pending: { label: "Pending", badge: "warning" },
  overdue: { label: "Overdue", badge: "danger" },
  partial: { label: "Partially Paid", badge: "info" },
  paid: { label: "Paid", badge: "success" },
};

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={
        "flex items-center justify-between " +
        (strong ? "font-semibold text-gray-900" : "text-sand-600")
      }
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function InvoiceDetailModal({
  invoice,
  guestName,
  guestEmail,
  property,
  onClose,
  onPay,
  paying = false,
}: {
  invoice: Invoice;
  guestName?: string | null;
  guestEmail?: string | null;
  property?: Property | null;
  onClose: () => void;
  onPay?: (invoice: Invoice) => void;
  paying?: boolean;
}) {
  const b = invoice.booking;
  const status = STATUS[invoice.status];
  const subtotal = invoice.line_items.reduce((s, li) => s + li.total, 0);
  const total = b?.total_amount ?? invoice.amount;
  const balance = invoice.status === "paid" ? 0 : b?.balance_due ?? invoice.amount;
  const paid = Math.max(0, Number((total - balance).toFixed(2)));
  const taxesFees = Number((total - subtotal).toFixed(2));

  return (
    <Modal
      open
      onClose={onClose}
      className="max-w-2xl"
      footer={
        <div className="print-hide flex flex-wrap items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          {balance > 0 && onPay && (
            <Button
              size="sm"
              disabled={paying}
              onClick={() => onPay(invoice)}
            >
              {paying ? "Sending…" : "Pay this invoice"}
            </Button>
          )}
        </div>
      }
    >
      <div className="invoice-print space-y-5 text-sm text-sand-800">
        {/* Letterhead */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-bold text-gray-900">
              {property?.name ?? "Invoice"}
            </p>
            {property?.contact_info?.phone && (
              <p className="text-xs text-sand-500">
                {property.contact_info.phone}
              </p>
            )}
            {property?.contact_info?.email && (
              <p className="text-xs text-sand-500">
                {property.contact_info.email}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold uppercase tracking-wide text-sand-500">
              Invoice
            </p>
            {invoice.newbook_invoice_id && (
              <p className="text-xs text-sand-500">
                #{invoice.newbook_invoice_id}
              </p>
            )}
            <div className="mt-1">
              <Badge status={status.badge}>{status.label}</Badge>
            </div>
          </div>
        </div>

        {/* Bill To + Reservation */}
        <div className="grid grid-cols-1 gap-4 border-t border-sand-100 pt-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sand-500">
              Bill To
            </p>
            <p className="mt-1 font-medium text-gray-900">{guestName || "—"}</p>
            {guestEmail && <p className="text-xs text-sand-500">{guestEmail}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-sand-500">
              Reservation
            </p>
            {b && (
              <>
                <p className="mt-1 font-medium text-gray-900">
                  {b.site_or_room}
                </p>
                <p className="text-xs text-sand-500">
                  {format(new Date(b.check_in), "MMM d, yyyy")} –{" "}
                  {format(new Date(b.check_out), "MMM d, yyyy")}
                </p>
              </>
            )}
            {invoice.due_date && invoice.status !== "paid" && (
              <p className="mt-1 text-xs text-sand-500">
                Due {format(new Date(invoice.due_date), "MMM d, yyyy")}
              </p>
            )}
            {invoice.paid_at && invoice.status === "paid" && (
              <p className="mt-1 text-xs text-sand-500">
                Paid {format(new Date(invoice.paid_at), "MMM d, yyyy")}
              </p>
            )}
          </div>
        </div>

        {/* Line items */}
        <div className="border-t border-sand-100 pt-4">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-sand-500">
                <th className="pb-2 font-semibold">Description</th>
                <th className="pb-2 text-center font-semibold">Qty</th>
                <th className="pb-2 text-right font-semibold">Unit</th>
                <th className="pb-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {invoice.line_items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-3 text-sand-500">
                    {invoice.description || "Charges"}
                  </td>
                </tr>
              ) : (
                invoice.line_items.map((li, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-2 text-gray-900">{li.description}</td>
                    <td className="py-2 text-center text-sand-600">
                      {li.quantity}
                    </td>
                    <td className="py-2 text-right text-sand-600">
                      {money(li.unit_price)}
                    </td>
                    <td className="py-2 text-right font-medium text-gray-900">
                      {money(li.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="ml-auto max-w-xs space-y-1.5 border-t border-sand-100 pt-4">
          <Row label="Subtotal" value={money(subtotal)} />
          {Math.abs(taxesFees) > 0.01 && (
            <Row label="Taxes & fees" value={money(taxesFees)} />
          )}
          <Row label="Total" value={money(total)} strong />
          {paid > 0.01 && <Row label="Amount paid" value={"-" + money(paid)} />}
          <div className="flex items-center justify-between border-t border-sand-200 pt-2 text-base font-bold text-gray-900">
            <span>Balance due</span>
            <span>{money(balance)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
