// ============================================================
// Add-on workflow types
// ============================================================
//
// Unified model: addon_catalog defines what can be requested,
// addon_requests are instances. Covers late checkout, stay
// extensions, and paid add-ons (e.g. propane tank).
// ============================================================

export type AddonCategory = 'checkout' | 'stay' | 'extra' | 'service';

export type AddonRequestStatus =
  | 'pending'
  | 'auto_approved'
  | 'approved'
  | 'denied'
  | 'paid'
  | 'fulfilled'
  | 'cancelled';

export type AddonPaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'waived';

export interface AddonCatalogItem {
  id: string;
  property_id: string;
  slug: string;
  name: string;
  description: string | null;
  category: AddonCategory;
  price_cents: number;
  requires_approval: boolean;
  active: boolean;
  sort_order: number;
  details: Record<string, unknown>;
  created_at: string;
}

export interface AddonRequestRow {
  id: string;
  booking_id: string;
  guest_id: string;
  property_id: string;
  addon_catalog_id: string | null;
  addon_type: string | null;
  quantity: number;
  price_cents: number;
  status: AddonRequestStatus;
  payment_status: AddonPaymentStatus;
  paid_at: string | null;
  scheduled_for: string | null;
  staff_notes: string | null;
  resolved_by: string | null;
  details: Record<string, unknown>;
  requested_at: string;
  resolved_at: string | null;
}

export interface AddonRequestWithCatalog extends AddonRequestRow {
  addon_catalog: Pick<
    AddonCatalogItem,
    'id' | 'slug' | 'name' | 'category' | 'price_cents' | 'requires_approval'
  > | null;
}

export interface CreatePaymentIntentInput {
  bookingId: string;
  amountCents: number;
  description: string;
}

export interface CreatePaymentIntentResult {
  ok: true;
  newbook_payment_token: string;
}
