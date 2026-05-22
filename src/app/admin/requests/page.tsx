"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Check, X, PackageCheck, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { ApiResponse } from "@/types/index";
import type {
  AddonRequestStatus,
  AddonRequestWithCatalog,
} from "@/types/addons";

const STATUS_OPTIONS = [
  { label: "Pending & active", value: "pending,auto_approved,approved,paid" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Auto-approved", value: "auto_approved" },
  { label: "Paid", value: "paid" },
  { label: "Fulfilled", value: "fulfilled" },
  { label: "Denied", value: "denied" },
];

const CATEGORY_OPTIONS = [
  { label: "All categories", value: "" },
  { label: "Checkout", value: "checkout" },
  { label: "Stay", value: "stay" },
  { label: "Extra", value: "extra" },
  { label: "Service", value: "service" },
];

const STATUS_BADGE: Record<
  AddonRequestStatus,
  { label: string; status: "info" | "success" | "warning" | "danger" | "neutral" }
> = {
  pending: { label: "Pending", status: "warning" },
  auto_approved: { label: "Auto-approved", status: "info" },
  approved: { label: "Approved", status: "info" },
  paid: { label: "Paid", status: "success" },
  fulfilled: { label: "Fulfilled", status: "success" },
  denied: { label: "Denied", status: "danger" },
  cancelled: { label: "Cancelled", status: "neutral" },
};

function formatCents(c: number): string {
  return `$${(c / 100).toFixed(2)}`;
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AddonRequestWithCatalog[] | null>(null);
  const [propertyId, setPropertyId] = useState("");
  const [statusFilter, setStatusFilter] = useState(STATUS_OPTIONS[0].value);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (propertyId) params.set("property_id", propertyId);
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    const res = await fetch(`/api/admin/requests?${params.toString()}`);
    const json: ApiResponse<AddonRequestWithCatalog[]> = await res.json();
    if (json.error) {
      setError(json.error);
      setRequests([]);
      return;
    }
    setError(null);
    setRequests(json.data ?? []);
  }, [propertyId, statusFilter, categoryFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const params = new URLSearchParams();
      if (propertyId) params.set("property_id", propertyId);
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      const res = await fetch(`/api/admin/requests?${params.toString()}`);
      const json: ApiResponse<AddonRequestWithCatalog[]> = await res.json();
      if (cancelled) return;
      if (json.error) {
        setError(json.error);
        setRequests([]);
        return;
      }
      setError(null);
      setRequests(json.data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyId, statusFilter, categoryFilter]);

  async function act(id: string, action: "approve" | "deny" | "fulfill") {
    setBusyId(id);
    await fetch(`/api/admin/requests/${id}/${action}`, { method: "POST" });
    await load();
    setBusyId(null);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Add-on Requests
          </h1>
          <p className="mt-1 text-sm text-sand-600">
            Approve, deny, or mark fulfilled.
          </p>
        </div>
        <Button variant="secondary" onClick={load}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card className="mt-5">
        <CardBody className="grid gap-3 sm:grid-cols-3">
          <Input
            label="Property ID"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value.trim())}
          />
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
          />
          <Select
            label="Category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={CATEGORY_OPTIONS}
          />
        </CardBody>
      </Card>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="mt-5">
        {requests === null ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-sm text-sand-600">No requests match these filters.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((r) => {
              const badge = STATUS_BADGE[r.status];
              const canApprove = r.status === "pending";
              const canFulfill =
                r.status === "approved" ||
                r.status === "paid" ||
                r.status === "auto_approved";
              return (
                <Card key={r.id}>
                  <CardBody>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-base font-semibold text-gray-900">
                            {r.addon_catalog?.name ?? r.addon_type ?? "Add-on"}
                          </p>
                          <Badge status={badge.status}>{badge.label}</Badge>
                          {r.addon_catalog?.category && (
                            <Badge status="info">{r.addon_catalog.category}</Badge>
                          )}
                          {r.payment_status === "paid" && (
                            <Badge status="success">Paid</Badge>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-sand-600 space-y-0.5">
                          <p>
                            Requested{" "}
                            {format(
                              parseISO(r.requested_at),
                              "MMM d, yyyy h:mm a",
                            )}
                          </p>
                          {r.scheduled_for && (
                            <p>
                              Scheduled for{" "}
                              {format(
                                parseISO(r.scheduled_for),
                                "MMM d, yyyy h:mm a",
                              )}
                            </p>
                          )}
                          <p>
                            Quantity {r.quantity} ·{" "}
                            {formatCents(r.price_cents)}
                          </p>
                          {Boolean(
                            (r.details as { requires_room_move?: boolean })
                              ?.requires_room_move,
                          ) && (
                            <p className="text-amber-700">
                              May require a room move.
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {canApprove && (
                          <Button
                            size="sm"
                            onClick={() => act(r.id, "approve")}
                            loading={busyId === r.id}
                          >
                            <Check className="h-4 w-4" />
                            Approve
                          </Button>
                        )}
                        {canApprove && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => act(r.id, "deny")}
                            loading={busyId === r.id}
                          >
                            <X className="h-4 w-4" />
                            Deny
                          </Button>
                        )}
                        {canFulfill && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => act(r.id, "fulfill")}
                            loading={busyId === r.id}
                          >
                            <PackageCheck className="h-4 w-4" />
                            Fulfilled
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
