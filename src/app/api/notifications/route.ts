import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentGuest } from '@/lib/session';
import type { Notification, ApiResponse } from '@/types';

interface NotificationRow {
  id: string;
  property_id: string;
  target_type: string;
  target_id: string | null;
  title: string;
  body: string | null;
  channel: string;
  sent_at: string;
  created_by: string | null;
}

export async function GET() {
  try {
    const guest = await getCurrentGuest();

    if (!guest) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // A guest sees notifications addressed directly to them plus the
    // property-wide broadcasts for the property they're linked to. Admin
    // notifications are excluded.
    const rows = (await sql`
      select id, property_id, target_type, target_id, title, body,
             channel, sent_at, created_by
      from notifications
      where property_id = ${guest.property_id}
        and (
          (target_type = 'guest' and target_id = ${guest.id})
          or target_type in ('all_guests', 'property', 'booking_group')
        )
      order by sent_at desc
      limit 50
    `) as NotificationRow[];

    const notifications: Notification[] = rows.map((r) => ({
      id: r.id,
      property_id: r.property_id,
      target_type:
        r.target_type === 'guest'
          ? 'specific_guest'
          : r.target_type === 'booking_group'
            ? 'booking_group'
            : 'all_guests',
      target_id: r.target_id,
      title: r.title,
      body: r.body ?? '',
      channel:
        r.channel === 'email' || r.channel === 'both' ? r.channel : 'push',
      sent_at: r.sent_at,
      created_by: r.created_by,
      // No read-tracking table exists on this track yet; surface as unread.
      read: false,
    }));

    return NextResponse.json<ApiResponse<Notification[]>>(
      { data: notifications, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const guest = await getCurrentGuest();

    if (!guest) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (
      !body?.notification_ids ||
      !Array.isArray(body.notification_ids) ||
      body.notification_ids.length === 0
    ) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'notification_ids array is required' },
        { status: 400 }
      );
    }

    const ids = body.notification_ids.filter(
      (v: unknown): v is string => typeof v === 'string'
    );

    // Scope to notifications this guest is actually allowed to see; return the
    // subset that resolves to real rows. There is no read-tracking column on
    // this track yet, so marking read is not persisted server-side.
    const rows = (await sql`
      select id from notifications
      where property_id = ${guest.property_id}
        and id = any(${ids}::uuid[])
        and (
          (target_type = 'guest' and target_id = ${guest.id})
          or target_type in ('all_guests', 'property', 'booking_group')
        )
    `) as Array<{ id: string }>;

    return NextResponse.json<ApiResponse<{ marked_read: string[] }>>(
      { data: { marked_read: rows.map((r) => r.id) }, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/notifications error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
