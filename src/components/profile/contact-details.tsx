"use client";

import {
  User,
  Mail,
  Phone,
  MapPin,
  BellRing,
  Check,
  Minus,
} from "lucide-react";
import { useGuest } from "@/lib/context/guest-context";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { GuestAddress } from "@/types/index";

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

  // Read-only view of the Newbook record. The portal reads this profile
  // straight from Newbook on every load, and there is no write-back path
  // yet, so an in-portal edit could not reach the PMS or survive a refresh.
  // Guests are pointed at the front desk instead of being shown a Save
  // button that does nothing.
  const form = initialForm;

  return (
    <div className="space-y-5">
      {/* Header with edit toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sand-700">
          <User className="h-5 w-5" />
          <span className="text-sm font-medium">Personal Information</span>
        </div>
      </div>

      {/* Name fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="First Name"
          name="first_name"
          value={form.first_name}
          disabled
          placeholder="First name"
        />
        <Input
          label="Last Name"
          name="last_name"
          value={form.last_name}
          disabled
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
            disabled
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
          disabled
          placeholder="123 Main St"
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="City"
              name="city"
              value={form.address.city ?? ""}
              disabled
              placeholder="City"
            />
          </div>
          <Input
            label="State"
            name="state"
            value={form.address.state ?? ""}
            disabled
            placeholder="TX"
          />
          <Input
            label="ZIP"
            name="zip"
            value={form.address.zip ?? ""}
            disabled
            placeholder="78701"
          />
          <Input
            label="Country"
            name="country"
            value={form.address.country ?? ""}
            disabled
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

      <p className="border-t border-sand-200 pt-4 text-xs text-sand-500">
        These details come from your reservation record. Contact the front desk
        to update your name, phone, or mailing address.
      </p>
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
