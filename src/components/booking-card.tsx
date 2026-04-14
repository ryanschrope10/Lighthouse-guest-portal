"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ChevronRight } from "lucide-react";
import clsx from "clsx";
import { Badge } from "@/components/ui/badge";
import type { Booking, BookingStatus } from "@/types/index";

interface BookingCardProps {
  booking: Booking;
}

const statusBadge: Record<
  BookingStatus,
  { label: string; status: "info" | "success" | "neutral" | "danger" }
> = {
  upcoming: { label: "Upcoming", status: "info" },
  checked_in: { label: "Checked In", status: "success" },
  checked_out: { label: "Checked Out", status: "neutral" },
  cancelled: { label: "Cancelled", status: "danger" },
};

function formatDateRange(checkIn: string, checkOut: string): string {
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);

  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startYear === endYear) {
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  }
  return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
}

export function BookingCard({ booking }: BookingCardProps) {
  const badge = statusBadge[booking.status];

  return (
    <Link
      href={`/bookings/${booking.id}`}
      className="flex items-center gap-3 rounded-xl border border-sand-200 bg-white p-4 shadow-sm transition-colors active:bg-sand-50 hover:border-sand-300"
    >
      <div className="flex-1 min-w-0">
        {/* Property name */}
        <p className="text-sm font-semibold text-gray-900 truncate">
          {booking.property?.name ?? "Property"}
        </p>

        {/* Site / Room */}
        {booking.site_or_room && (
          <p className="mt-0.5 text-xs text-sand-600 truncate">
            {booking.site_or_room}
          </p>
        )}

        {/* Date range */}
        <p className="mt-1 text-xs text-sand-500">
          {formatDateRange(booking.check_in, booking.check_out)}
        </p>

        {/* Status + Balance row */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <Badge status={badge.status}>{badge.label}</Badge>

          {booking.balance_due > 0 && (
            <span className="text-xs font-semibold text-gold-600">
              ${booking.balance_due.toFixed(2)} due
            </span>
          )}
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight className="h-5 w-5 flex-shrink-0 text-sand-400" />
    </Link>
  );
}
