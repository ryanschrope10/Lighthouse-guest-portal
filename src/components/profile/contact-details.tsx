"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  MapPin,
  BellRing,
  Check,
  Minus,
  Pencil,
  Save,
  X,
  AlertTriangle,
} from "lucide-react";
import { useGuest } from "@/lib/context/guest-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ApiResponse, Guest, GuestAddress } from "@/types/index";

interface ContactForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: GuestAddress;
}

export function ContactDetails() {
  const { guest, session } = useGuest();

  const initialForm: ContactForm = {
    first_name: guest?.first_name ?? "",
    last_name: guest?.last_name ?? "",
    email: session?.email ?? guest?.email ?? "",
    phone: guest?.phone ?? "",
    address: {
      street: guest?.address?.street ?? "",
      city: guest?.address?.city ?? "",
      state: guest?.address?.state ?? "",
      zip: guest?.address?.zip ?? "",
      country: guest?.address?.country ?? "US",
    },
  };

  const router = useRouter();
  const [form, setForm] = useState<ContactForm>(initialForm);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof ContactForm>(
    key: K,
    value: ContactForm[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateAddress<K extends keyof GuestAddress>(key: K, value: string) {
    setForm((prev) => ({
      ...prev,
      address: { ...prev.address, [key]: value },
    }));
  }

  function handleCancel() {
    setForm(initialForm);
    setError(null);
    setEditing(false);
  }

  // Saves through to Newbook (the API pushes guests_update before touching
  // our own row), so the office sees the same details the guest just entered.
  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/guest/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          address: form.address,
        }),
      });
      const json: ApiResponse<Guest> = await res.json();
      if (!res.ok || json.error) {
        setError(json.error ?? "We couldn't save your details.");
        return;
      }
      setEditing(false);
      // The profile is read from Newbook on load; refresh so what's shown is
      // what Newbook now holds rather than our optimistic copy.
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header with edit toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sand-700">
          <User className="h-5 w-5" />
          <span className="text-sm font-medium">Personal Information</span>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-600 transition-colors hover:text-gold-700"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-sand-500 transition-colors hover:text-sand-700"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        )}
      </div>

      {/* Name fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="First Name"
          name="first_name"
          value={form.first_name}
          onChange={(e) => updateField("first_name", e.target.value)}
          disabled={!editing}
          placeholder="First name"
        />
        <Input
          label="Last Name"
          name="last_name"
          value={form.last_name}
          onChange={(e) => updateField("last_name", e.target.value)}
          disabled={!editing}
          placeholder="Last name"
        />
      </div>

      {/* Email (always read-only) & Phone */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="relative">
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            disabled
            helperText="Email cannot be changed"
          />
          <Mail className="pointer-events-none absolute right-3 top-[38px] h-4 w-4 text-sand-400" />
        </div>
        <div className="relative">
          <Input
            label="Phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            disabled={!editing}
            placeholder="(555) 123-4567"
          />
          <Phone className="pointer-events-none absolute right-3 top-[38px] h-4 w-4 text-sand-400" />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sand-700">
          <MapPin className="h-4 w-4" />
          <span className="text-sm font-medium">Mailing Address</span>
        </div>
        <Input
          label="Street Address"
          name="street"
          value={form.address.street ?? ""}
          onChange={(e) => updateAddress("street", e.target.value)}
          disabled={!editing}
          placeholder="123 Main St"
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="City"
              name="city"
              value={form.address.city ?? ""}
              onChange={(e) => updateAddress("city", e.target.value)}
              disabled={!editing}
              placeholder="City"
            />
          </div>
          <Input
            label="State"
            name="state"
            value={form.address.state ?? ""}
            disabled
            helperText="Contact the front desk"
            placeholder="TX"
          />
          <Input
            label="ZIP"
            name="zip"
            value={form.address.zip ?? ""}
            onChange={(e) => updateAddress("zip", e.target.value)}
            disabled={!editing}
            placeholder="78701"
          />
          <Input
            label="Country"
            name="country"
            value={form.address.country ?? ""}
            disabled
            helperText="Contact the front desk"
            placeholder="US"
          />
        </div>
      </div>

      {/* Communication preferences (read-only, from Newbook) */}
      {(guest?.marketing_consent !== undefined ||
        guest?.transactional_consent !== undefined) && (
        <div className="space-y-3 border-t border-sand-200 pt-5">
          <div className="flex items-center gap-2 text-sand-700">
            <BellRing className="h-4 w-4" />
            <span className="text-sm font-medium">Communication Preferences</span>
          </div>
          <div className="space-y-2">
            {guest?.marketing_consent !== undefined && (
              <ConsentRow label="Marketing emails" enabled={guest.marketing_consent} />
            )}
            {guest?.transactional_consent !== undefined && (
              <ConsentRow
                label="Transactional emails"
                enabled={guest.transactional_consent}
              />
            )}
          </div>
          <p className="text-xs text-sand-500">
            Managed by the park. Contact the office to update your preferences.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {editing ? (
        <div className="flex justify-end border-t border-sand-200 pt-4">
          <Button onClick={handleSave} loading={saving} disabled={saving}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      ) : (
        <p className="border-t border-sand-200 pt-4 text-xs text-sand-500">
          Changes here update your reservation record with the park.
        </p>
      )}
    </div>
  );
}

function ConsentRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-sand-200 bg-sand-50/50 px-3 py-2.5">
      <span className="text-sm text-sand-800">{label}</span>
      <Badge status={enabled ? "success" : "neutral"}>
        {enabled ? (
          <>
            <Check className="mr-1 h-3 w-3" />
            On
          </>
        ) : (
          <>
            <Minus className="mr-1 h-3 w-3" />
            Off
          </>
        )}
      </Badge>
    </div>
  );
}
