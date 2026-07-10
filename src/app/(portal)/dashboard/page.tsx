"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarDays,
  Receipt,
  FileText,
  Phone,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

import { Card, CardBody } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useGuest } from "@/lib/context/guest-context";
import type { Booking, Guest, ApiResponse } from "@/types/index";

function dollars(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

interface UpcomingEvent {
  id: string;
  title: string;
  location?: string | null;
  starts_at?: string | null;
}

/**
 * Dashboard, "one thing at a time" edition.
 *
 * Design goals (older guests, mostly on phones):
 * - Larger type (17-18px body, 26px greeting) and 56px primary buttons.
 * - One column. No side-by-side grids on mobile.
 * - Everything that needs action lives in ONE "needs your attention"
 *   block at the top: balance + unsigned documents.
 * - Quick actions are full-width tappable rows, not a 2x2 icon grid.
 * - Recent Activity and the Local Guide are intentionally NOT here —
 *   activity lives on the bookings/payments pages, the guide gets its
 *   own page. The dashboard is for what the guest needs right now.
 */
export default function DashboardPage() {
  const { property } = useGuest();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [docsDue, setDocsDue] = useState({ rules: 0, served: 0 });
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bRes, gRes, rRes, sRes, eRes] = await Promise.all([
          fetch("/api/bookings"),
          fetch("/api/guest/profile"),
          fetch("/api/documents/rules"),
          fetch("/api/documents/served"),
          fetch("/api/events?upcoming=true&limit=3"),
        ]);
        const bJson: ApiResponse<Booking[]> = await bRes.json();
        if (cancelled) return;
        if (bJson.error || !bJson.data) {
          setError(bJson.error ?? "Failed to load your portal data");
          return;
        }
        setBookings(bJson.data);
        if (gRes.ok) {
          const gJson: ApiResponse<Guest> = await gRes.json();
          if (!cancelled && gJson.data) setGuest(gJson.data);
        }
        const rJson = rRes.ok
          ? ((await rRes.json()) as ApiResponse<{ outstandingCount: number }>)
          : null;
        const sJson = sRes.ok
          ? ((await sRes.json()) as ApiResponse<{ outstandingCount: number }>)
          : null;
        const eJson = eRes.ok ? await eRes.json() : { data: [] };
        if (!cancelled) {
          setDocsDue({
            rules: rJson?.data?.outstandingCount ?? 0,
            served: sJson?.data?.outstandingCount ?? 0,
          });
          setEvents(Array.isArray(eJson?.data) ? eJson.data : []);
        }
      } catch {
        if (!cancelled) setError("Could not reach the portal service.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // account_balance is account-wide and repeats across a guest's
  // bookings, so the outstanding total is the max — not the sum.
  const totalBalance = useMemo(
    () => (bookings ? Math.max(0, ...bookings.map((b) => b.balance_due), 0) : 0),
    [bookings],
  );

  const currentBooking = useMemo(
    () =>
      bookings
        ?.filter((b) => b.status === "upcoming" || b.status === "checked_in")
        .sort(
          (a, b) =>
            new Date(a.check_in).getTime() - new Date(b.check_in).getTime(),
        )[0],
    [bookings],
  );

  const needsSignature = docsDue.rules > 0;
  const attentionCount = (totalBalance > 0 ? 1 : 0) + (needsSignature ? 1 : 0);

  const phone = property?.contact_info?.phone;
  const officeHours = property?.contact_info?.office_hours;

  if (error) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <Card className="border-red-200 bg-red-50">
          <CardBody>
            <p className="text-[17px] font-semibold text-red-800">
              Couldn&apos;t load your dashboard
            </p>
            <p className="mt-1 text-[17px] text-red-700">{error}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!bookings) {
    return (
      <div className="mx-auto flex w-full max-w-2xl justify-center pt-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Greeting — plain text, not a card. */}
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-gray-900">
          Welcome back{guest?.first_name ? `, ${guest.first_name}` : ""}
        </h1>
        <p className="mt-1.5 text-[17px] text-sand-800">
          {format(new Date(), "EEEE, MMMM d")}
          {currentBooking?.site_or_room && (
            <>
              {" · "}You&apos;re in{" "}
              <strong className="font-semibold text-gray-900">
                {currentBooking.site_or_room}
              </strong>
            </>
          )}
        </p>
      </div>

      {/* Needs your attention — balance + unsigned docs in one place. */}
      {attentionCount > 0 ? (
        <div className="rounded-[14px] border border-gold-200 bg-gold-50 p-5">
          <p className="text-[15px] font-bold uppercase tracking-wide text-gold-700">
            {attentionCount === 1
              ? "1 thing needs your attention"
              : `${attentionCount} things need your attention`}
          </p>

          {totalBalance > 0 && (
            <div className="mt-4">
              <p className="text-[17px] text-gold-950">
                Your balance for this stay
              </p>
              <p className="mt-0.5 text-[34px] font-extrabold tracking-tight text-gray-900">
                {dollars(totalBalance)}
              </p>
              <Link href="/payments" className="mt-3 block">
                <span className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[10px] bg-gold-600 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-gold-700 active:bg-gold-800">
                  Pay {dollars(totalBalance)} now
                  <ChevronRight className="h-5 w-5" />
                </span>
              </Link>
            </div>
          )}

          {needsSignature && (
            <div
              className={
                totalBalance > 0 ? "mt-5 border-t border-gold-200 pt-4" : "mt-4"
              }
            >
              <p className="text-[17px] text-gold-950">
                The park rules need your signature
              </p>
              <Link href="/documents" className="mt-3 block">
                <span className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-gold-600 bg-white text-lg font-semibold text-gold-700 transition-colors hover:bg-gold-50 active:bg-gold-100">
                  Review &amp; sign
                  <ChevronRight className="h-5 w-5" />
                </span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-[17px] font-semibold text-gray-900">
                All caught up!
              </p>
              <p className="text-[15px] text-sand-800">
                No balance due, nothing to sign.
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Current / upcoming stay. */}
      {currentBooking && (
        <Card className="rounded-[14px]">
          <CardBody className="!p-5">
            <p className="text-[15px] font-bold uppercase tracking-wide text-sand-700">
              {currentBooking.status === "checked_in"
                ? "Your current stay"
                : "Your upcoming stay"}
            </p>
            <p className="mt-2.5 text-[22px] font-bold text-gray-900">
              {currentBooking.site_or_room ?? "Your stay"}
            </p>
            <dl className="mt-3 space-y-2 text-[17px]">
              <div className="flex justify-between">
                <dt className="text-sand-800">
                  {currentBooking.status === "checked_in"
                    ? "Checked in"
                    : "Check-in"}
                </dt>
                <dd className="font-semibold text-gray-900">
                  {format(new Date(currentBooking.check_in), "EEEE, MMMM d")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sand-800">Checking out</dt>
                <dd className="font-semibold text-gray-900">
                  {format(new Date(currentBooking.check_out), "EEEE, MMMM d")}
                </dd>
              </div>
            </dl>
            <Link href={`/bookings/${currentBooking.id}`} className="mt-4 block">
              <span className="flex min-h-[52px] w-full items-center justify-center rounded-[10px] border border-sand-300 bg-sand-50 text-[17px] font-semibold text-gray-900 transition-colors hover:bg-sand-100 active:bg-sand-200">
                View stay details
              </span>
            </Link>
          </CardBody>
        </Card>
      )}

      {/* Quick actions — full-width rows, 64px tall. */}
      <Card className="overflow-hidden rounded-[14px]">
        <nav className="divide-y divide-sand-100">
          {(
            [
              { label: "My bookings", icon: CalendarDays, href: "/bookings" },
              {
                label: "Payments & receipts",
                icon: Receipt,
                href: "/payments",
              },
              { label: "My documents", icon: FileText, href: "/documents" },
            ] as const
          ).map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex min-h-[64px] items-center gap-4 px-5 transition-colors hover:bg-sand-50 active:bg-sand-100"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-50">
                <action.icon className="h-[22px] w-[22px] text-gold-700" />
              </span>
              <span className="flex-1 text-lg font-semibold text-gray-900">
                {action.label}
              </span>
              <ChevronRight className="h-[22px] w-[22px] shrink-0 text-sand-500" />
            </Link>
          ))}
          {phone && (
            <a
              href={`tel:${phone.replace(/[^\d+]/g, "")}`}
              className="flex min-h-[64px] items-center gap-4 px-5 transition-colors hover:bg-sand-50 active:bg-sand-100"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-50">
                <Phone className="h-[22px] w-[22px] text-gold-700" />
              </span>
              <span className="flex-1">
                <span className="block text-lg font-semibold text-gray-900">
                  Call the office
                </span>
                <span className="block text-[15px] text-sand-800">
                  {phone}
                  {officeHours ? ` · Open ${officeHours}` : ""}
                </span>
              </span>
              <ChevronRight className="h-[22px] w-[22px] shrink-0 text-sand-500" />
            </a>
          )}
        </nav>
      </Card>

      {/* This week at the park. */}
      {events.length > 0 && (
        <Card className="rounded-[14px]">
          <CardBody className="!p-5">
            <p className="text-[15px] font-bold uppercase tracking-wide text-sand-700">
              This week at the park
            </p>
            <ul className="mt-3.5 space-y-3.5">
              {events.map((e) => (
                <li key={e.id} className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-gold-50">
                    <CalendarDays className="h-5 w-5 text-gold-700" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold text-gray-900">
                      {e.title}
                    </span>
                    <span className="block text-[15px] text-sand-800">
                      {e.starts_at
                        ? format(new Date(e.starts_at), "EEE, MMM d · h:mm a")
                        : "Schedule TBD"}
                      {e.location ? ` · ${e.location}` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* Ownership footer. */}
      <div className="px-3 pb-2 text-center">
        <p className="text-sm leading-relaxed text-sand-700">
          {property?.name ?? "This park"} is proudly owned and operated by{" "}
          <strong className="font-semibold text-sand-900">
            Lighthouse Communities
          </strong>
          .
        </p>
        {phone && (
          <p className="mt-1 text-sm text-sand-500">
            Questions? We answer the phone. {phone}
          </p>
        )}
      </div>
    </div>
  );
}
