"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Receipt,
  FileText,
  User,
  LogOut,
} from "lucide-react";
import clsx from "clsx";
import { NotificationBell } from "@/components/notification-bell";
import { useGuest } from "@/lib/context/guest-context";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/payments", label: "Payments", icon: Receipt },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/profile", label: "Profile", icon: User },
] as const;

function monogram(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "G";
}

/**
 * The park's brand block. When a real logo loads it stands alone —
 * no monogram, no name text. Parks without a logo fall back to a
 * brand-colored monogram + name so the header is never blank.
 */
function BrandMark({
  name,
  logoUrl,
  color,
  variant,
}: {
  name: string;
  logoUrl?: string;
  color?: string;
  variant: "sidebar" | "header";
}) {
  // Preload the logo and only swap it in once it actually loads, so a
  // missing file never flashes broken-image alt text.
  const [logoOk, setLogoOk] = useState(false);

  useEffect(() => {
    if (!logoUrl) return;
    let active = true;
    const img = new Image();
    img.onload = () => active && setLogoOk(true);
    img.onerror = () => active && setLogoOk(false);
    img.src = logoUrl;
    return () => {
      active = false;
    };
  }, [logoUrl]);

  if (logoUrl && logoOk) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name}
        className={clsx(
          "w-auto object-contain",
          variant === "sidebar" ? "h-12 max-w-[200px]" : "h-9 max-w-[150px]",
        )}
      />
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
        style={{ backgroundColor: color || "#b47a24" }}
      >
        {monogram(name)}
      </div>
      <span
        className={clsx(
          "font-semibold text-gray-900",
          variant === "sidebar"
            ? "line-clamp-2 text-base leading-tight"
            : "truncate text-base",
        )}
      >
        {name}
      </span>
    </div>
  );
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { guest, property } = useGuest();

  const parkName = property?.name ?? "Guest Portal";
  const logoUrl = property?.branding?.logo_url;
  const brandColor = property?.branding?.primary_color;
  const guestName = guest?.first_name ?? "Guest";

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
        <div className="flex h-16 items-center justify-center border-b border-sand-200 px-6">
          <BrandMark
            name={parkName}
            logoUrl={logoUrl}
            color={brandColor}
            variant="sidebar"
          />
        </div>

        <div className="px-6 py-4 border-b border-sand-100">
          <p className="text-xs font-medium uppercase tracking-wide text-sand-500">
            Welcome back
          </p>
          <p className="mt-0.5 text-sm font-semibold text-gray-900 truncate">
            {guestName}
          </p>
        </div>

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
          <div className="flex min-w-0 items-center">
            <BrandMark
              name={parkName}
              logoUrl={logoUrl}
              color={brandColor}
              variant="header"
            />
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
