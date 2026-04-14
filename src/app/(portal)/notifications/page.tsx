"use client";

import { useState, useCallback } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  AlertTriangle,
  CalendarDays,
  DollarSign,
  FileWarning,
  Bell,
  CheckCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { Notification } from "@/types/index";

// ---------------------------------------------------------------------------
// Extended notification type with a "category" field for icon mapping
// ---------------------------------------------------------------------------

type NotificationCategory =
  | "park_alert"
  | "booking_reminder"
  | "payment_reminder"
  | "document_expiry"
  | "general";

interface ExtendedNotification extends Notification {
  category: NotificationCategory;
}

// ---------------------------------------------------------------------------
// Mock data — realistic RV park guest notifications
// ---------------------------------------------------------------------------

const mockNotifications: ExtendedNotification[] = [
  {
    id: "notif_010",
    property_id: "prop_001",
    target_type: "all_guests",
    target_id: null,
    title: "Severe Weather Advisory",
    body: "The National Weather Service has issued a severe thunderstorm warning for our area from 4 PM to 9 PM today. Please secure all outdoor furniture and awnings. The pool and playground will be closed during the advisory period. Shelter is available at the main clubhouse. Call the front desk at (512) 555-0147 if you need assistance.",
    channel: "push",
    sent_at: "2026-04-14T10:30:00Z",
    created_by: "staff_001",
    read: false,
    category: "park_alert",
  },
  {
    id: "notif_011",
    property_id: "prop_001",
    target_type: "specific_guest",
    target_id: "guest_001",
    title: "Payment Reminder — Balance Due",
    body: "You have an outstanding balance of $245.00 for your current stay at Site B-07. Please make a payment at your earliest convenience to keep your account current. You can pay online through the Payments section of your guest portal.",
    channel: "both",
    sent_at: "2026-04-14T08:00:00Z",
    created_by: null,
    read: false,
    category: "payment_reminder",
  },
  {
    id: "notif_001",
    property_id: "prop_001",
    target_type: "all_guests",
    target_id: null,
    title: "Pool Hours Extended",
    body: "Great news! The pool will now be open until 10 PM on Fridays and Saturdays through the end of summer. Towels are available at the pool house. Remember: no glass containers in the pool area.",
    channel: "push",
    sent_at: "2026-04-13T09:00:00Z",
    created_by: "staff_001",
    read: false,
    category: "general",
  },
  {
    id: "notif_002",
    property_id: "prop_001",
    target_type: "specific_guest",
    target_id: "guest_001",
    title: "Insurance Expiring Soon",
    body: "Your RV insurance document expires on April 20. Please upload a current copy to avoid any issues. You can upload documents from the Documents section of your guest portal.",
    channel: "both",
    sent_at: "2026-04-12T08:00:00Z",
    created_by: null,
    read: true,
    category: "document_expiry",
  },
  {
    id: "notif_012",
    property_id: "prop_001",
    target_type: "specific_guest",
    target_id: "guest_001",
    title: "Check-Out Reminder",
    body: "Your current reservation at Site B-07 ends on April 19 at 11:00 AM. Please ensure your site is cleared by checkout time. If you would like to extend your stay, contact the front desk or visit Bookings in your guest portal.",
    channel: "push",
    sent_at: "2026-04-11T14:00:00Z",
    created_by: null,
    read: true,
    category: "booking_reminder",
  },
  {
    id: "notif_004",
    property_id: "prop_001",
    target_type: "all_guests",
    target_id: null,
    title: "Food Truck Friday",
    body: "Smokin' Joe's BBQ will be at the pavilion this Friday from 5-8 PM. Don't miss their brisket tacos! Cash and card accepted.",
    channel: "push",
    sent_at: "2026-04-09T10:00:00Z",
    created_by: "staff_001",
    read: true,
    category: "general",
  },
  {
    id: "notif_003",
    property_id: "prop_001",
    target_type: "specific_guest",
    target_id: "guest_001",
    title: "Booking Confirmed — Jun 20-27",
    body: "Your reservation for Site A-22 (Jun 20-27) has been confirmed. We look forward to seeing you! A deposit of $665.00 is due by June 13.",
    channel: "email",
    sent_at: "2026-04-02T15:00:00Z",
    created_by: null,
    read: true,
    category: "booking_reminder",
  },
  {
    id: "notif_013",
    property_id: "prop_001",
    target_type: "all_guests",
    target_id: null,
    title: "Water System Maintenance",
    body: "Scheduled water system maintenance will occur on March 28 from 8 AM to 12 PM. Water service may be intermittent during this period. We recommend filling portable water containers beforehand.",
    channel: "push",
    sent_at: "2026-03-26T09:00:00Z",
    created_by: "staff_001",
    read: true,
    category: "park_alert",
  },
];

