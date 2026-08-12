import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import type { ApiResponse } from '@/types';
import type { AddonCatalogItem } from '@/types/addons';

interface CreateCatalogBody {
  property_id: string;
  slug: string;
  name: string;
  description?: string | null;
  category?: 'checkout' | 'stay' | 'extra' | 'service';
  price_cents?: number;
  requires_approval?: boolean;
  active?: boolean;
  sort_order?: number;
  details?: Record<string, unknown>;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const url = new URL(request.url);
    const propertyId = url.searchParams.get('property_id');

    const rows = (propertyId
      ? await sql`
          select * from addon_catalog
          where property_id = ${propertyId}
          order by sort_order asc, name asc
        `
      : await sql`
          select * from addon_catalog
          order by sort_order asc, name asc
        `) as Array<AddonCatalogItem>;

    return NextResponse.json<ApiResponse<AddonCatalogItem[]>>(
      { data: rows, error: null },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status = msg === 'Unauthorized' ? 401 : msg.includes('Forbidden') ? 403 : 500;
    if (status === 500) console.error('GET /api/admin/addons error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body: CreateCatalogBody = await request.json();
    if (!body.property_id || !body.slug || !body.name) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'property_id, slug, and name are required' },
        { status: 400 }
      );
    }

    const inserted = (await sql`
      insert into addon_catalog (
        property_id, slug, name, description, category,
        price_cents, requires_approval, active, sort_order, details
      )
      values (
        ${body.property_id}, ${body.slug}, ${body.name},
        ${body.description ?? null}, ${body.category ?? 'extra'},
        ${body.price_cents ?? 0}, ${body.requires_approval ?? true},
        ${body.active ?? true}, ${body.sort_order ?? 0},
        ${JSON.stringify(body.details ?? {})}::jsonb
      )
      returning *
    `) as Array<AddonCatalogItem>;

    return NextResponse.json<ApiResponse<AddonCatalogItem>>(
      { data: inserted[0], error: null },
      { status: 201 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status = msg === 'Unauthorized' ? 401 : msg.includes('Forbidden') ? 403 : 500;
    if (status === 500) console.error('POST /api/admin/addons error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}
