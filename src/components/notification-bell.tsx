"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import clsx from "clsx";

interface NotificationBellProps {
  unreadCount?: number;
  className?: string;
}

export function NotificationBell({
  unreadCount = 0,
  className,
}: NotificationBellProps) {
  const hasUnread = unreadCount > 0;
  const displayCount = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Link
      href="/notifications"
      className={clsx(
        "relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-sand-100",
        className,
      )}
      aria-label={
        hasUnread
          ? `Notifications — ${unreadCount} unread`
          : "Notifications"
      }
    >
      <Bell
        className={clsx(
          "h-5 w-5",
          hasUnread ? "text-gray-900" : "text-sand-500",
        )}
      />

      {hasUnread && (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
          {displayCount}
        </span>
      )}
    </Link>
  );
}