// ---------------------------------------------------------------------------
// Category config — icon, color
// ---------------------------------------------------------------------------

const categoryConfig: Record<
  NotificationCategory,
  {
    icon: typeof Bell;
    bgColor: string;
    iconColor: string;
  }
> = {
  park_alert: {
    icon: AlertTriangle,
    bgColor: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  booking_reminder: {
    icon: CalendarDays,
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  payment_reminder: {
    icon: DollarSign,
    bgColor: "bg-gold-50",
    iconColor: "text-gold-600",
  },
  document_expiry: {
    icon: FileWarning,
    bgColor: "bg-red-50",
    iconColor: "text-red-600",
  },
  general: {
    icon: Bell,
    bgColor: "bg-sand-100",
    iconColor: "text-sand-600",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NotificationsPage() {
  const [notifications, setNotifications] =
    useState<ExtendedNotification[]>(mockNotifications);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const toggleExpand = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id && !n.read ? { ...n, read: true } : n)),
      );
      setExpandedId((prev) => (prev === id ? null : id));
    },
    [],
  );

  // Empty state
  if (notifications.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up. We'll let you know when something needs your attention."
          className="mt-12"
        />
      </div>
    );
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="mt-0.5 text-sm text-sand-500">
              {unreadCount} unread
            </p>
          )}
        </div>

        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification list */}
      <div className="mt-5 space-y-2">
        {notifications.map((notif) => {
          const config = categoryConfig[notif.category];
          const Icon = config.icon;
          const isExpanded = expandedId === notif.id;

          return (
            <button
              key={notif.id}
              type="button"
              onClick={() => toggleExpand(notif.id)}
              className={clsx(
                "w-full rounded-xl border bg-white text-left transition-colors",
                !notif.read
                  ? "border-gold-200 shadow-sm"
                  : "border-sand-200",
                "hover:border-sand-300 active:bg-sand-50",
              )}
            >
              <div className="flex items-start gap-3 p-4">
                {/* Icon */}
                <div
                  className={clsx(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                    config.bgColor,
                  )}
                >
                  <Icon className={clsx("h-5 w-5", config.iconColor)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={clsx(
                        "text-sm leading-snug",
                        !notif.read
                          ? "font-semibold text-gray-900"
                          : "font-medium text-gray-800",
                      )}
                    >
                      {notif.title}
                    </p>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {!notif.read && (
                        <span className="h-2.5 w-2.5 rounded-full bg-gold-500" />
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-sand-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-sand-400" />
                      )}
                    </div>
                  </div>

                  {/* Preview or full body */}
                  {isExpanded ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-sand-700">
                      {notif.body}
                    </p>
                  ) : (
                    <p className="mt-0.5 truncate text-sm text-sand-500">
                      {notif.body}
                    </p>
                  )}

                  {/* Timestamp */}
                  <p className="mt-1.5 text-xs text-sand-400">
                    {notif.sent_at
                      ? formatDistanceToNow(parseISO(notif.sent_at), {
                          addSuffix: true,
                        })
                      : "Just now"}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
