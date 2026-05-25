import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireGuest } from '@/lib/session';
import { ensureBookingSynced } from '@/lib/booking-sync';
import type { ApiResponse } from '@/types';
import type {
  AddonCatalogItem,
  AddonCategory,
  AddonRequestRow,
  AddonRequestWithCatalog,
} from '@/types/addons';

interface AddAddonRequestBody {
  addon_catalog_id: string;
  quantity?: number;
  details?: Record<string, unknown>;
}

interface BookingAddonsResponse {
  catalog: AddonCatalogItem[];
  requests: AddonRequestWithCatalog[];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guest = await requireGuest();

    const { id: bookingId } = await params;
    const booking = await ensureBookingSynced(bookingId, guest);
    if (!booking) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Booking not found' },
        { status: 404 }
      );
    }

    const [catalogRaw, requestRowsRaw] = await Promise.all([
      sql`
        select * from addon_catalog
        where property_id = ${booking.property_id} and active = true
        order by sort_order asc
      `,
      sql`
        select
          r.*,
          c.id as c_id, c.slug as c_slug, c.name as c_name, c.category as c_category,
          c.price_cents as c_price_cents, c.requires_approval as c_requires_approval
        from addon_requests r
        left join addon_catalog c on c.id = r.addon_catalog_id
        where r.booking_id = ${booking.id}
        order by r.requested_at desc
      `,
    ]);
    const catalog = catalogRaw as AddonCatalogItem[];
    const requestRows = requestRowsRaw as Array<Record<string, unknown>>;

    const requests: AddonRequestWithCatalog[] = requestRows.map((r) => ({
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

    return NextResponse.json<ApiResponse<BookingAddonsResponse>>(
      {
        data: {
          catalog,
          requests,
        },
        error: null,
      },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status = msg === 'Unauthorized' ? 401 : msg.includes('Forbidden') ? 403 : 500;
    if (status === 500) console.error('GET /api/bookings/[id]/addons error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guest = await requireGuest();

    const { id: bookingId } = await params;
    const body: AddAddonRequestBody = await request.json();

    if (!body.addon_catalog_id) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'addon_catalog_id is required' },
        { status: 400 }
      );
    }

    const quantity = Math.max(1, Math.floor(body.quantity ?? 1));

    const booking = await ensureBookingSynced(bookingId, guest);
    if (!booking || booking.guest_id !== guest.id) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Booking not found' },
        { status: 404 }
      );
    }

    const catalogRows = (await sql`
      select id, property_id, slug, name, price_cents, requires_approval, active
      from addon_catalog
      where id = ${body.addon_catalog_id}
      limit 1
    `) as Array<{
      id: string;
      property_id: string;
      slug: string;
      name: string;
      price_cents: number;
      requires_approval: boolean;
      active: boolean;
    }>;
    if (catalogRows.length === 0 || catalogRows[0].property_id !== booking.property_id) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Add-on not available for this property' },
        { status: 404 }
      );
    }
    const catalog = catalogRows[0];
    if (!catalog.active) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Add-on is not currently available' },
        { status: 400 }
      );
    }

    const priceCents = catalog.price_cents * quantity;
    const status =
      !catalog.requires_approval && priceCents === 0 ? 'auto_approved' : 'pending';

    const inserted = (await sql`
      insert into addon_requests (
        booking_id, guest_id, property_id, addon_catalog_id, addon_type,
        quantity, price_cents, status, payment_status, details
      )
      values (
        ${booking.id}, ${guest.id}, ${booking.property_id}, ${catalog.id}, ${catalog.slug},
        ${quantity}, ${priceCents}, ${status},
        ${priceCents === 0 ? 'waived' : 'unpaid'},
        ${JSON.stringify(body.details ?? {})}::jsonb
      )
      returning *
    `) as Array<AddonRequestRow>;

    const totalLine =
      priceCents > 0 ? `Total $${(priceCents / 100).toFixed(2)}.` : '';
    await sql`
      insert into notifications (property_id, target_type, target_id, title, body, channel)
      values (
        ${booking.property_id}, 'admin', ${booking.property_id},
        ${`Add-on requested: ${catalog.name}`},
        ${`Quantity ${quantity}. ${totalLine}`.trim()},
        'push'
      )
    `;

    return NextResponse.json<ApiResponse<AddonRequestRow>>(
      { data: inserted[0], error: null },
      { status: 201 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status = msg === 'Unauthorized' ? 401 : msg.includes('Forbidden') ? 403 : 500;
    if (status === 500) console.error('POST /api/bookings/[id]/addons error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}
