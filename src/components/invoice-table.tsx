"use client";

import { format } from "date-fns";
import { AlertCircle, Clock, CheckCircle, ArrowRight } from "lucide-react";
import clsx from "clsx";
import type { Invoice, InvoiceStatus } from "@/types/index";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface InvoiceTableProps {
  invoices: Invoice[];
  onPay?: (invoice: Invoice) => void;
  /** If true, hides the pay action column (for paid history) */
  readonly?: boolean;
}

const statusConfig: Record<
  InvoiceStatus,
  { label: string; badge: "warning" | "danger" | "info" | "success" }
> = {
  pending: { label: "Pending", badge: "warning" },
  overdue: { label: "Overdue", badge: "danger" },
  partial: { label: "Partial", badge: "info" },
  paid: { label: "Paid", badge: "success" },
};

const statusIcons: Record<InvoiceStatus, typeof AlertCircle> = {
  pending: Clock,
  overdue: AlertCircle,
  partial: AlertCircle,
  paid: CheckCircle,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function InvoiceTable({
  invoices,
  onPay,
  readonly = false,
}: InvoiceTableProps) {
  if (invoices.length === 0) return null;

  return (
    <>
      {/* ── Mobile: Stacked Cards ── */}
      <div className="space-y-3 md:hidden">
        {invoices.map((invoice) => {
          const config = statusConfig[invoice.status];
          const StatusIcon = statusIcons[invoice.status];
          return (
            <div
              key={invoice.id}
              className="rounded-xl border border-sand-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {invoice.description || "Invoice"}
                  </p>
                  {invoice.booking && (
                    <p className="mt-0.5 text-xs text-sand-500">
                      {invoice.booking.site_or_room} &middot;{" "}
                      {format(new Date(invoice.booking.check_in), "MMM d")} -{" "}
                      {format(new Date(invoice.booking.check_out), "MMM d")}
                    </p>
                  )}
                </div>
                <Badge status={config.badge}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {config.label}
                </Badge>
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(invoice.amount)}
                  </p>
                  {invoice.due_date && invoice.status !== "paid" && (
                    <p
                      className={clsx(
                        "text-xs",
                        invoice.status === "overdue"
                          ? "text-red-600 font-medium"
                          : "text-sand-500",
                      )}
                    >
                      Due {format(new Date(invoice.due_date), "MMM d, yyyy")}
                    </p>
                  )}
                  {invoice.paid_at && invoice.status === "paid" && (
                    <p className="text-xs text-sand-500">
                      Paid {format(new Date(invoice.paid_at), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
                {!readonly && onPay && (
                  <Button
                    size="sm"
                    onClick={() => onPay(invoice)}
                    className="whitespace-nowrap"
                  >
                    Pay Now
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Desktop: Table Layout ── */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-sand-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-sand-200 bg-sand-50/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-sand-600">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-sand-600">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-sand-600">
                {readonly ? "Paid Date" : "Due Date"}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-sand-600">
                Status
              </th>
              {!readonly && (
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-sand-600">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {invoices.map((invoice) => {
              const config = statusConfig[invoice.status];
              const StatusIcon = statusIcons[invoice.status];
              return (
                <tr
                  key={invoice.id}
                  className="transition-colors hover:bg-sand-50/50"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {invoice.description || "Invoice"}
                    </p>
                    {invoice.booking && (
                      <p className="mt-0.5 text-xs text-sand-500">
                        {invoice.booking.site_or_room} &middot;{" "}
                        {format(new Date(invoice.booking.check_in), "MMM d")} -{" "}
                        {format(new Date(invoice.booking.check_out), "MMM d")}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-sand-600">
                    {readonly && invoice.paid_at
                      ? format(new Date(invoice.paid_at), "MMM d, yyyy")
                      : invoice.due_date
                        ? format(new Date(invoice.due_date), "MMM d, yyyy")
                        : "--"}
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={config.badge}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {config.label}
                    </Badge>
                  </td>
                  {!readonly && (
                    <td className="px-6 py-4 text-right">
                      {onPay && (
                        <Button size="sm" onClick={() => onPay(invoice)}>
                          Pay Now
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
