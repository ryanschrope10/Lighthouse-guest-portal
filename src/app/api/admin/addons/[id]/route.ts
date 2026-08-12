import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import type { ApiResponse } from '@/types';
import type { AddonCatalogItem } from '@/types/addons';

interface UpdateCatalogBody {
  name?: string;
  description?: string | null;
  category?: 'checkout' | 'stay' | 'extra' | 'service';
  price_cents?: number;
  requires_approval?: boolean;
  active?: boolean;
  sort_order?: number;
  details?: Record<string, unknown>;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = (await sql`
      select * from addon_catalog where id = ${id} limit 1
    `) as Array<AddonCatalogItem>;
    if (rows.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Not found' },
        { status: 404 }
      );
    }
    return NextResponse.json<ApiResponse<AddonCatalogItem>>(
      { data: rows[0], error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/admin/addons/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body: UpdateCatalogBody = await request.json();

    const existing = (await sql`
      select * from addon_catalog where id = ${id} limit 1
    `) as Array<AddonCatalogItem>;
    if (existing.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Not found' },
        { status: 404 }
      );
    }
    const c = existing[0];

    const updated = (await sql`
      update addon_catalog set
        name = ${body.name ?? c.name},
        description = ${body.description !== undefined ? body.description : c.description},
        category = ${body.category ?? c.category},
        price_cents = ${body.price_cents ?? c.price_cents},
        requires_approval = ${body.requires_approval ?? c.requires_approval},
        active = ${body.active ?? c.active},
        sort_order = ${body.sort_order ?? c.sort_order},
        details = ${JSON.stringify(body.details ?? c.details ?? {})}::jsonb
      where id = ${id}
      returning *
    `) as Array<AddonCatalogItem>;

    return NextResponse.json<ApiResponse<AddonCatalogItem>>(
      { data: updated[0], error: null },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status = msg === 'Unauthorized' ? 401 : msg.includes('Forbidden') ? 403 : 500;
    if (status === 500) console.error('PATCH /api/admin/addons/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    await sql`delete from addon_catalog where id = ${id}`;

    return NextResponse.json<ApiResponse<{ id: string }>>(
      { data: { id }, error: null },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status = msg === 'Unauthorized' ? 401 : msg.includes('Forbidden') ? 403 : 500;
    if (status === 500) console.error('DELETE /api/admin/addons/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}
