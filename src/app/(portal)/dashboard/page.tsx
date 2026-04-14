"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format, formatDistanceToNow, isPast, differenceInDays } from "date-fns";
import {
  DollarSign,
  CalendarDays,
  Upload,
  Phone,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  FileWarning,
  FileSignature,
  CreditCard,
  MapPin,
  Clock,
  LogIn,
  Banknote,
  FileText,
  Bell,
} from "lucide-react";

import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  mockGuest,
  mockProperty,
  mockBookings,
  mockInvoices,
  mockDocuments,
  mockActivity,
  type ActivityItem,
} from "@/lib/mock-data";
import type { Booking, Invoice, GuestDocument } from "@/types/index";

// ------------------------------------------------------------------
// Helper: format currency
// ------------------------------------------------------------------
function dollars(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// ------------------------------------------------------------------
// Helper: activity icon
// ------------------------------------------------------------------
function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  const base = "h-4 w-4";
  switch (type) {
    case "payment":
      return <Banknote className={`${base} text-green-600`} />;
    case "booking":
      return <CalendarDays className={`${base} text-blue-600`} />;
    case "document":
      return <FileText className={`${base} text-gold-600`} />;
    case "checkin":
      return <LogIn className={`${base} text-gold-700`} />;
    case "notification":
      return <Bell className={`${base} text-amber-500`} />;
    default:
      return <Clock className={`${base} text-sand-500`} />;
  }
}

// ------------------------------------------------------------------
// Derived data
// ------------------------------------------------------------------
function useAlerts(
  invoices: Invoice[],
  documents: GuestDocument[],
): { id: string; icon: React.ReactNode; label: string; href: string }[] {
  return useMemo(() => {
    const alerts: { id: string; icon: React.ReactNode; label: string; href: string }[] = [];

    // Overdue invoices
    const overdue = invoices.filter((i) => i.status === "overdue");
    overdue.forEach((inv) => {
      alerts.push({
        id: `overdue-${inv.id}`,
        icon: <CreditCard className="h-5 w-5 text-red-500" />,
        label: `Overdue: ${inv.description ?? dollars(inv.amount)}`,
        href: "/payments",
      });
    });

    // Expiring / expired insurance
    const now = new Date();
    documents
      .filter((d) => d.type === "insurance" && d.expires_at)
      .forEach((doc) => {
        const exp = new Date(doc.expires_at!);
        const daysLeft = differenceInDays(exp, now);
        if (isPast(exp)) {
          alerts.push({
            id: `expired-${doc.id}`,
            icon: <FileWarning className="h-5 w-5 text-red-500" />,
            label: `Expired: ${doc.label ?? "Insurance document"}`,
            href: "/documents",
          });
        } else if (daysLeft <= 30) {
          alerts.push({
            id: `expiring-${doc.id}`,
            icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
            label: `Expiring in ${daysLeft} days: ${doc.label ?? "Insurance"}`,
            href: "/documents",
          });
        }
      });

    // Unsigned documents (file_path is empty)
    documents
      .filter((d) => d.type === "signed_agreement" && !d.file_path && !d.verified_at)
      .forEach((doc) => {
        alerts.push({
          id: `unsigned-${doc.id}`,
          icon: <FileSignature className="h-5 w-5 text-amber-600" />,
          label: `Needs signature: ${doc.label ?? "Document"}`,
          href: "/documents",
        });
      });

    return alerts;
  }, [invoices, documents]);
}

// ------------------------------------------------------------------
// Dashboard Page
// ------------------------------------------------------------------
export default function DashboardPage() {
  // TODO: Replace with useGuest() and fetched data once Supabase is wired up
  const guest = mockGuest;
  const property = mockProperty;
  const bookings = mockBookings;
  const invoices = mockInvoices;
  const documents = mockDocuments;
  const activity = mockActivity;

  // Total outstanding balance
  const totalBalance = bookings.reduce((sum, b) => sum + b.balance_due, 0);

  // Next upcoming booking
  const upcomingBooking = bookings
    .filter((b) => b.status === "upcoming" || b.status === "checked_in")
    .sort(
      (a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime(),
    )[0] as Booking | undefined;

  // Alerts
  const alerts = useAlerts(invoices, documents);

  // Current date formatted
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-6 sm:px-6">
      {/* --------------------------------------------------------- */}
      {/* 1. Welcome Card                                           */}
      {/* --------------------------------------------------------- */}
      <Card className="mb-4 border-gold-100 bg-gold-50">
        <CardBody>
          <h1 className="text-xl font-semibold text-gray-900">
            Welcome back, {guest.first_name}
          </h1>
          <p className="mt-1 text-sm text-sand-600">{today}</p>
          {property.branding.welcome_message && (
            <p className="mt-2 text-sm text-sand-700">
              {property.branding.welcome_message}
            </p>
          )}
        </CardBody>
      </Card>

      {/* --------------------------------------------------------- */}
      {/* 2. Outstanding Balance                                    */}
      {/* --------------------------------------------------------- */}
      <Card className="mb-4">
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

      {/* --------------------------------------------------------- */}
      {/* 3. Upcoming / Current Booking                             */}
      {/* --------------------------------------------------------- */}
      <Card className="mb-4">
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
                    {property.name}
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
                    {format(new Date(upcomingBooking.check_out), "MMM d, yyyy")}
                  </div>
                </div>
                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-sand-400" />
              </div>
            </Link>
          ) : (
            <div className="text-center py-2">
              <p className="text-sand-600">No upcoming stays</p>
              <Link href="/bookings" className="mt-3 inline-block">
                <Button variant="secondary" size="sm">
                  Book Now
                </Button>
              </Link>
            </div>
          )}
        </CardBody>
      </Card>

      {/* --------------------------------------------------------- */}
      {/* 4. Action Needed Alerts                                   */}
      {/* --------------------------------------------------------- */}
      {alerts.length > 0 && (
        <Card className="mb-4">
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
                    <div className="shrink-0">{alert.icon}</div>
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

      {/* --------------------------------------------------------- */}
      {/* 5. Quick Actions Grid (2x2)                               */}
      {/* --------------------------------------------------------- */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {(
          [
            {
              label: "Pay Balance",
              icon: DollarSign,
              href: "/payments",
            },
            {
              label: "My Bookings",
              icon: CalendarDays,
              href: "/bookings",
            },
            {
              label: "Upload Doc",
              icon: Upload,
              href: "/documents",
            },
            {
              label: "Contact Us",
              icon: Phone,
              href: "/contact",
            },
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

      {/* --------------------------------------------------------- */}
      {/* 6. Recent Activity                                        */}
      {/* --------------------------------------------------------- */}
      <Card>
        <CardBody className="!py-0">
          <p className="pb-2 pt-4 text-xs font-medium uppercase tracking-wide text-sand-500">
            Recent Activity
          </p>
          <ul className="divide-y divide-sand-100">
            {activity.slice(0, 5).map((item) => (
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
    </div>
  );
}
