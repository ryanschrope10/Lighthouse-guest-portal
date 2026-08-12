"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut } from "lucide-react";
import { useGuest } from "@/lib/context/guest-context";
import { Button } from "@/components/ui/button";

export function AccountSettings() {
  const router = useRouter();
  const { property } = useGuest();
  const [signingOut, setSigningOut] = useState(false);

  // Password resets and account closures are handled by staff (see
  // /forgot-password) — there is no self-service endpoint for either, so
  // this section points at the front desk rather than offering a button
  // that only looks like it works.
  const frontDeskPhone = property?.contact_info?.phone ?? null;
  const frontDeskEmail = property?.contact_info?.email ?? null;

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Sign Out */}
      <div className="flex items-center justify-between rounded-lg border border-sand-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <LogOut className="h-5 w-5 text-sand-500" />
          <div>
            <p className="text-sm font-medium text-sand-900">Sign Out</p>
            <p className="text-xs text-sand-500">
              Sign out of your account on this device
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSignOut}
          disabled={signingOut}
          loading={signingOut}
        >
          Sign Out
        </Button>
      </div>

      {/* Password + account changes are staff-assisted */}
      <div className="rounded-lg border border-sand-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <KeyRound className="h-5 w-5 text-sand-500" />
          <p className="text-sm font-medium text-sand-900">
            Password &amp; account changes
          </p>
        </div>
        <p className="mt-2 text-xs text-sand-500">
          For your security, password resets and account closures are handled
          by our team. Contact the front desk and a staff member will help you.
        </p>
        {(frontDeskPhone || frontDeskEmail) && (
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {frontDeskPhone && (
              <a
                href={`tel:${frontDeskPhone.replace(/[^\d+]/g, "")}`}
                className="font-medium text-gold-600 hover:text-gold-700"
              >
                {frontDeskPhone}
              </a>
            )}
            {frontDeskEmail && (
              <a
                href={`mailto:${frontDeskEmail}`}
                className="font-medium text-gold-600 hover:text-gold-700"
              >
                {frontDeskEmail}
              </a>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
