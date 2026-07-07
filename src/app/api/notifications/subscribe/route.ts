import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentGuest } from '@/lib/session';
import type { ApiResponse } from '@/types';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function POST(request: Request) {
  try {
    const guest = await getCurrentGuest();

    if (!guest) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: PushSubscription = await request.json();

    if (!body?.endpoint) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Push subscription endpoint is required' },
        { status: 400 }
      );
    }

    if (!body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Push subscription keys (p256dh and auth) are required' },
        { status: 400 }
      );
    }

    const subscriptionJson = JSON.stringify(body);

    // push_subscriptions stores the whole subscription as jsonb (no dedicated
    // endpoint column / unique constraint), so upsert manually: replace any
    // existing row for this guest+endpoint, then insert the fresh one.
    await sql`
      delete from push_subscriptions
      where guest_id = ${guest.id}
        and subscription->>'endpoint' = ${body.endpoint}
    `;

    await sql`
      insert into push_subscriptions (guest_id, subscription)
      values (${guest.id}, ${subscriptionJson}::jsonb)
    `;

    return NextResponse.json<ApiResponse<{ subscribed: boolean }>>(
      { data: { subscribed: true }, error: null },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/notifications/subscribe error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
