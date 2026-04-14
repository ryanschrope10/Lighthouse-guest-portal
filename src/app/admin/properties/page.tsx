"use client";

// TODO: Check for admin role — redirect non-admins away from /admin routes

import { useState } from "react";
import { Pencil, X, Eye, EyeOff, Building2 } from "lucide-react";
import clsx from "clsx";
import type { Property } from "@/types/index";

/* ------------------------------------------------------------------ */
/*  Mock Data                                                         */
/* ------------------------------------------------------------------ */

const initialProperties: Property[] = [
  {
    id: "prop-1",
    name: "Lighthouse Bay RV Resort",
    slug: "lighthouse-bay",
    newbook_instance_url: "https://api.newbook.cloud/lighthouse",
    newbook_api_key: "nb_live_sk_9a8f7e6d5c4b3a2190",
    timezone: "America/Chicago",
    cancellation_policy: {
      refund_eligible: true,
      cutoff_days: 7,
      policy_text:
        "Full refund if cancelled 7+ days before check-in. 50% refund within 3-7 days. No refund within 3 days.",
    },
    features_enabled: {
      check_in: true,
      food_trucks: true,
      local_guide: true,
      push_notifications: true,
      add_ons: true,
      document_uploads: true,
    },
    contact_info: {
      phone: "(555) 123-4567",
      email: "info@lighthousebay.com",
      address: "1200 Bay Shore Dr, Gulf Shores, AL 36542",
      emergency_phone: "(555) 123-9911",
    },
    smart_lock_provider: "yale",
    smart_lock_config: {},
    branding: {
      logo_url: "https://cdn.example.com/lighthouse-logo.png",
      primary_color: "#b47a24",
      accent_color: "#1e3a5f",
      welcome_message: "Welcome to Lighthouse Bay! Your home away from home.",
    },
    created_at: "2025-06-15T00:00:00Z",
  },
  {
    id: "prop-2",
    name: "Sunset Cove Marina",
    slug: "sunset-cove",
    newbook_instance_url: "https://api.newbook.cloud/sunset-cove",
    newbook_api_key: "nb_live_sk_1b2c3d4e5f6a7890",
    timezone: "America/New_York",
    cancellation_policy: {
      refund_eligible: true,
      cutoff_days: 14,
      policy_text:
        "Full refund if cancelled 14+ days before arrival. No refund within 14 days.",
    },
    features_enabled: {
      check_in: true,
      food_trucks: false,
      local_guide: true,
      push_notifications: true,
      add_ons: true,
      document_uploads: true,
    },
    contact_info: {
      phone: "(555) 234-5678",
      email: "hello@sunsetcove.com",
      address: "800 Marina Blvd, Destin, FL 32541",
    },
    smart_lock_provider: null,
    smart_lock_config: {},
    branding: {
      primary_color: "#2563eb",
      welcome_message: "Welcome aboard Sunset Cove Marina!",
    },
    created_at: "2025-08-20T00:00:00Z",
  },
  {
    id: "prop-3",
    name: "Pine Ridge Campground",
    slug: "pine-ridge",
    newbook_instance_url: "https://api.newbook.cloud/pine-ridge",
    newbook_api_key: "nb_live_sk_aabbccdd11223344",
    timezone: "America/Denver",
    cancellation_policy: {
      refund_eligible: true,
      cutoff_days: 3,
      policy_text: "Full refund if cancelled 3+ days before arrival.",
    },
    features_enabled: {
      check_in: true,
      food_trucks: true,
      local_guide: true,
      push_notifications: false,
      add_ons: false,
      document_uploads: true,
    },
    contact_info: {
      phone: "(555) 345-6789",
      email: "camp@pineridge.com",
      address: "4500 Ridge Rd, Estes Park, CO 80517",
    },
    smart_lock_provider: null,
    smart_lock_config: {},
    branding: {
      primary_color: "#166534",
      welcome_message: "Welcome to Pine Ridge! Nature awaits.",
    },
    created_at: "2025-10-01T00:00:00Z",
  },
  {
    id: "prop-4",
    name: "Harbor View Motel",
    slug: "harbor-view",
    newbook_instance_url: "https://api.newbook.cloud/harbor-view",
    newbook_api_key: "nb_live_sk_eeff00112233aabb",
    timezone: "America/Los_Angeles",
    cancellation_policy: {
      refund_eligible: true,
      cutoff_days: 2,
      policy_text: "Free cancellation up to 48 hours before check-in.",
    },
    features_enabled: {
      check_in: true,
      food_trucks: false,
      local_guide: true,
      push_notifications: true,
      add_ons: true,
      document_uploads: false,
    },
    contact_info: {
      phone: "(555) 456-7890",
      email: "front-desk@harborview.com",
      address: "200 Harbor Way, San Diego, CA 92101",
    },
    smart_lock_provider: "august",
    smart_lock_config: {},
    branding: {
      primary_color: "#0891b2",
      welcome_message: "Welcome to Harbor View Motel!",
    },
    created_at: "2026-01-10T00:00:00Z",
  },
];

const timezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
];

const featureLabels: { key: keyof Property["features_enabled"]; label: string }[] = [
  { key: "check_in", label: "Self Check-In" },
  { key: "food_trucks", label: "Food Trucks" },
  { key: "local_guide", label: "Local Guide" },
  { key: "push_notifications", label: "Push Notifications" },
  { key: "add_ons", label: "Add-on Requests" },
  { key: "document_uploads", label: "Document Uploads" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Property | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  function handleEdit(prop: Property) {
    setForm({ ...prop });
    setEditingId(prop.id);
    setShowApiKey(false);
  }

  function handleSave() {
    if (!form) return;
    setProperties((prev) =>
      prev.map((p) => (p.id === form.id ? form : p))
    );
    setEditingId(null);
    setForm(null);
  }

  function handleCancel() {
    setEditingId(null);
    setForm(null);
    setShowApiKey(false);
  }

  function maskKey(key: string | null): string {
    if (!key) return "Not configured";
    return key.slice(0, 10) + "..." + key.slice(-4);
  }

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
        <p className="mt-1 text-sm text-sand-500">
          Configure property settings, integrations, and branding
        </p>
      </div>

      {editingId && form ? (
        /* ────────────────────────────────────── Edit Form ──── */
        <div className="rounded-xl border border-sand-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-sand-200 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">
              Editing: {form.name}
            </h2>
            <button
              type="button"
              onClick={handleCancel}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sand-400 hover:bg-sand-100 hover:text-gray-900 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Basic Info */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-sand-500">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-sand-500 mb-1.5">
                    Property Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-sand-500 mb-1.5">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) =>
                      setForm({ ...form, slug: e.target.value })
                    }
                    className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-sand-500 mb-1.5">
                    Timezone
                  </label>
                  <select
                    value={form.timezone}
                    onChange={(e) =>
                      setForm({ ...form, timezone: e.target.value })
                    }
                    className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Contact Info */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-sand-500">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-sand-500 mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.contact_info.phone ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        contact_info: {
                          ...form.contact_info,
                          phone: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-sand-500 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.contact_info.email ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        contact_info: {
                          ...form.contact_info,
                          email: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-sand-500 mb-1.5">
                    Address
                  </label>
                  <input
                    type="text"
                    value={form.contact_info.address ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        contact_info: {
                          ...form.contact_info,
                          address: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-sand-500 mb-1.5">
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    value={form.contact_info.emergency_phone ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        contact_info: {
                          ...form.contact_info,
                          emergency_phone: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* Cancellation Policy */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-sand-500">
                Cancellation Policy
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        cancellation_policy: {
                          ...form.cancellation_policy,
                          refund_eligible:
                            !form.cancellation_policy.refund_eligible,
                        },
                      })
                    }
                    className={clsx(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      form.cancellation_policy.refund_eligible
                        ? "bg-gold-500"
                        : "bg-sand-300"
                    )}
                  >
                    <span
                      className={clsx(
                        "inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm",
                        form.cancellation_policy.refund_eligible
                          ? "translate-x-6"
                          : "translate-x-1"
                      )}
                    />
                  </button>
                  <span className="text-sm text-gray-900">Refund Eligible</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-sand-500 mb-1.5">
                    Cutoff Days
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.cancellation_policy.cutoff_days}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        cancellation_policy: {
                          ...form.cancellation_policy,
                          cutoff_days: Number(e.target.value),
                        },
                      })
                    }
                    className="w-24 rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-sand-500 mb-1.5">
                  Policy Text
                </label>
                <textarea
                  rows={3}
                  value={form.cancellation_policy.policy_text}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      cancellation_policy: {
                        ...form.cancellation_policy,
                        policy_text: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors resize-none"
                />
              </div>
            </section>

            {/* Feature Toggles */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-sand-500">
                Features Enabled
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {featureLabels.map((f) => (
                  <label
                    key={f.key}
                    className="flex items-center gap-3 rounded-lg border border-sand-200 px-4 py-3 cursor-pointer hover:bg-sand-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={form.features_enabled[f.key]}
                      onChange={() =>
                        setForm({
                          ...form,
                          features_enabled: {
                            ...form.features_enabled,
                            [f.key]: !form.features_enabled[f.key],
                          },
                        })
                      }
                      className="h-4 w-4 rounded border-sand-300 text-gold-600 focus:ring-gold-500"
                    />
                    <span className="text-sm text-gray-900 font-medium">
                      {f.label}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {/* NewBook API Config */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-sand-500">
                NewBook API Integration
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-sand-500 mb-1.5">
                    API URL
                  </label>
                  <input
                    type="url"
                    value={form.newbook_instance_url ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        newbook_instance_url: e.target.value || null,
                      })
                    }
                    placeholder="https://api.newbook.cloud/..."
                    className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-sand-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-sand-500 mb-1.5">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={form.newbook_api_key ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          newbook_api_key: e.target.value || null,
                        })
                      }
                      placeholder="nb_live_sk_..."
                      className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-sand-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded text-sand-400 hover:text-gray-900 transition-colors"
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Branding */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-sand-500">
                Branding
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-sand-500 mb-1.5">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={form.branding.logo_url ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        branding: {
                          ...form.branding,
                          logo_url: e.target.value || undefined,
                        },
                      })
                    }
                    placeholder="https://..."
                    className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-sand-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-sand-500 mb-1.5">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.branding.primary_color ?? "#b47a24"}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          branding: {
                            ...form.branding,
                            primary_color: e.target.value,
                          },
                        })
                      }
                      className="h-10 w-10 rounded-lg border border-sand-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.branding.primary_color ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          branding: {
                            ...form.branding,
                            primary_color: e.target.value || undefined,
                          },
                        })
                      }
                      className="flex-1 rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 font-mono focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-sand-500 mb-1.5">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.branding.accent_color ?? "#1e3a5f"}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          branding: {
                            ...form.branding,
                            accent_color: e.target.value,
                          },
                        })
                      }
                      className="h-10 w-10 rounded-lg border border-sand-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.branding.accent_color ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          branding: {
                            ...form.branding,
                            accent_color: e.target.value || undefined,
                          },
                        })
                      }
                      className="flex-1 rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 font-mono focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-sand-500 mb-1.5">
                  Welcome Message
                </label>
                <textarea
                  rows={2}
                  value={form.branding.welcome_message ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      branding: {
                        ...form.branding,
                        welcome_message: e.target.value || undefined,
                      },
                    })
                  }
                  className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors resize-none"
                />
              </div>
            </section>
          </div>

          {/* Save / Cancel */}
          <div className="flex items-center justify-end gap-3 border-t border-sand-200 px-6 py-4">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-sand-200 px-4 py-2.5 text-sm font-medium text-sand-600 transition-colors hover:bg-sand-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-gold-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        /* ────────────────────────────────────── Property List ──── */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {properties.map((prop) => (
            <button
              key={prop.id}
              type="button"
              onClick={() => handleEdit(prop)}
              className="group rounded-xl border border-sand-200 bg-white p-6 shadow-sm text-left transition-all hover:border-gold-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white text-sm font-bold"
                    style={{
                      backgroundColor: prop.branding.primary_color ?? "#b47a24",
                    }}
                  >
                    {prop.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {prop.name}
                    </h3>
                    <p className="text-xs text-sand-400">/{prop.slug}</p>
                  </div>
                </div>
                <Pencil className="h-4 w-4 text-sand-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="mt-4 text-xs text-sand-500">
                {prop.contact_info.address ?? "No address"}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {featureLabels
                  .filter((f) => prop.features_enabled[f.key])
                  .map((f) => (
                    <span
                      key={f.key}
                      className="inline-flex items-center rounded-full bg-gold-50 px-2 py-0.5 text-[10px] font-medium text-gold-700"
                    >
                      {f.label}
                    </span>
                  ))}
              </div>

              <div className="mt-3 flex items-center gap-4 text-xs text-sand-400">
                <span>{prop.timezone}</span>
                <span>&middot;</span>
                <span>
                  API: {prop.newbook_api_key ? maskKey(prop.newbook_api_key) : "Not set"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
