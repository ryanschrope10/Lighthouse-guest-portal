import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireSession } from '@/lib/session';
import type { ApiResponse } from '@/types';
import type { AddonRequestRow } from '@/types/addons';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: enforce admin role once admin login exists
    await requireSession();

    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      staff_notes?: string;
    };

    const updated = (await sql`
      update addon_requests
      set status = 'denied',
          resolved_by = null,
          resolved_at = now(),
          staff_notes = ${body.staff_notes ?? null}
      where id = ${id}
      returning *
    `) as Array<AddonRequestRow>;

    if (updated.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<AddonRequestRow>>(
      { data: updated[0], error: null },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status = msg === 'Unauthorized' ? 401 : msg.includes('Forbidden') ? 403 : 500;
    if (status === 500) console.error('POST /api/admin/requests/[id]/deny error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}
