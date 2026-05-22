"use client";

import { useState } from "react";
import { Check, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApiResponse } from "@/types/index";
import type { AddonRequestRow } from "@/types/addons";

interface Props {
  bookingId: string;
  request: AddonRequestRow;
  onPaid: (req: AddonRequestRow) => void;
}

export function PaymentStep({ bookingId, request, onPaid }: Props) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (request.price_cents <= 0 || request.payment_status === "paid") {
    return (
      <div className="flex flex-col items-center py-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <p className="mt-3 text-base font-semibold text-gray-900">
          {request.status === "pending"
            ? "Request submitted"
            : "Request confirmed"}
        </p>
        <p className="mt-1 text-sm text-sand-500">
          {request.status === "pending"
            ? "Staff will review and confirm shortly."
            : "Your request is confirmed."}
        </p>
      </div>
    );
  }

  async function pay() {
    setPaying(true);
    setError(null);
    const res = await fetch(
      `/api/bookings/${bookingId}/addons/${request.id}/pay`,
      { method: "POST" },
    );
    const json: ApiResponse<AddonRequestRow> = await res.json();
    setPaying(false);
    if (json.error || !json.data) {
      setError(json.error ?? "Payment failed");
      return;
    }
    onPaid(json.data);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-sand-600">
        Amount due:{" "}
        <span className="font-semibold text-gray-900">
          ${(request.price_cents / 100).toFixed(2)}
        </span>
      </p>
      <p className="text-xs text-sand-500">
        Payment is processed through the property&apos;s booking system.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={pay} loading={paying} disabled={paying}>
        <CreditCard className="h-4 w-4" />
        Pay now
      </Button>
    </div>
  );
}
