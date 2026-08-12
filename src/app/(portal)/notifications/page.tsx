"use client";

import { useState, useCallback, useEffect } from "react";
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
import { Spinner } from "@/components/ui/spinner";
import type { Notification, ApiResponse } from "@/types/index";

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
// Category is not a column on `notifications` — staff write a title and body.
// Derive it from the text so the icon matches the message; anything we can't
// classify falls back to a neutral bell.
// ---------------------------------------------------------------------------

function categorize(title: string, body: string): NotificationCategory {
  const text = `${title} ${body}`.toLowerCase();
  if (/weather|storm|emergency|alert|closure|closed|maintenance|outage|water|power/.test(text))
    return "park_alert";
  if (/payment|invoice|balance|due|charge|autopay/.test(text))
    return "payment_reminder";
  if (/document|insurance|registration|expire|expiring|expired/.test(text))
    return "document_expiry";
  if (/check-?in|check-?out|reservation|booking|arrival|departure|stay/.test(text))
    return "booking_reminder";
  return "general";
}

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
  const [notifications, setNotifications] = useState<
    ExtendedNotification[] | null
  >(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/notifications");
        const json: ApiResponse<Notification[]> = await res.json();
        if (cancelled) return;
        if (!res.ok || json.error || !json.data) {
          setLoadError(json.error ?? "We couldn't load your notifications.");
          setNotifications([]);
          return;
        }
        setNotifications(
          json.data.map((n) => ({
            ...n,
            category: categorize(n.title, n.body ?? ""),
          })),
        );
      } catch {
        if (!cancelled) {
          setLoadError("Could not reach the server.");
          setNotifications([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const unreadCount = (notifications ?? []).filter((n) => !n.read).length;

  /** Persist read receipts, then reflect them locally. */
  const markRead = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    setNotifications((prev) =>
      (prev ?? []).map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)),
    );
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_ids: ids }),
      });
    } catch {
      // Receipt failed to save; it'll show unread again on next load, which
      // is the honest outcome — don't pretend otherwise.
      setNotifications((prev) =>
        (prev ?? []).map((n) =>
          ids.includes(n.id) ? { ...n, read: false } : n,
        ),
      );
    }
  }, []);

  const markAllRead = useCallback(() => {
    markRead((notifications ?? []).filter((n) => !n.read).map((n) => n.id));
  }, [notifications, markRead]);

  const toggleExpand = useCallback(
    (id: string) => {
      const notif = (notifications ?? []).find((n) => n.id === id);
      if (notif && !notif.read) markRead([id]);
      setExpandedId((prev) => (prev === id ? null : id));
    },
    [notifications, markRead],
  );

  if (notifications === null) {
    return (
      <div>
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
        <div className="mt-12 flex justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{loadError}</p>
        </div>
      </div>
    );
  }

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
