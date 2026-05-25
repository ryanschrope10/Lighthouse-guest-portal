"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CatalogForm } from "../catalog-form";

function NewAddonForm() {
  const sp = useSearchParams();
  const propertyId = sp.get("property_id") ?? "";

  return <CatalogForm mode="create" initial={{ property_id: propertyId }} />;
}

export default function NewAddonPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
        New Catalog Item
      </h1>
      <p className="mt-1 text-sm text-sand-600">
        Define a new add-on guests can request.
      </p>
      <Suspense fallback={null}>
        <NewAddonForm />
      </Suspense>
    </div>
  );
}
