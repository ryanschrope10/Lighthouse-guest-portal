"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Receipt,
  User,
  LogOut,
} from "lucide-react";
import clsx from "clsx";
import { NotificationBell } from "@/components/notification-bell";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/payments", label: "Payments", icon: Receipt },
  { href: "/profile", label: "Profile", icon: User },
] as const;

interface PortalShellProps {
  guestName: string;
  children: React.ReactNode;
}

export function PortalShell({ guestName, children }: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-sand-50 md:flex">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r border-sand-200 bg-white">
        {/* Sidebar header */}
        <div className="flex h-16 items-center gap-3 border-b border-sand-200 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-600 text-white text-sm font-bold">
            L
          </div>
          <span className="text-base font-semibold text-gray-900">
            Guest Portal
          </span>
        </div>

        {/* Guest name */}
        <div className="px-6 py-4 border-b border-sand-100">
          <p className="text-xs font-medium uppercase tracking-wide text-sand-500">
            Welcome back
          </p>
          <p className="mt-0.5 text-sm font-semibold text-gray-900 truncate">
            {guestName}
          </p>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-gold-50 text-gold-700"
                    : "text-sand-600 hover:bg-sand-50 hover:text-gray-900"
                )}
              >
                <item.icon
                  className={clsx(
                    "h-5 w-5 flex-shrink-0",
                    active ? "text-gold-600" : "text-sand-400"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-sand-200 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sand-600 transition-colors hover:bg-sand-50 hover:text-gray-900"
          >
            <LogOut className="h-5 w-5 flex-shrink-0 text-sand-400" />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex flex-1 flex-col md:pl-60">
        {/* Mobile top header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-sand-200 bg-white px-4 md:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gold-600 text-white text-xs font-bold">
              L
            </div>
            <span className="text-base font-semibold text-gray-900">
              Guest Portal
            </span>
          </div>
          <NotificationBell unreadCount={3} />
        </header>

        {/* Desktop top header */}
        <header className="sticky top-0 z-30 hidden md:flex h-16 items-center justify-end border-b border-sand-200 bg-white px-6">
          <NotificationBell unreadCount={3} />
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 pb-24 md:px-6 md:py-8 md:pb-8">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-white md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex h-16 items-center justify-around">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1 transition-colors",
                  active
                    ? "text-gold-600"
                    : "text-sand-500 active:text-gold-600"
                )}
              >
                <item.icon
                  className={clsx(
                    "h-6 w-6",
                    active ? "text-gold-600" : "text-sand-500"
                  )}
                  strokeWidth={active ? 2.25 : 1.75}
                />
                <span
                  className={clsx(
                    "text-[10px] leading-tight",
                    active ? "font-semibold text-gold-600" : "font-medium text-sand-500"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
