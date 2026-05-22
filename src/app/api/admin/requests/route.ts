import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireSession } from '@/lib/session';
import type { ApiResponse } from '@/types';
import type { AddonCategory, AddonRequestWithCatalog } from '@/types/addons';

const DEFAULT_STATUSES = ['pending', 'auto_approved', 'approved', 'paid'];

export async function GET(request: Request) {
  try {
    // TODO: enforce admin role once admin login exists
    await requireSession();

    const url = new URL(request.url);
    const propertyId = url.searchParams.get('property_id');
    const statusParam = url.searchParams.get('status');
    const category = url.searchParams.get('category');

    const statuses = statusParam
      ? statusParam.split(',').map((s) => s.trim()).filter(Boolean)
      : DEFAULT_STATUSES;

    const rows = (propertyId
      ? await sql`
          select
            r.*,
            c.id as c_id, c.slug as c_slug, c.name as c_name, c.category as c_category,
            c.price_cents as c_price_cents, c.requires_approval as c_requires_approval
          from addon_requests r
          left join addon_catalog c on c.id = r.addon_catalog_id
          where r.property_id = ${propertyId} and r.status = any(${statuses})
          order by r.requested_at desc
        `
      : await sql`
          select
            r.*,
            c.id as c_id, c.slug as c_slug, c.name as c_name, c.category as c_category,
            c.price_cents as c_price_cents, c.requires_approval as c_requires_approval
          from addon_requests r
          left join addon_catalog c on c.id = r.addon_catalog_id
          where r.status = any(${statuses})
          order by r.requested_at desc
        `) as Array<Record<string, unknown>>;

    const mapped: AddonRequestWithCatalog[] = rows.map((r) => ({
      id: r.id as string,
      booking_id: r.booking_id as string,
      guest_id: r.guest_id as string,
      property_id: r.property_id as string,
      addon_catalog_id: r.addon_catalog_id as string | null,
      addon_type: r.addon_type as string | null,
      quantity: r.quantity as number,
      price_cents: r.price_cents as number,
      status: r.status as AddonRequestWithCatalog['status'],
      payment_status: r.payment_status as AddonRequestWithCatalog['payment_status'],
      paid_at: r.paid_at as string | null,
      scheduled_for: r.scheduled_for as string | null,
      staff_notes: r.staff_notes as string | null,
      resolved_by: r.resolved_by as string | null,
      details: (r.details as Record<string, unknown>) ?? {},
      requested_at: r.requested_at as string,
      resolved_at: r.resolved_at as string | null,
      addon_catalog: r.c_id
        ? {
            id: r.c_id as string,
            slug: r.c_slug as string,
            name: r.c_name as string,
            category: r.c_category as AddonCategory,
            price_cents: r.c_price_cents as number,
            requires_approval: r.c_requires_approval as boolean,
          }
        : null,
    }));

    const filtered = category
      ? mapped.filter((r) => r.addon_catalog?.category === category)
      : mapped;

    return NextResponse.json<ApiResponse<AddonRequestWithCatalog[]>>(
      { data: filtered, error: null },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status = msg === 'Unauthorized' ? 401 : msg.includes('Forbidden') ? 403 : 500;
    if (status === 500) console.error('GET /api/admin/requests error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}
