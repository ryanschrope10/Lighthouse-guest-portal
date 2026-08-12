"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import clsx from "clsx";
import type { Notification, ApiResponse } from "@/types/index";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  // Re-count on navigation so the badge clears after the guest reads them.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        const json: ApiResponse<Notification[]> = await res.json();
        if (cancelled || !json.data) return;
        setUnreadCount(json.data.filter((n) => !n.read).length);
      } catch {
        // Leave the badge hidden rather than showing a made-up count.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

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
