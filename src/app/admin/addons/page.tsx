"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import type { ApiResponse } from "@/types/index";
import type { AddonCatalogItem } from "@/types/addons";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const DEFAULT_SEEDS = [
  {
    slug: "late_checkout",
    name: "Late Checkout",
    description: "Stay past standard check-out time. Subject to availability.",
    category: "checkout" as const,
    price_cents: 2500,
    requires_approval: false,
  },
  {
    slug: "stay_extension",
    name: "Stay Extension",
    description: "Add one or more nights to your current stay.",
    category: "stay" as const,
    price_cents: 7500,
    requires_approval: false,
  },
];

export default function AdminAddonsPage() {
  const [items, setItems] = useState<AddonCatalogItem[] | null>(null);
  const [propertyId, setPropertyId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!propertyId) {
      setItems([]);
      return;
    }
    const res = await fetch(
      `/api/admin/addons?property_id=${encodeURIComponent(propertyId)}`,
    );
    const json: ApiResponse<AddonCatalogItem[]> = await res.json();
    if (json.error) {
      setError(json.error);
      setItems([]);
      return;
    }
    setError(null);
    setItems(json.data ?? []);
  }, [propertyId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!propertyId) {
        if (!cancelled) setItems([]);
        return;
      }
      const res = await fetch(
        `/api/admin/addons?property_id=${encodeURIComponent(propertyId)}`,
      );
      const json: ApiResponse<AddonCatalogItem[]> = await res.json();
      if (cancelled) return;
      if (json.error) {
        setError(json.error);
        setItems([]);
        return;
      }
      setError(null);
      setItems(json.data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  async function seedDefaults() {
    if (!propertyId) return;
    setBusy(true);
    const existing = new Set((items ?? []).map((i) => i.slug));
    for (const seed of DEFAULT_SEEDS) {
      if (existing.has(seed.slug)) continue;
      await fetch("/api/admin/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: propertyId, ...seed }),
      });
    }
    await load();
    setBusy(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this catalog item?")) return;
    setBusy(true);
    await fetch(`/api/admin/addons/${id}`, { method: "DELETE" });
    await load();
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Add-on Catalog
          </h1>
          <p className="mt-1 text-sm text-sand-600">
            Manage paid and approval-based items guests can request.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={seedDefaults} disabled={!propertyId || busy}>
            Seed defaults
          </Button>
          <Link
            href={
              propertyId
                ? `/admin/addons/new?property_id=${encodeURIComponent(propertyId)}`
                : "/admin/addons/new"
            }
          >
            <Button>
              <Plus className="h-4 w-4" />
              New item
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mt-5">
        <CardBody>
          <Input
            label="Property ID"
            placeholder="UUID of the property to manage"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value.trim())}
            helperText="Catalog rows are scoped per property."
          />
        </CardBody>
      </Card>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="mt-5">
        {items === null ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-sm text-sand-600">
                No catalog items yet. Enter a property ID and click{" "}
                <span className="font-medium">Seed defaults</span> to get going.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <Card key={item.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-semibold text-gray-900">
                          {item.name}
                        </p>
                        <Badge status={item.active ? "success" : "neutral"}>
                          {item.active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge status="info">{item.category}</Badge>
                        <span className="text-xs text-sand-500">{item.slug}</span>
                      </div>
                      {item.description && (
                        <p className="mt-1 text-sm text-sand-600">
                          {item.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-sm">
                        <span className="font-medium text-gray-900">
                          {formatCents(item.price_cents)}
                        </span>
                        <span className="text-sand-500">
                          {item.requires_approval
                            ? "Requires approval"
                            : "Auto-approves"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/addons/${item.id}/edit`}>
                        <Button variant="secondary" size="sm">
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => remove(item.id)}
                        disabled={busy}
                        className={clsx(busy && "opacity-50")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
