import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import type { ApiResponse } from '@/types';
import type {
  LockCode,
  LockCodeRevealAfter,
  UpdateLockCodeInput,
} from '@/types/lock-codes';

const REVEAL_OPTIONS: LockCodeRevealAfter[] = [
  'paid_and_checkin',
  'paid',
  'always',
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = (await sql`
      select * from lock_codes where id = ${id} limit 1
    `) as Array<LockCode>;
    if (rows.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Not found' },
        { status: 404 }
      );
    }
    return NextResponse.json<ApiResponse<LockCode>>(
      { data: rows[0], error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/admin/lock-codes/[id] error:', error);
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
    const body: UpdateLockCodeInput & { revoke?: boolean } =
      await request.json();

    const existing = (await sql`
      select * from lock_codes where id = ${id} limit 1
    `) as Array<LockCode>;
    if (existing.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Not found' },
        { status: 404 }
      );
    }
    const c = existing[0];

    const nextCode = typeof body.code === 'string' ? body.code : c.code;
    const nextReveal: LockCodeRevealAfter =
      typeof body.reveal_after === 'string' &&
      REVEAL_OPTIONS.includes(body.reveal_after as LockCodeRevealAfter)
        ? body.reveal_after
        : c.reveal_after;
    const nextNotes = body.notes !== undefined ? body.notes : c.notes;

    let nextRevokedAt: string | null;
    if (body.revoke === true) {
      nextRevokedAt = new Date().toISOString();
    } else if (body.revoke === false) {
      nextRevokedAt = null;
    } else if (body.revoked_at !== undefined) {
      nextRevokedAt = body.revoked_at;
    } else {
      nextRevokedAt = c.revoked_at;
    }

    const updated = (await sql`
      update lock_codes set
        code = ${nextCode},
        reveal_after = ${nextReveal},
        notes = ${nextNotes},
        revoked_at = ${nextRevokedAt}
      where id = ${id}
      returning *
    `) as Array<LockCode>;

    return NextResponse.json<ApiResponse<LockCode>>(
      { data: updated[0], error: null },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status = msg === 'Unauthorized' ? 401 : msg.includes('Forbidden') ? 403 : 500;
    if (status === 500) console.error('PATCH /api/admin/lock-codes/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}
