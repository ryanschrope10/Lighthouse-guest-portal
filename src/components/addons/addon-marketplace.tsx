"use client";

import { useMemo, useState } from "react";
import { PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { ApiResponse } from "@/types/index";
import type { AddonCatalogItem, AddonRequestRow } from "@/types/addons";
import { useBookingAddons } from "./use-booking-addons";
import { PaymentStep } from "./payment-step";

interface Props {
  bookingId: string;
}

export function AddonMarketplace({ bookingId }: Props) {
  const { data, refresh } = useBookingAddons(bookingId);

  const marketplace = useMemo(
    () =>
      (data?.catalog ?? []).filter(
        (c) => c.slug !== "late_checkout" && c.slug !== "stay_extension",
      ),
    [data],
  );

  const [selected, setSelected] = useState<AddonCatalogItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<AddonRequestRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (marketplace.length === 0) return null;

  async function submit() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/bookings/${bookingId}/addons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addon_catalog_id: selected.id,
        quantity,
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

  function openFor(item: AddonCatalogItem) {
    setSelected(item);
    setQuantity(1);
    setCreated(null);
    setError(null);
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {marketplace.map((item) => (
          <Card key={item.id}>
            <CardBody>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <PackagePlus className="h-4 w-4 text-sand-400" />
                    <p className="text-base font-semibold text-gray-900">
                      {item.name}
                    </p>
                  </div>
                  {item.description && (
                    <p className="mt-1 text-sm text-sand-600 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {item.price_cents > 0
                      ? `$${(item.price_cents / 100).toFixed(2)}`
                      : "Free / quoted"}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openFor(item)}
                >
                  Add to stay
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        footer={
          !created && selected ? (
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button loading={submitting} onClick={submit}>
                Submit request
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
        ) : selected ? (
          <div className="space-y-4">
            {selected.description && (
              <p className="text-sm text-sand-600">{selected.description}</p>
            )}
            <Input
              type="number"
              min="1"
              label="Quantity"
              value={String(quantity)}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value || "1", 10)))
              }
            />
            <p className="text-sm text-sand-600">
              Total:{" "}
              <span className="font-medium text-gray-900">
                ${((selected.price_cents * quantity) / 100).toFixed(2)}
              </span>
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
