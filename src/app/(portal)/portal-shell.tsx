"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Home,
  CalendarDays,
  CreditCard,
  FileText,
  User,
  LogOut,
  MoreHorizontal,
  Phone,
} from "lucide-react";
import clsx from "clsx";
import { NotificationBell } from "@/components/notification-bell";
import { useGuest } from "@/lib/context/guest-context";

/**
 * Portal shell, "one thing at a time" edition.
 *
 * - Mobile bottom nav goes from 5 items to 4 (Home, My Stay, Payments,
 *   More) with 12px labels and 26px icons. Documents and Profile live
 *   under More; documents are also reachable from the dashboard rows.
 * - Desktop sidebar: 16px nav text, 14px vertical padding per item,
 *   ownership line pinned to the bottom.
 * - Desktop header shows today's date and a tap-to-call office chip.
 */

const sidebarItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/bookings", label: "My Stay", icon: CalendarDays },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/profile", label: "My Profile", icon: User },
] as const;

const mobileItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/bookings", label: "My Stay", icon: CalendarDays },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/profile", label: "More", icon: MoreHorizontal },
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
          variant === "sidebar" ? "h-16 max-w-full" : "h-11 max-w-[180px]",
        )}
      />
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base font-bold text-white"
        style={{ backgroundColor: color || "#b47a24" }}
      >
        {monogram(name)}
      </div>
      <span
        className={clsx(
          "font-semibold text-gray-900",
          variant === "sidebar"
            ? "line-clamp-2 text-base leading-tight"
            : "truncate text-lg",
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
  const { property } = useGuest();

  const parkName = property?.name ?? "Guest Portal";
  const logoUrl = property?.branding?.logo_url;
  const brandColor = property?.branding?.primary_color;
  const phone = property?.contact_info?.phone;

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
    <div className="min-h-screen bg-white md:flex md:bg-sand-50">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-sand-200 bg-white">
        <div className="flex h-24 items-center justify-center border-b border-sand-200 px-5">
          <BrandMark
            name={parkName}
            logoUrl={logoUrl}
            color={brandColor}
            variant="sidebar"
          />
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-5">
          {sidebarItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3.5 rounded-[10px] px-4 py-3.5 text-base transition-colors",
                  active
                    ? "bg-gold-50 font-semibold text-gold-700"
                    : "font-medium text-sand-800 hover:bg-sand-50 hover:text-gray-900",
                )}
              >
                <item.icon
                  className={clsx(
                    "h-[22px] w-[22px] flex-shrink-0",
                    active ? "text-gold-600" : "text-sand-600",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-sand-200 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3.5 rounded-[10px] px-4 py-3 text-base font-medium text-sand-800 transition-colors hover:bg-sand-50 hover:text-gray-900"
          >
            <LogOut className="h-[22px] w-[22px] flex-shrink-0 text-sand-600" />
            Log out
          </button>
          <p className="px-4 pb-1 text-[13px] leading-relaxed text-sand-700">
            Owned &amp; operated by
            <br />
            <strong className="font-semibold text-sand-900">
              Lighthouse Communities
            </strong>
          </p>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Mobile top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-sand-200 bg-white px-5 md:hidden">
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
        <header className="sticky top-0 z-30 hidden md:flex h-[72px] items-center justify-between border-b border-sand-200 bg-white px-10">
          <p className="text-base text-sand-800">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
          <div className="flex items-center gap-4">
            {phone && (
              <a
                href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                className="flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-2 text-[15px] font-semibold text-gold-700 transition-colors hover:bg-gold-100"
              >
                <Phone className="h-4 w-4" />
                {phone}
              </a>
            )}
            <NotificationBell unreadCount={3} />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-5 py-6 pb-28 md:px-10 md:py-10 md:pb-10">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation — 4 items, bigger labels ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-white md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex h-[72px] items-center">
          {mobileItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 transition-colors",
                  active ? "text-gold-700" : "text-sand-700 active:text-gold-700",
                )}
              >
                <item.icon
                  className="h-[26px] w-[26px]"
                  strokeWidth={active ? 2.25 : 1.75}
                />
                <span
                  className={clsx(
                    "text-xs leading-tight",
                    active ? "font-bold" : "font-medium",
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
