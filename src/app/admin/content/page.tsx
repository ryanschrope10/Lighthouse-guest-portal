"use client";

// TODO: Check for admin role — redirect non-admins away from /admin routes

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ChevronDown,
  X,
} from "lucide-react";
import clsx from "clsx";
import type { ContentType, PropertyContent } from "@/types/index";

/* ------------------------------------------------------------------ */
/*  Mock Data                                                         */
/* ------------------------------------------------------------------ */

const mockProperties = [
  { id: "prop-1", name: "Lighthouse Bay RV Resort" },
  { id: "prop-2", name: "Sunset Cove Marina" },
  { id: "prop-3", name: "Pine Ridge Campground" },
  { id: "prop-4", name: "Harbor View Motel" },
];

const categories: { value: ContentType; label: string }[] = [
  { value: "local_guide", label: "Local Guide" },
  { value: "food_truck_schedule", label: "Food Truck Schedule" },
  { value: "tutorial", label: "Tutorials" },
  { value: "faq", label: "FAQs" },
  { value: "event", label: "Events" },
];

const initialContent: PropertyContent[] = [
  {
    id: "c-1",
    property_id: "prop-1",
    type: "local_guide",
    title: "Best Fishing Spots Nearby",
    body: "A guide to the top 5 fishing spots within 15 minutes of the resort. Includes bait recommendations and license info.",
    media_url: "https://images.example.com/fishing-guide.jpg",
    schedule: null,
    sort_order: 1,
    active: true,
    created_at: "2026-03-10T09:00:00Z",
  },
  {
    id: "c-2",
    property_id: "prop-1",
    type: "local_guide",
    title: "Family Day Trips",
    body: "Fun destinations for families: state parks, waterparks, and mini golf courses all within an hour drive.",
    media_url: null,
    schedule: null,
    sort_order: 2,
    active: true,
    created_at: "2026-03-12T09:00:00Z",
  },
  {
    id: "c-3",
    property_id: "prop-1",
    type: "food_truck_schedule",
    title: "Taco Tuesday - Maria's Kitchen",
    body: "Authentic street tacos, burritos, and fresh churros.",
    media_url: null,
    schedule: { day: "Tuesday", time: "5:00 PM - 8:00 PM", vendor: "Maria's Kitchen" },
    sort_order: 1,
    active: true,
    created_at: "2026-03-15T09:00:00Z",
  },
  {
    id: "c-4",
    property_id: "prop-1",
    type: "food_truck_schedule",
    title: "Friday Fish Fry - Gulf Catch",
    body: "Fresh catch of the day, shrimp baskets, and coleslaw.",
    media_url: null,
    schedule: { day: "Friday", time: "4:00 PM - 9:00 PM", vendor: "Gulf Catch" },
    sort_order: 2,
    active: true,
    created_at: "2026-03-15T09:00:00Z",
  },
  {
    id: "c-5",
    property_id: "prop-1",
    type: "tutorial",
    title: "How to Use the Guest Portal",
    body: "Step-by-step walkthrough of all portal features including check-in, payments, and document uploads.",
    media_url: "https://videos.example.com/portal-tutorial.mp4",
    schedule: null,
    sort_order: 1,
    active: true,
    created_at: "2026-02-20T09:00:00Z",
  },
  {
    id: "c-6",
    property_id: "prop-1",
    type: "faq",
    title: "What time is check-in?",
    body: "Check-in is available from 2:00 PM. Early check-in may be available upon request and is subject to availability.",
    media_url: null,
    schedule: null,
    sort_order: 1,
    active: true,
    created_at: "2026-02-18T09:00:00Z",
  },
  {
    id: "c-7",
    property_id: "prop-1",
    type: "faq",
    title: "Is there WiFi?",
    body: "Yes! Complimentary WiFi is available throughout the resort. Connect to 'Lighthouse-Guest' network. Password is on your welcome card.",
    media_url: null,
    schedule: null,
    sort_order: 2,
    active: true,
    created_at: "2026-02-18T09:00:00Z",
  },
  {
    id: "c-8",
    property_id: "prop-1",
    type: "event",
    title: "Spring BBQ Bash",
    body: "Join us for our annual spring BBQ! Live music, games, and complimentary burgers for all guests.",
    media_url: null,
    schedule: { day: "Saturday", time: "3:00 PM - 7:00 PM", vendor: "" },
    sort_order: 1,
    active: true,
    created_at: "2026-04-01T09:00:00Z",
  },
  {
    id: "c-9",
    property_id: "prop-1",
    type: "event",
    title: "Movie Night Under the Stars",
    body: "Family-friendly outdoor movie screening. Popcorn provided! Bring your lawn chairs and blankets.",
    media_url: null,
    schedule: null,
    sort_order: 2,
    active: false,
    created_at: "2026-04-05T09:00:00Z",
  },
];

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/* ------------------------------------------------------------------ */
/*  Types for form                                                    */
/* ------------------------------------------------------------------ */

