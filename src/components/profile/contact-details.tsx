"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { useGuest } from "@/lib/context/guest-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Guest, GuestAddress } from "@/types/index";

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

  const [form, setForm] = useState<ContactForm>(initialForm);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  function updateField<K extends keyof ContactForm>(key: K, value: ContactForm[K]) {
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
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    // Placeholder API call
    console.log("Saving contact details:", form);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setEditing(false);
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
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-600 hover:text-gold-700 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-sand-500 hover:text-sand-700 transition-colors"
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
            onChange={(e) => updateAddress("state", e.target.value)}
            disabled={!editing}
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
            onChange={(e) => updateAddress("country", e.target.value)}
            disabled={!editing}
            placeholder="US"
          />
        </div>
      </div>

      {/* Save button */}
      {editing && (
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} loading={saving}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
