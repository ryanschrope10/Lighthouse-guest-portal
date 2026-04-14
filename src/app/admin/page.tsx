"use client";

// TODO: Check for admin role — redirect non-admins away from /admin routes

import { TrendingUp, TrendingDown, Users, UserCheck, DollarSign, ShieldCheck } from "lucide-react";
import clsx from "clsx";

/* ------------------------------------------------------------------ */
/*  Mock Data                                                         */
/* ------------------------------------------------------------------ */

const stats = [
  {
    label: "Active Users",
    sublabel: "DAU / WAU / MAU",
    value: "1,284",
    detail: "342 / 1,284 / 4,810",
    trend: "+12.3%",
    up: true,
    icon: Users,
  },
  {
    label: "Total Guests",
    sublabel: "All properties",
    value: "6,439",
    detail: "Across 4 properties",
    trend: "+5.7%",
    up: true,
    icon: UserCheck,
  },
  {
    label: "Outstanding Balance",
    sublabel: "All properties",
    value: "$48,290",
    detail: "318 invoices pending",
    trend: "-8.1%",
    up: false,
    icon: DollarSign,
  },
  {
    label: "Document Compliance",
    sublabel: "Rate across properties",
    value: "87.4%",
    detail: "812 / 929 guests compliant",
    trend: "+2.9%",
    up: true,
    icon: ShieldCheck,
  },
];

const propertyBreakdown = [
  {
    name: "Lighthouse Bay RV Resort",
    activeGuests: 1842,
    balanceDue: 18420,
    compliance: 91.2,
  },
  {
    name: "Sunset Cove Marina",
    activeGuests: 1356,
    balanceDue: 14310,
    compliance: 88.7,
  },
  {
    name: "Pine Ridge Campground",
    activeGuests: 2104,
    balanceDue: 9860,
    compliance: 84.1,
  },
  {
    name: "Harbor View Motel",
    activeGuests: 1137,
    balanceDue: 5700,
    compliance: 82.3,
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Analytics Dashboard
        </h1>
        <p className="mt-1 text-sm text-sand-500">
          Overview of guest portal performance across all properties
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-sand-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-sand-500">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-sand-400">{stat.detail}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-50">
                <stat.icon className="h-5 w-5 text-gold-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              {stat.up ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={clsx(
                  "text-sm font-semibold",
                  stat.up ? "text-emerald-600" : "text-red-600"
                )}
              >
                {stat.trend}
              </span>
              <span className="text-xs text-sand-400">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Chart Placeholders ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Feature Usage */}
        <div className="lg:col-span-2 rounded-xl border border-sand-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">
            Feature Usage Breakdown
          </h2>
          <p className="mt-0.5 text-xs text-sand-400">
            Bar chart - interactions by feature over the past 30 days
          </p>
          <div className="mt-4 flex h-64 items-center justify-center rounded-lg bg-sand-50 border border-dashed border-sand-300">
            <div className="text-center">
              <div className="flex justify-center gap-1.5 mb-3">
                {[72, 58, 45, 80, 34, 62].map((h, i) => (
                  <div
                    key={i}
                    className="w-8 rounded-t bg-gold-400/60"
                    style={{ height: `${h * 2}px` }}
                  />
                ))}
              </div>
              <p className="text-sm font-medium text-sand-500">
                Chart: Feature Usage Breakdown
              </p>
              <p className="text-xs text-sand-400 mt-0.5">
                Check-in, Payments, Local Guide, Food Trucks, Add-ons, Documents
              </p>
            </div>
          </div>
        </div>

        {/* Sessions by Device */}
        <div className="rounded-xl border border-sand-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">
            Sessions by Device
          </h2>
          <p className="mt-0.5 text-xs text-sand-400">
            Pie chart - device distribution
          </p>
          <div className="mt-4 flex h-64 items-center justify-center rounded-lg bg-sand-50 border border-dashed border-sand-300">
            <div className="text-center">
              <div className="mx-auto h-32 w-32 rounded-full border-[16px] border-gold-500 border-t-gold-200 border-r-gold-300 mb-3" />
              <p className="text-sm font-medium text-sand-500">
                Chart: Sessions by Device
              </p>
              <p className="text-xs text-sand-400 mt-0.5">
                Mobile 64% / Desktop 28% / Tablet 8%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payments chart - full width */}
      <div className="rounded-xl border border-sand-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">
          Payments Collected (Last 30 Days)
        </h2>
        <p className="mt-0.5 text-xs text-sand-400">
          Line chart - daily payment totals
        </p>
        <div className="mt-4 flex h-56 items-center justify-center rounded-lg bg-sand-50 border border-dashed border-sand-300">
          <div className="text-center w-full px-8">
            {/* Fake sparkline */}
            <svg viewBox="0 0 400 80" className="w-full h-20 mb-3">
              <polyline
                points="0,60 15,55 30,50 45,48 60,52 75,40 90,38 105,35 120,42 135,30 150,28 165,35 180,25 195,22 210,30 225,20 240,18 255,25 270,15 285,20 300,12 315,18 330,10 345,15 360,8 375,12 400,5"
                fill="none"
                stroke="#b47a24"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="0,60 15,55 30,50 45,48 60,52 75,40 90,38 105,35 120,42 135,30 150,28 165,35 180,25 195,22 210,30 225,20 240,18 255,25 270,15 285,20 300,12 315,18 330,10 345,15 360,8 375,12 400,5 400,80 0,80"
                fill="url(#goldGradient)"
                opacity="0.15"
              />
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b47a24" />
                  <stop offset="100%" stopColor="#b47a24" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <p className="text-sm font-medium text-sand-500">
              Chart: Payments Collected (Last 30 Days)
            </p>
            <p className="text-xs text-sand-400 mt-0.5">
              Total collected: $142,380 -- Average: $4,746/day
            </p>
          </div>
        </div>
      </div>

      {/* ── Per-Property Breakdown Table ── */}
      <div className="rounded-xl border border-sand-200 bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-sand-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Per-Property Breakdown
          </h2>
          <p className="mt-0.5 text-xs text-sand-400">
            Performance metrics by property
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-100 text-left">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sand-500">
                  Property
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sand-500">
                  Active Guests
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sand-500">
                  Balance Due
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sand-500">
                  Compliance %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {propertyBreakdown.map((p) => (
                <tr key={p.name} className="hover:bg-sand-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {p.name}
                  </td>
                  <td className="px-6 py-4 text-sand-700">
                    {p.activeGuests.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sand-700">
                    ${p.balanceDue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 rounded-full bg-sand-100 overflow-hidden">
                        <div
                          className={clsx(
                            "h-full rounded-full",
                            p.compliance >= 90
                              ? "bg-emerald-500"
                              : p.compliance >= 85
                                ? "bg-gold-500"
                                : "bg-orange-500"
                          )}
                          style={{ width: `${p.compliance}%` }}
                        />
                      </div>
                      <span className="font-medium text-gray-900">
                        {p.compliance}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
