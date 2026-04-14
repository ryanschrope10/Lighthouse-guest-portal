"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Bell,
  FileText,
  Building2,
  ShieldCheck,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";
import clsx from "clsx";

// TODO: Check for admin role — redirect non-admins away from /admin routes

const adminNav = [
  { href: "/admin", label: "Dashboard / Analytics", icon: LayoutDashboard },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/content", label: "Content Management", icon: FileText },
  { href: "/admin/properties", label: "Properties", icon: Building2 },
  { href: "/admin/documents", label: "Guest Documents", icon: ShieldCheck },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <>
      {/* Branding */}
      <div className="flex h-16 items-center gap-3 border-b border-sand-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-600 text-white text-sm font-bold">
          L
        </div>
        <span className="text-base font-semibold text-gray-900">
          Admin Panel
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {adminNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
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
              {active && (
                <span className="ml-auto h-2 w-2 rounded-full bg-gold-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Back to Portal */}
      <div className="border-t border-sand-200 p-3">
        <Link
          href="/dashboard"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sand-600 transition-colors hover:bg-sand-50 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 flex-shrink-0 text-sand-400" />
          Back to Portal
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-sand-50 md:flex">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-sand-200 bg-white">
        {sidebarContent}
      </aside>

      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar Drawer ── */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl transition-transform duration-200 md:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* ── Main Content ── */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-sand-200 bg-white px-4 md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-sand-100"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5 text-sand-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gold-600 text-white text-xs font-bold">
              L
            </div>
            <span className="text-sm font-semibold text-gray-900">Admin</span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-sand-100 opacity-0 pointer-events-none"
            aria-hidden
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Desktop header */}
        <header className="sticky top-0 z-30 hidden md:flex h-16 items-center justify-between border-b border-sand-200 bg-white px-6">
          <h1 className="text-sm font-medium text-sand-500">
            Lighthouse Administration
          </h1>
          <div className="flex items-center gap-2 text-sm text-sand-600">
            <div className="h-8 w-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-700 font-semibold text-xs">
              A
            </div>
            <span className="font-medium text-gray-900">Admin</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
