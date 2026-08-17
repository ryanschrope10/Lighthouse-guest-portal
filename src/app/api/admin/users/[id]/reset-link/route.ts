import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import {
  issueResetToken,
  RESET_TOKEN_TTL_MINUTES,
} from '@/lib/password-reset';
import type { ApiResponse } from '@/types/index';

export interface ResetLinkResponse {
  url: string;
  expires_at: string;
  expires_in_minutes: number;
  email: string;
}

/**
 * Where the guest-facing link should point.
 *
 * The host the staff member is actually using wins: they generate the link on
 * the same deployment the guest will open, and it can't go stale. A wrong
 * NEXT_PUBLIC_APP_URL (ours is set to localhost for dev) would otherwise send
 * a guest a link to a machine that isn't theirs.
 */
function portalBaseUrl(request: Request): string {
  const origin = new URL(request.url).origin;
  if (origin) return origin.replace(/\/+$/, '');
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') ?? '';
}

// POST /api/admin/users/[id]/reset-link
// Issues a single-use password reset link for one portal account. Admin only.
// The link is returned to the staff member to pass on to the guest — there is
// no outbound email on this deployment.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const rows = (await sql`
      select id, email from users where id = ${id} limit 1
    `) as Array<{ id: string; email: string }>;
    const user = rows[0];
    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Account not found' },
        { status: 404 }
      );
    }

    const { token, expiresAt } = await issueResetToken(user.id, admin.email);

    return NextResponse.json<ApiResponse<ResetLinkResponse>>(
      {
        data: {
          url: `${portalBaseUrl(request)}/reset-password?token=${encodeURIComponent(token)}`,
          expires_at: expiresAt,
          expires_in_minutes: RESET_TOKEN_TTL_MINUTES,
          email: user.email,
        },
        error: null,
      },
      { status: 201 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status =
      msg === 'Unauthorized' ? 401 : msg.includes('Forbidden') ? 403 : 500;
    if (status === 500) {
      console.error('POST /api/admin/users/[id]/reset-link error:', error);
    }
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}
