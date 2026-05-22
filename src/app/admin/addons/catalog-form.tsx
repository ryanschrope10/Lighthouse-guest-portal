"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AddonCatalogItem } from "@/types/addons";
import type { ApiResponse } from "@/types/index";

interface Props {
  mode: "create" | "edit";
  initial?: Partial<AddonCatalogItem> & { property_id?: string };
}

const CATEGORY_OPTIONS = [
  { label: "Checkout", value: "checkout" },
  { label: "Stay", value: "stay" },
  { label: "Extra", value: "extra" },
  { label: "Service", value: "service" },
];

export function CatalogForm({ mode, initial }: Props) {
  const router = useRouter();
  const [propertyId, setPropertyId] = useState(initial?.property_id ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<string>(initial?.category ?? "extra");
  const [priceDollars, setPriceDollars] = useState(
    ((initial?.price_cents ?? 0) / 100).toFixed(2),
  );
  const [requiresApproval, setRequiresApproval] = useState(
    initial?.requires_approval ?? true,
  );
  const [active, setActive] = useState(initial?.active ?? true);
  const [sortOrder, setSortOrder] = useState(String(initial?.sort_order ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const priceCents = Math.round(parseFloat(priceDollars || "0") * 100);
    const payload = {
      property_id: propertyId,
      slug,
      name,
      description: description || null,
      category,
      price_cents: priceCents,
      requires_approval: requiresApproval,
      active,
      sort_order: parseInt(sortOrder || "0", 10),
    };

    const url =
      mode === "create" ? "/api/admin/addons" : `/api/admin/addons/${initial?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json: ApiResponse<AddonCatalogItem> = await res.json();
    setSubmitting(false);
    if (json.error || !json.data) {
      setError(json.error ?? "Save failed");
      return;
    }
    router.push("/admin/addons");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 mt-5 max-w-2xl">
      <Card>
        <CardBody className="space-y-4">
          <Input
            label="Property ID"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value.trim())}
            required
            disabled={mode === "edit"}
          />
          <Input
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.trim())}
            required
            helperText="e.g. late_checkout, stay_extension, propane_tank"
            disabled={mode === "edit"}
          />
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Textarea
            label="Description"
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={CATEGORY_OPTIONS}
          />
          <Input
            label="Price (USD)"
            type="number"
            step="0.01"
            min="0"
            value={priceDollars}
            onChange={(e) => setPriceDollars(e.target.value)}
          />
          <Input
            label="Sort order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={requiresApproval}
              onChange={(e) => setRequiresApproval(e.target.checked)}
            />
            Requires staff approval
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Active
          </label>
        </CardBody>
      </Card>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <Button type="submit" loading={submitting}>
          {mode === "create" ? "Create" : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/addons")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
