"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  DollarSign,
  CalendarDays,
  Upload,
  Phone,
  ChevronRight,
  CheckCircle2,
  CreditCard,
  MapPin,
  Clock,
  LogIn,
  Banknote,
  Bell,
  AlertCircle,
} from "lucide-react";

import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { LocalGuide } from "@/components/local-guide";
import { getLocalGuide } from "@/lib/local-guide";
import type { Booking, Guest, ApiResponse } from "@/types/index";

function dollars(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

interface ActivityItem {
  id: string;
  type: "payment" | "booking" | "checkin" | "notification";
  title: string;
  description: string;
  timestamp: string;
}

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  const base = "h-4 w-4";
  switch (type) {
    case "payment":
      return <Banknote className={`${base} text-green-600`} />;
    case "booking":
      return <CalendarDays className={`${base} text-blue-600`} />;
    case "checkin":
      return <LogIn className={`${base} text-gold-700`} />;
    case "notification":
      return <Bell className={`${base} text-amber-500`} />;
    default:
      return <Clock className={`${base} text-sand-500`} />;
  }
}

/** Build a recent-activity feed from the guest's real Newbook bookings. */
function deriveActivity(bookings: Booking[]): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const b of bookings) {
    const where = `${b.site_or_room ?? "Stay"} — ${b.property?.name ?? ""}`;
    if (b.status === "cancelled") {
      items.push({
        id: `cx-${b.id}`,
        type: "notification",
        title: "Booking cancelled",
        description: where,
        timestamp: b.synced_at,
      });
    }
    if (b.status === "checked_out") {
      items.push({
        id: `co-${b.id}`,
        type: "checkin",
        title: "Checked out",
        description: where,
        timestamp: b.check_out,
      });
    }
    if (b.status === "checked_in") {
      items.push({
        id: `ci-${b.id}`,
        type: "checkin",
        title: "Checked in",
        description: where,
        timestamp: b.check_in,
      });
    }
    items.push({
      id: `bk-${b.id}`,
      type: "booking",
      title: "Booking confirmed",
      description: `${where} — ${format(new Date(b.check_in), "MMM d")} to ${format(
        new Date(b.check_out),
        "MMM d, yyyy",
      )}`,
      timestamp: b.created_at,
    });
  }
  return items
    .filter((i) => i.timestamp)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 6);
}

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [docsDue, setDocsDue] = useState({ rules: 0, served: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bRes, gRes, rRes, sRes] = await Promise.all([
          fetch("/api/bookings"),
          fetch("/api/guest/profile"),
          fetch("/api/documents/rules"),
          fetch("/api/documents/served"),
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
        if (!cancelled) {
          setDocsDue({
            rules: rJson?.data?.outstandingCount ?? 0,
            served: sJson?.data?.outstandingCount ?? 0,
          });
        }
      } catch {
        if (!cancelled) setError("Could not reach the portal service.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const property = bookings?.find((b) => b.property)?.property ?? null;
  const guide = getLocalGuide(property?.slug);

  // account_balance is account-wide and repeats across a guest's
  // bookings, so the outstanding total is the max — not the sum.
  const totalBalance = useMemo(
    () =>
      bookings
        ? Math.max(0, ...bookings.map((b) => b.balance_due), 0)
        : 0,
    [bookings],
  );

  const upcomingBooking = useMemo(
    () =>
      bookings
        ?.filter(
          (b) => b.status === "upcoming" || b.status === "checked_in",
        )
        .sort(
          (a, b) =>
            new Date(a.check_in).getTime() - new Date(b.check_in).getTime(),
        )[0],
    [bookings],
  );

  const alerts = useMemo(() => {
    if (!bookings) return [];
    const out: { id: string; label: string; href: string }[] = [];
    for (const b of bookings) {
      for (const inv of b.invoices ?? []) {
        if (inv.status === "overdue" || inv.status === "partial") {
          out.push({
            id: `inv-${inv.id}`,
            label: `${inv.status === "overdue" ? "Overdue" : "Balance due"}: ${
              inv.description ?? dollars(inv.amount)
            }`,
            href: "/payments",
          });
        }
      }
    }
    if (docsDue.rules > 0) {
      out.push({
        id: "rr",
        label: `Rules & Regulations need signing for your reservation`,
        href: "/documents",
      });
    }
    if (docsDue.served > 0) {
      out.push({
        id: "served",
        label: `${docsDue.served} unread notice${
          docsDue.served > 1 ? "s" : ""
        } from the park`,
        href: "/documents",
      });
    }
    return out;
  }, [bookings, docsDue]);

  const activity = useMemo(
    () => (bookings ? deriveActivity(bookings) : []),
    [bookings],
  );

  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Couldn&apos;t load your dashboard
            </p>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!bookings) {
    return (
      <div className="mx-auto flex w-full max-w-6xl justify-center pt-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* 1. Welcome */}
      <Card className="border-gold-100 bg-gold-50">
        <CardBody>
          <h1 className="text-xl font-semibold text-gray-900">
            Welcome back{guest?.first_name ? `, ${guest.first_name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-sand-600">{today}</p>
          {property?.branding.welcome_message && (
            <p className="mt-2 text-sm text-sand-700">
              {property.branding.welcome_message}
            </p>
          )}
        </CardBody>
      </Card>

      <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-3 lg:gap-6">
        {/* Left / main column */}
        <div className="space-y-4 lg:col-span-2 lg:space-y-6">
      {/* 2. Outstanding Balance */}
      <Card>
        <CardBody>
          {totalBalance > 0 ? (
            <>
              <p className="text-sm font-medium text-sand-600">
                Total Balance Due
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {dollars(totalBalance)}
              </p>
              <Link href="/payments" className="mt-4 block">
                <Button className="w-full" size="lg">
                  <DollarSign className="h-5 w-5" />
                  Pay Now
                </Button>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">All caught up!</p>
                <p className="text-sm text-sand-600">
                  You have no outstanding balance.
                </p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 3. Upcoming / Current Booking */}
      <Card>
        <CardBody>
          {upcomingBooking ? (
            <Link
              href={`/bookings/${upcomingBooking.id}`}
              className="block min-h-[44px]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gold-600">
                    {upcomingBooking.status === "checked_in"
                      ? "Current Stay"
                      : "Upcoming Stay"}
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {upcomingBooking.property?.name ?? "Your stay"}
                  </p>
                  {upcomingBooking.site_or_room && (
                    <div className="mt-1 flex items-center gap-1 text-sm text-sand-600">
                      <MapPin className="h-3.5 w-3.5" />
                      {upcomingBooking.site_or_room}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-1 text-sm text-sand-600">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {format(new Date(upcomingBooking.check_in), "MMM d")}
                    {" — "}
                    {format(
                      new Date(upcomingBooking.check_out),
                      "MMM d, yyyy",
                    )}
                  </div>
                </div>
                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-sand-400" />
              </div>
            </Link>
          ) : (
            <div className="text-center py-2">
              <p className="text-sand-600">No upcoming stays</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 4. Action Needed */}
      {alerts.length > 0 && (
        <Card>
          <CardBody className="!py-0">
            <p className="pb-2 pt-4 text-xs font-medium uppercase tracking-wide text-sand-500">
              Action Needed
            </p>
            <ul className="divide-y divide-sand-100">
              {alerts.map((alert) => (
                <li key={alert.id}>
                  <Link
                    href={alert.href}
                    className="flex min-h-[44px] items-center gap-3 py-3"
                  >
                    <CreditCard className="h-5 w-5 shrink-0 text-red-500" />
                    <span className="flex-1 text-sm text-gray-800">
                      {alert.label}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-sand-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* Explore the area */}
      {guide && <LocalGuide guide={guide} />}
        </div>

        {/* Right column */}
        <div className="space-y-4 lg:space-y-6">
      {/* 5. Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            { label: "Pay Balance", icon: DollarSign, href: "/payments" },
            { label: "My Bookings", icon: CalendarDays, href: "/bookings" },
            { label: "Upload Doc", icon: Upload, href: "/documents" },
            { label: "Contact Us", icon: Phone, href: "/contact" },
          ] as const
        ).map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="transition-colors active:bg-sand-50">
              <CardBody className="flex flex-col items-center gap-2 !py-5 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-50">
                  <action.icon className="h-5 w-5 text-gold-600" />
                </div>
                <span className="text-sm font-medium text-gray-800">
                  {action.label}
                </span>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* 6. Recent Activity */}
      {activity.length > 0 && (
        <Card>
          <CardBody className="!py-0">
            <p className="pb-2 pt-4 text-xs font-medium uppercase tracking-wide text-sand-500">
              Recent Activity
            </p>
            <ul className="divide-y divide-sand-100">
              {activity.map((item) => (
                <li key={item.id} className="flex items-start gap-3 py-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sand-50">
                    <ActivityIcon type={item.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {item.title}
                    </p>
                    <p className="truncate text-sm text-sand-600">
                      {item.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-sand-500 pt-0.5">
                    {formatDistanceToNow(new Date(item.timestamp), {
                      addSuffix: true,
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
        </div>
      </div>
    </div>
  );
}
