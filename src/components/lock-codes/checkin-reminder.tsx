"use client";

import { useEffect, useState } from "react";
import { differenceInHours, parseISO } from "date-fns";
import { Lock } from "lucide-react";
import type { ApiResponse, Booking } from "@/types/index";
import type { LockCode } from "@/types/lock-codes";

interface CheckinReminderProps {
  booking: Booking;
}

// Show the banner from 24h before check-in through the day of arrival.
const REMIND_HOURS_BEFORE = 24;

export function CheckinReminder({ booking }: CheckinReminderProps) {
  const [hasCode, setHasCode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/lock-codes?booking_id=${encodeURIComponent(booking.id)}`,
          { cache: "no-store" }
        );
        const json: ApiResponse<LockCode[]> = await res.json();
        if (cancelled) return;
        setHasCode(!!(json.data ?? []).find((c) => !c.revoked_at));
      } catch {
        if (!cancelled) setHasCode(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [booking.id]);

  if (!hasCode) return null;
  if (booking.status !== "upcoming" && booking.status !== "checked_in") {
    return null;
  }

  const hoursUntil = differenceInHours(parseISO(booking.check_in), new Date());
  if (hoursUntil > REMIND_HOURS_BEFORE) return null;

  return (
    <a
      href="#lock-code"
      className="flex items-center gap-3 rounded-lg border border-gold-300 bg-gold-50 px-4 py-3 text-sm text-gold-900 transition-colors hover:bg-gold-100"
    >
      <Lock className="h-4 w-4 flex-shrink-0 text-gold-600" />
      <span className="font-medium">
        Your access code is ready — view it below.
      </span>
    </a>
  );
}
