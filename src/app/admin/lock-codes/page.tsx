"use client";


import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Lock, Filter, Pencil, XCircle, Plus } from "lucide-react";
import clsx from "clsx";
import { Spinner } from "@/components/ui/spinner";
import type { ApiResponse, Booking, BookingStatus } from "@/types/index";
import type { LockCode } from "@/types/lock-codes";

type FilterKey = "upcoming" | "checked_in" | "past";

const filters: { key: FilterKey; label: string; matches: BookingStatus[] }[] = [
  { key: "upcoming", label: "Upcoming", matches: ["upcoming"] },
  { key: "checked_in", label: "Checked In", matches: ["checked_in"] },
  { key: "past", label: "Past", matches: ["checked_out", "cancelled"] },
];

export default function AdminLockCodesPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [codes, setCodes] = useState<Record<string, LockCode | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("upcoming");
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [bRes, cRes] = await Promise.all([
          fetch("/api/bookings"),
          fetch("/api/admin/lock-codes"),
        ]);
        const bJson: ApiResponse<Booking[]> = await bRes.json();
        const cJson: ApiResponse<LockCode[]> = await cRes.json();
        if (cancelled) return;
        setBookings(bJson.data ?? []);
        const map: Record<string, LockCode> = {};
        for (const code of cJson.data ?? []) {
          if (!code.revoked_at) map[code.booking_id] = code;
        }
        setCodes(map);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const allowed = filters.find((f) => f.key === filter)?.matches ?? [];
    return bookings.filter((b) => allowed.includes(b.status));
  }, [bookings, filter]);

  async function handleRevoke(codeId: string, bookingId: string) {
    if (!confirm("Revoke this lock code? The guest will no longer see it.")) {
      return;
    }
    setRevoking(codeId);
    try {
      const res = await fetch(`/api/admin/lock-codes/${codeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revoke: true }),
      });
      if (res.ok) {
        setCodes((prev) => {
          const next = { ...prev };
          delete next[bookingId];
          return next;
        });
      }
    } finally {
      setRevoking(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lock Codes</h1>
        <p className="mt-1 text-sm text-sand-500">
          Issue and revoke per-booking access codes. Guests only see the code
          once your reveal conditions are met.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm text-sand-500">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filter:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={clsx(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f.key
                  ? "border-gold-500 bg-gold-50 text-gold-700"
                  : "border-sand-200 bg-white text-sand-600 hover:bg-sand-50"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-sand-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-100 text-left">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sand-500">
                  Booking
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sand-500">
                  Dates
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sand-500">
                  Lock Code
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sand-500">
                  Reveal After
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sand-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12">
                    <div className="flex justify-center">
                      <Spinner />
                    </div>
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-sand-400"
                  >
                    No bookings in this filter.
                  </td>
                </tr>
              ) : (
                visible.map((booking) => {
                  const code = codes[booking.id];
                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-sand-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {booking.site_or_room ?? "—"}
                        </p>
                        <p className="text-xs text-sand-400">
                          {booking.property?.name ?? booking.property_id}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-sand-700">
                        {format(parseISO(booking.check_in), "MMM d")} —{" "}
                        {format(parseISO(booking.check_out), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        {code ? (
                          <div className="flex items-center gap-2">
                            <Lock className="h-3.5 w-3.5 text-gold-600" />
                            <span className="font-mono text-sm font-semibold text-gray-900">
                              {code.code}
                            </span>
                            {code.source === "nextlock" && (
                              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                NextLock
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-sand-400">No code</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-sand-600">
                        {code ? labelForReveal(code.reveal_after) : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/lock-codes/${booking.id}`}
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-gold-50 px-3 text-xs font-semibold text-gold-700 transition-colors hover:bg-gold-100"
                          >
                            {code ? (
                              <>
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" />
                                Add
                              </>
                            )}
                          </Link>
                          {code && (
                            <button
                              type="button"
                              disabled={revoking === code.id}
                              onClick={() => handleRevoke(code.id, booking.id)}
                              className="inline-flex h-8 items-center gap-1 rounded-lg bg-red-50 px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function labelForReveal(value: string) {
  switch (value) {
    case "paid_and_checkin":
      return "Paid & checked in";
    case "paid":
      return "Paid only";
    case "always":
      return "Always";
    default:
      return value;
  }
}