interface ContentForm {
  id: string | null;
  title: string;
  body: string;
  media_url: string;
  type: ContentType;
  active: boolean;
  sort_order: number;
  // Food truck specific
  schedule_day: string;
  schedule_time: string;
  schedule_vendor: string;
}

const emptyForm: ContentForm = {
  id: null,
  title: "",
  body: "",
  media_url: "",
  type: "local_guide",
  active: true,
  sort_order: 0,
  schedule_day: "Monday",
  schedule_time: "",
  schedule_vendor: "",
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function ContentManagementPage() {
  const [propertyId, setPropertyId] = useState("prop-1");
  const [activeCategory, setActiveCategory] = useState<ContentType>("local_guide");
  const [content, setContent] = useState<PropertyContent[]>(initialContent);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ContentForm>(emptyForm);

  const filteredContent = content.filter(
    (c) => c.property_id === propertyId && c.type === activeCategory
  );

  function handleAdd() {
    setForm({ ...emptyForm, type: activeCategory, sort_order: filteredContent.length + 1 });
    setShowForm(true);
  }

  function handleEdit(item: PropertyContent) {
    setForm({
      id: item.id,
      title: item.title,
      body: item.body ?? "",
      media_url: item.media_url ?? "",
      type: item.type,
      active: item.active,
      sort_order: item.sort_order,
      schedule_day:
        (item.schedule as Record<string, string> | null)?.day ?? "Monday",
      schedule_time:
        (item.schedule as Record<string, string> | null)?.time ?? "",
      schedule_vendor:
        (item.schedule as Record<string, string> | null)?.vendor ?? "",
    });
    setShowForm(true);
  }

  function handleSave() {
    if (!form.title) return;

    const schedule =
      form.type === "food_truck_schedule"
        ? { day: form.schedule_day, time: form.schedule_time, vendor: form.schedule_vendor }
        : null;

    if (form.id) {
      // Editing existing
      setContent((prev) =>
        prev.map((c) =>
          c.id === form.id
            ? {
                ...c,
                title: form.title,
                body: form.body,
                media_url: form.media_url || null,
                active: form.active,
                sort_order: form.sort_order,
                schedule,
              }
            : c
        )
      );
    } else {
      // Adding new
      const newItem: PropertyContent = {
        id: `c-${Date.now()}`,
        property_id: propertyId,
        type: form.type,
        title: form.title,
        body: form.body || null,
        media_url: form.media_url || null,
        schedule,
        sort_order: form.sort_order,
        active: form.active,
        created_at: new Date().toISOString(),
      };
      setContent((prev) => [...prev, newItem]);
    }

    setShowForm(false);
    setForm(emptyForm);
  }

  function handleDelete(id: string) {
    setContent((prev) => prev.filter((c) => c.id !== id));
  }

  function toggleActive(id: string) {
    setContent((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
  }

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Content Management
        </h1>
        <p className="mt-1 text-sm text-sand-500">
          Manage guides, schedules, FAQs, and event content per property
        </p>
      </div>

      {/* Property selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          className="rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors sm:w-72"
        >
          {mockProperties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 rounded-lg bg-gold-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold-700"
        >
          <Plus className="h-4 w-4" />
          Add Content
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-sand-200 bg-white p-1 shadow-sm">
        {categories.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setActiveCategory(cat.value)}
            className={clsx(
              "flex-shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap",
              activeCategory === cat.value
                ? "bg-gold-600 text-white shadow-sm"
                : "text-sand-600 hover:bg-sand-50 hover:text-gray-900"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Content List ── */}
      <div className="rounded-xl border border-sand-200 bg-white shadow-sm">
        {filteredContent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-sand-500">
              No content in this category yet
            </p>
            <p className="mt-1 text-xs text-sand-400">
              Click &quot;Add Content&quot; to create the first item
            </p>
          </div>
        ) : (
          <div className="divide-y divide-sand-100">
            {filteredContent
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-sand-50 transition-colors"
                >
                  <GripVertical className="h-4 w-4 text-sand-300 flex-shrink-0 cursor-grab" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {item.title}
                      </p>
                      <span
                        className={clsx(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          item.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-sand-100 text-sand-500"
                        )}
                      >
                        {item.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {item.body && (
                      <p className="mt-0.5 text-xs text-sand-500 truncate max-w-lg">
                        {item.body}
                      </p>
                    )}
                    {item.type === "food_truck_schedule" && item.schedule && (
                      <p className="mt-0.5 text-xs text-gold-600 font-medium">
                        {(item.schedule as Record<string, string>).day} &middot;{" "}
                        {(item.schedule as Record<string, string>).time} &middot;{" "}
                        {(item.schedule as Record<string, string>).vendor}
                      </p>
                    )}
                  </div>

                  <span className="text-xs text-sand-400 flex-shrink-0">
                    #{item.sort_order}
                  </span>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleActive(item.id)}
                      className={clsx(
                        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                        item.active ? "bg-gold-500" : "bg-sand-300"
                      )}
                    >
                      <span
                        className={clsx(
                          "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm",
                          item.active ? "translate-x-4" : "translate-x-1"
                        )}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-sand-400 hover:bg-sand-100 hover:text-gray-900 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-sand-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ── Add / Edit Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-sand-200 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">
                {form.id ? "Edit Content" : "Add Content"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm(emptyForm);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sand-400 hover:bg-sand-100 hover:text-gray-900 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {/* Category */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-sand-500 mb-1.5">
                  Category
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as ContentType })
                  }
                  className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-sand-500 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Content title..."
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
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Content body..."
                  className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-sand-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Media URL */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-sand-500 mb-1.5">
                  Media URL
                </label>
                <input
                  type="url"
                  value={form.media_url}
                  onChange={(e) =>
                    setForm({ ...form, media_url: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-sand-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
                />
              </div>

              {/* Food Truck Schedule fields */}
              {form.type === "food_truck_schedule" && (
                <div className="space-y-4 rounded-lg border border-gold-200 bg-gold-50/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
                    Schedule Details
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-sand-500 mb-1.5">
                        Day of Week
                      </label>
                      <select
                        value={form.schedule_day}
                        onChange={(e) =>
                          setForm({ ...form, schedule_day: e.target.value })
                        }
                        className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
                      >
                        {daysOfWeek.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-sand-500 mb-1.5">
                        Time
                      </label>
                      <input
                        type="text"
                        value={form.schedule_time}
                        onChange={(e) =>
                          setForm({ ...form, schedule_time: e.target.value })
                        }
                        placeholder="5:00 PM - 8:00 PM"
                        className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-sand-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-sand-500 mb-1.5">
                      Vendor Name
                    </label>
                    <input
                      type="text"
                      value={form.schedule_vendor}
                      onChange={(e) =>
                        setForm({ ...form, schedule_vendor: e.target.value })
                      }
                      placeholder="Food truck vendor name..."
                      className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-sand-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-sand-500 mb-1.5">
                  Sort Order
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm({ ...form, sort_order: Number(e.target.value) })
                  }
                  className="w-24 rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, active: !form.active })}
                  className={clsx(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    form.active ? "bg-gold-500" : "bg-sand-300"
                  )}
                >
                  <span
                    className={clsx(
                      "inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm",
                      form.active ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
                <span className="text-sm text-gray-900 font-medium">
                  {form.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-end gap-3 border-t border-sand-200 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm(emptyForm);
                }}
                className="rounded-lg border border-sand-200 px-4 py-2.5 text-sm font-medium text-sand-600 transition-colors hover:bg-sand-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!form.title}
                className="rounded-lg bg-gold-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {form.id ? "Save Changes" : "Add Content"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
