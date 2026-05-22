"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import type { ApiResponse } from "@/types/index";
import type { AddonRequestRow } from "@/types/addons";
import { catalogBySlug, useBookingAddons } from "./use-booking-addons";
import { PaymentStep } from "./payment-step";

interface Props {
  bookingId: string;
  checkOutIso: string;
}

const TIME_OPTIONS = [
  { label: "1:00 PM", value: "13:00" },
  { label: "2:00 PM", value: "14:00" },
  { label: "3:00 PM", value: "15:00" },
];

export function RequestLateCheckout({ bookingId, checkOutIso }: Props) {
  const { data, refresh } = useBookingAddons(bookingId);
  const catalog = catalogBySlug(data?.catalog, "late_checkout");
  const [open, setOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState("14:00");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<AddonRequestRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const existing = useMemo(
    () =>
      data?.requests.find(
        (r) =>
          r.addon_catalog?.slug === "late_checkout" &&
          r.status !== "denied" &&
          r.status !== "cancelled",
      ),
    [data],
  );

  if (!catalog) return null;

  async function submit() {
    setSubmitting(true);
    setError(null);
    const checkOut = parseISO(checkOutIso);
    const [h, m] = selectedTime.split(":").map(Number);
    const scheduled = new Date(checkOut);
    scheduled.setHours(h, m, 0, 0);

    const res = await fetch(`/api/bookings/${bookingId}/late-checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduled_for: scheduled.toISOString() }),
    });
    const json: ApiResponse<AddonRequestRow> = await res.json();
    setSubmitting(false);
    if (json.error || !json.data) {
      setError(json.error ?? "Request failed");
      return;
    }
    setCreated(json.data);
    await refresh();
  }

  return (
    <>
      <Card>
        <CardBody>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CalendarClock className="h-4 w-4 text-sand-400" />
                <p className="text-base font-semibold text-gray-900">
                  Late Checkout
                </p>
                {existing && (
                  <Badge
                    status={
                      existing.status === "denied"
                        ? "danger"
                        : existing.status === "auto_approved" ||
                            existing.status === "approved" ||
                            existing.status === "paid" ||
                            existing.status === "fulfilled"
                          ? "success"
                          : "warning"
                    }
                  >
                    {existing.status.replace("_", " ")}
                  </Badge>
                )}
              </div>
              {catalog.description && (
                <p className="mt-1 text-sm text-sand-600">
                  {catalog.description}
                </p>
              )}
              <p className="mt-2 text-sm font-medium text-gray-900">
                ${(catalog.price_cents / 100).toFixed(2)}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setOpen(true);
                setCreated(null);
                setError(null);
              }}
            >
              {existing ? "Request again" : "Request"}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Request Late Checkout"
        footer={
          !created ? (
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button loading={submitting} onClick={submit}>
                Request
              </Button>
            </div>
          ) : undefined
        }
      >
        {created ? (
          <PaymentStep
            bookingId={bookingId}
            request={created}
            onPaid={(req) => {
              setCreated(req);
              void refresh();
            }}
          />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-sand-600">
              Current check-out:{" "}
              <span className="font-medium text-gray-900">
                {format(parseISO(checkOutIso), "EEE, MMM d, yyyy 'at' h:mm a")}
              </span>
            </p>
            <Select
              label="Pick a new check-out time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              options={TIME_OPTIONS}
            />
            <p className="text-sm text-sand-500">
              Fee: ${(catalog.price_cents / 100).toFixed(2)}
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
      </Modal>
    </>
  );
}
