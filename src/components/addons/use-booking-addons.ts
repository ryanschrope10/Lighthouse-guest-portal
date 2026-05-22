"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResponse } from "@/types/index";
import type {
  AddonCatalogItem,
  AddonRequestWithCatalog,
} from "@/types/addons";

interface BookingAddonsResponse {
  catalog: AddonCatalogItem[];
  requests: AddonRequestWithCatalog[];
}

export function useBookingAddons(bookingId: string) {
  const [data, setData] = useState<BookingAddonsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/bookings/${bookingId}/addons`);
    const json: ApiResponse<BookingAddonsResponse> = await res.json();
    if (json.error || !json.data) {
      setError(json.error ?? "Failed to load");
      return;
    }
    setData(json.data);
  }, [bookingId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/bookings/${bookingId}/addons`);
      const json: ApiResponse<BookingAddonsResponse> = await res.json();
      if (cancelled) return;
      if (json.error || !json.data) {
        setError(json.error ?? "Failed to load");
        return;
      }
      setData(json.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  return { data, error, refresh };
}

export function catalogBySlug(
  items: AddonCatalogItem[] | undefined,
  slug: string,
): AddonCatalogItem | undefined {
  return items?.find((i) => i.slug === slug);
}
