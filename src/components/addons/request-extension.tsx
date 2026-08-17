"use client";

import { useMemo, useState } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { CalendarPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { ApiResponse } from "@/types/index";
import type { AddonRequestRow } from "@/types/addons";
import { catalogBySlug, useBookingAddons } from "./use-booking-addons";
import { PaymentStep } from "./payment-step";

interface Props {
  bookingId: string;
  checkOutIso: string;
}

export function RequestExtension({ bookingId, checkOutIso }: Props) {
  const { data, refresh } = useBookingAddons(bookingId);
  const catalog = catalogBySlug(data?.catalog, "stay_extension");
  const minDate = format(parseISO(checkOutIso), "yyyy-MM-dd");
  const [open, setOpen] = useState(false);
  const [newCheckOut, setNewCheckOut] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<AddonRequestRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const existing = useMemo(
    () =>
      data?.requests.find(
        (r) =>
          r.addon_catalog?.slug === "stay_extension" &&
          r.status !== "denied" &&
          r.status !== "cancelled",
      ),
    [data],
  );

  const nightlyCents = catalog?.price_cents ?? 0;
  const extraNights =
    newCheckOut
      ? Math.max(
          1,
          differenceInCalendarDays(
            new Date(newCheckOut + "T12:00:00"),
            parseISO(checkOutIso),
          ),
        )
      : 0;
  const estimateCents = nightlyCents * extraNights;

  if (!catalog) return null;

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/bookings/${bookingId}/extend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        new_check_out: new Date(newCheckOut + "T12:00:00").toISOString(),
      }),
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
                <CalendarPlus className="h-4 w-4 text-sand-400" />
                <p className="text-base font-semibold text-gray-900">
                  Extend Stay
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
              {/* No published rate — the desk quotes it, so don't imply $0. */}
              {nightlyCents > 0 ? (
                <p className="mt-2 text-sm font-medium text-gray-900">
                  From ${(nightlyCents / 100).toFixed(2)} / night
                </p>
              ) : (
                <p className="mt-2 text-sm text-sand-600">
                  The front desk will confirm availability and pricing.
                </p>
              )}
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setOpen(true);
                setCreated(null);
                setError(null);
                setNewCheckOut("");
              }}
            >
              Extend
            </Button>
          </div>
        </CardBody>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Extend Your Stay"
        footer={
          !created ? (
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                loading={submitting}
                onClick={submit}
                disabled={!newCheckOut}
              >
                Request extension
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
                {format(parseISO(checkOutIso), "EEE, MMM d, yyyy")}
              </span>
            </p>
            <Input
              type="date"
              label="New check-out date"
              value={newCheckOut}
              min={minDate}
              onChange={(e) => setNewCheckOut(e.target.value)}
            />
            {newCheckOut && (
              <p className="text-sm text-sand-600">
                {nightlyCents > 0 ? (
                  <>
                    Estimate:{" "}
                    <span className="font-medium text-gray-900">
                      ${(estimateCents / 100).toFixed(2)}
                    </span>{" "}
                    ({extraNights} extra night{extraNights === 1 ? "" : "s"})
                  </>
                ) : (
                  <>
                    {extraNights} extra night{extraNights === 1 ? "" : "s"} — the
                    front desk will confirm the cost with you.
                  </>
                )}
              </p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
      </Modal>
    </>
  );
}
