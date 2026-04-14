"use client";

// TODO: Check for admin role — redirect non-admins away from /admin routes

import { useState } from "react";
import { Send, Search, Bell, Mail, Smartphone } from "lucide-react";
import clsx from "clsx";
import type { Notification } from "@/types/index";

/* ------------------------------------------------------------------ */
/*  Mock Data                                                         */
/* ------------------------------------------------------------------ */

const mockProperties = [
  { id: "prop-1", name: "Lighthouse Bay RV Resort" },
  { id: "prop-2", name: "Sunset Cove Marina" },
  { id: "prop-3", name: "Pine Ridge Campground" },
  { id: "prop-4", name: "Harbor View Motel" },
];

const mockSentNotifications: (Notification & { property_name: string })[] = [
  {
    id: "notif-1",
    property_id: "prop-1",
    property_name: "Lighthouse Bay RV Resort",
    target_type: "all_guests",
    target_id: null,
    title: "Pool Maintenance Notice",
    body: "The main pool will be closed for maintenance on Friday 4/17 from 8am-12pm. The splash pad remains open.",
    channel: "both",
    sent_at: "2026-04-13T14:30:00Z",
    created_by: "admin-1",
  },
  {
    id: "notif-2",
    property_id: "prop-2",
    property_name: "Sunset Cove Marina",
    target_type: "all_guests",
    target_id: null,
    title: "Weekend Food Truck Festival",
    body: "Join us this Saturday for our spring food truck festival! 5 vendors, live music, and kids activities from 4-9pm.",
    channel: "push",
    sent_at: "2026-04-12T09:15:00Z",
    created_by: "admin-1",
  },
  {
    id: "notif-3",
    property_id: "prop-1",
    property_name: "Lighthouse Bay RV Resort",
    target_type: "specific_guest",
    target_id: "guest-42",
    title: "Document Expiring Soon",
    body: "Your vehicle insurance document expires on 4/20. Please upload an updated copy to remain in compliance.",
    channel: "email",
    sent_at: "2026-04-11T11:00:00Z",
    created_by: "admin-1",
  },
  {
    id: "notif-4",
    property_id: "prop-3",
    property_name: "Pine Ridge Campground",
    target_type: "all_guests",
    target_id: null,
    title: "Quiet Hours Reminder",
    body: "A friendly reminder that quiet hours are 10pm - 7am. Please keep noise levels down for fellow campers.",
    channel: "push",
    sent_at: "2026-04-10T18:45:00Z",
    created_by: "admin-1",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function NotificationsPage() {
  const [propertyId, setPropertyId] = useState("");
  const [targetType, setTargetType] = useState<"all_guests" | "specific_guest">("all_guests");
  const [guestEmail, setGuestEmail] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<"push" | "email" | "both">("both");
  const [sent, setSent] = useState(mockSentNotifications);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  function handleSend() {
    if (!propertyId || !title || !body) return;
    if (targetType === "specific_guest" && !guestEmail) return;

    setSending(true);
    // Simulate send delay
    setTimeout(() => {
      const newNotif: Notification & { property_name: string } = {
        id: `notif-${Date.now()}`,
        property_id: propertyId,
        property_name:
          mockProperties.find((p) => p.id === propertyId)?.name ?? "",
        target_type: targetType,
        target_id: targetType === "specific_guest" ? guestEmail : null,
        title,
        body,
        channel,
        sent_at: new Date().toISOString(),
        created_by: "admin-1",
      };
      setSent([newNotif, ...sent]);
      setTitle("");
      setBody("");
      setGuestEmail("");
      setSending(false);
      setSuccessMsg("Notification sent successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    }, 800);
  }

  const selectedPropertyName =
    mockProperties.find((p) => p.id === propertyId)?.name ?? "Selected Property";

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-1 text-sm text-sand-500">
          Send bulk or targeted notifications to guests
        </p>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* ── Compose Form ── */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border border-sand-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-semibold text-gray-900">
              Compose Notification
            </h2>

            {/* Property selector */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-sand-500 mb-1.5">
                Property
              </label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
              >
                <option value="">Select a property...</option>
                {mockProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Target */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-sand-500 mb-1.5">
                Target
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setTargetType("all_guests")}
                  className={clsx(
                    "flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                    targetType === "all_guests"
                      ? "border-gold-400 bg-gold-50 text-gold-700"
                      : "border-sand-200 text-sand-600 hover:bg-sand-50"
                  )}
                >
                  All Guests
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType("specific_guest")}
                  className={clsx(
                    "flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                    targetType === "specific_guest"
                      ? "border-gold-400 bg-gold-50 text-gold-700"
                      : "border-sand-200 text-sand-600 hover:bg-sand-50"
                  )}
                >
                  Specific Guest
                </button>
              </div>

              {targetType === "specific_guest" && (
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-400" />
                  <input
                    type="email"
                    placeholder="Search by email..."
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full rounded-lg border border-sand-200 bg-white pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-sand-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-sand-500 mb-1.5">
                Title
              </label>
              <input
                type="text"
                placeholder="Notification title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-sand-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-sand-500 mb-1.5">
                Body
              </label>
              <textarea
                rows={4}
                placeholder="Notification message..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-sand-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Channel */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-sand-500 mb-1.5">
                Channel
              </label>
              <div className="flex gap-3">
                {(
                  [
                    { value: "push", label: "Push", icon: Smartphone },
                    { value: "email", label: "Email", icon: Mail },
                    { value: "both", label: "Both", icon: Bell },
                  ] as const
                ).map((ch) => (
                  <button
                    key={ch.value}
                    type="button"
                    onClick={() => setChannel(ch.value)}
                    className={clsx(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                      channel === ch.value
                        ? "border-gold-400 bg-gold-50 text-gold-700"
                        : "border-sand-200 text-sand-600 hover:bg-sand-50"
                    )}
                  >
                    <ch.icon className="h-4 w-4" />
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Send button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!propertyId || !title || !body || sending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              {sending ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </div>

        {/* ── Preview Card ── */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-sand-200 bg-white p-6 shadow-sm sticky top-24">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Preview
            </h2>
            <div className="rounded-xl border border-sand-200 bg-sand-50 p-4">
              {/* Fake phone notification */}
              <div className="rounded-lg bg-white border border-sand-200 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-600 text-white text-xs font-bold flex-shrink-0">
                    L
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-sand-400">
                      {propertyId ? selectedPropertyName : "Property Name"}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">
                      {title || "Notification Title"}
                    </p>
                    <p className="text-sm text-sand-600 mt-1 line-clamp-3">
                      {body || "Your notification message will appear here..."}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-sand-400">
                  {channel === "push" || channel === "both" ? (
                    <span className="flex items-center gap-1">
                      <Smartphone className="h-3 w-3" /> Push
                    </span>
                  ) : null}
                  {channel === "email" || channel === "both" ? (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email
                    </span>
                  ) : null}
                  <span className="ml-auto">
                    {targetType === "all_guests"
                      ? "All guests"
                      : guestEmail || "specific guest"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Sent Notifications ── */}
      <div className="rounded-xl border border-sand-200 bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-sand-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Recently Sent Notifications
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-100 text-left">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sand-500">
                  Title
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sand-500">
                  Property
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sand-500">
                  Target
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sand-500">
                  Channel
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sand-500">
                  Sent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {sent.map((n) => (
                <tr
                  key={n.id}
                  className="hover:bg-sand-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{n.title}</p>
                    <p className="text-xs text-sand-400 mt-0.5 truncate max-w-xs">
                      {n.body}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sand-700 whitespace-nowrap">
                    {n.property_name}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={clsx(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        n.target_type === "all_guests"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-purple-50 text-purple-700"
                      )}
                    >
                      {n.target_type === "all_guests"
                        ? "All Guests"
                        : "Specific"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sand-700 capitalize">
                    {n.channel}
                  </td>
                  <td className="px-6 py-4 text-sand-500 whitespace-nowrap text-xs">
                    {n.sent_at
                      ? new Date(n.sent_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "—"}
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
