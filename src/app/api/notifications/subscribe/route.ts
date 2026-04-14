import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: PushSubscription = await request.json();

    if (!body.endpoint) {
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

    // TODO: Replace with real Supabase query
    // const { data: guest } = await supabase
    //   .from('guests')
    //   .select('id')
    //   .eq('auth_user_id', user.id)
    //   .single();
    //
    // // Upsert so re-subscribing from the same browser updates rather than duplicates
    // const { error } = await supabase
    //   .from('push_subscriptions')
    //   .upsert(
    //     {
    //       guest_id: guest.id,
    //       endpoint: body.endpoint,
    //       p256dh_key: body.keys.p256dh,
    //       auth_key: body.keys.auth,
    //       updated_at: new Date().toISOString(),
    //     },
    //     { onConflict: 'endpoint' }
    //   );

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
