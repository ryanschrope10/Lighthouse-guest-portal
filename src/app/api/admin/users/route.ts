import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import type { ApiResponse } from '@/types/index';

export interface PortalUserRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  newbook_guest_id: string | null;
  created_at: string;
  /** Whether an unused, unexpired reset link is outstanding. */
  reset_pending: boolean;
}

// GET /api/admin/users — portal accounts, for the staff reset screen.
// Never returns password hashes.
export async function GET() {
  try {
    await requireAdmin();

    const rows = (await sql`
      select u.id, u.email, u.first_name, u.last_name, u.role,
             u.newbook_guest_id, u.created_at,
             exists (
               select 1 from password_resets r
               where r.user_id = u.id
                 and r.used_at is null
                 and r.expires_at > now()
             ) as reset_pending
      from users u
      order by u.created_at desc
      limit 200
    `) as PortalUserRow[];

    return NextResponse.json<ApiResponse<PortalUserRow[]>>(
      { data: rows, error: null },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status =
      msg === 'Unauthorized' ? 401 : msg.includes('Forbidden') ? 403 : 500;
    if (status === 500) console.error('GET /api/admin/users error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}
