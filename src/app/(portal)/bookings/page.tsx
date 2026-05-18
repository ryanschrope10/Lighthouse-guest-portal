"use client";

import { useEffect, useState } from "react";
import { CalendarDays, AlertCircle } from "lucide-react";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { BookingCard } from "@/components/booking-card";
import { Spinner } from "@/components/ui/spinner";
import type { Booking, ApiResponse } from "@/types/index";

// ─── Helpers ─────────────────────────────────────────────────
function filterBookings(bookings: Booking[], tab: string): Booking[] {
  switch (tab) {
    case "upcoming":
      return bookings.filter((b) => b.status === "upcoming");
    case "current":
      return bookings.filter((b) => b.status === "checked_in");
    case "past":
      return bookings.filter(
        (b) => b.status === "checked_out" || b.status === "cancelled",
      );
    default:
      return bookings;
  }
}

const TABS = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Current", value: "current" },
  { label: "Past", value: "past" },
];

const EMPTY_MESSAGES: Record<string, string> = {
  upcoming: "No upcoming bookings",
  current: "No current bookings",
  past: "No past bookings",
};

// ─── Page ────────────────────────────────────────────────────
export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/bookings");
        const json: ApiResponse<Booking[]> = await res.json();
        if (cancelled) return;
        if (json.error || !json.data) {
          setError(json.error ?? "Failed to load bookings");
          return;
        }
        setBookings(json.data);
      } catch {
        if (!cancelled) setError("Could not reach the booking service.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
        My Bookings
      </h1>

      <div className="mt-4">
        <Tabs tabs={TABS} value={activeTab} onChange={setActiveTab} />
      </div>

      {error ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Couldn&apos;t load your bookings
            </p>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      ) : bookings === null ? (
        <div className="mt-12 flex justify-center">
          <Spinner />
        </div>
      ) : (
        TABS.map((tab) => (
          <TabPanel key={tab.value} value={tab.value} activeValue={activeTab}>
            <BookingList
              bookings={filterBookings(bookings, tab.value)}
              emptyMessage={EMPTY_MESSAGES[tab.value]}
            />
          </TabPanel>
        ))
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────
function BookingList({
  bookings,
  emptyMessage,
}: {
  bookings: Booking[];
  emptyMessage: string;
}) {
  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title={emptyMessage}
        description="When you have bookings they will appear here."
      />
    );
  }

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {bookings.map((booking) => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  );
}
