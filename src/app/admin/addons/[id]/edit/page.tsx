"use client";

import { use, useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import type { ApiResponse } from "@/types/index";
import type { AddonCatalogItem } from "@/types/addons";
import { CatalogForm } from "../../catalog-form";

export default function EditAddonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [item, setItem] = useState<AddonCatalogItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/admin/addons/${id}`);
      const json: ApiResponse<AddonCatalogItem> = await res.json();
      if (cancelled) return;
      if (json.error || !json.data) {
        setError(json.error ?? "Not found");
        return;
      }
      setItem(json.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }
  if (!item) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
        Edit Catalog Item
      </h1>
      <p className="mt-1 text-sm text-sand-600">{item.name}</p>
      <CatalogForm mode="edit" initial={item} />
    </div>
  );
}
