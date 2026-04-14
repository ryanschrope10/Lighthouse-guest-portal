import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Notification, ApiResponse } from '@/types';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Replace with real Supabase query
    // const { data: guest } = await supabase
    //   .from('guests')
    //   .select('id')
    //   .eq('auth_user_id', user.id)
    //   .single();
    //
    // Notifications can target all_guests, specific_guest, or booking_group
    // const { data: notifications, error } = await supabase
    //   .from('notifications')
    //   .select('*')
    //   .or(`target_type.eq.all_guests,and(target_type.eq.specific_guest,target_id.eq.${guest.id})`)
    //   .order('created_at', { ascending: false })
    //   .limit(50);
    //
    // // Join with notification_reads to determine read status
    // const { data: reads } = await supabase
    //   .from('notification_reads')
    //   .select('notification_id')
    //   .eq('guest_id', guest.id);
    // const readIds = new Set(reads?.map(r => r.notification_id));
    // notifications?.forEach(n => { n.read = readIds.has(n.id); });

    const mockNotifications: Notification[] = [
      {
        id: 'notif-001',
        property_id: 'property-001',
        target_type: 'specific_guest',
        target_id: 'guest-001',
        title: 'Payment Received',
        body: 'Your payment of $500.00 for Invoice #5001 has been received. Thank you!',
        channel: 'both',
        sent_at: '2025-05-28T14:35:00Z',
        created_by: null,
        read: true,
      },
      {
        id: 'notif-002',
        property_id: 'property-001',
        target_type: 'all_guests',
        target_id: null,
        title: 'Pool Maintenance Notice',
        body: 'The main pool will be closed for maintenance on June 5th from 8am to 12pm. The splash pad will remain open.',
        channel: 'push',
        sent_at: '2025-06-03T09:00:00Z',
        created_by: 'admin-001',
        read: false,
      },
      {
        id: 'notif-003',
        property_id: 'property-001',
        target_type: 'specific_guest',
        target_id: 'guest-001',
        title: 'Invoice Due Soon',
        body: 'Invoice #5002 for $250.00 is due on June 15th. Tap to view and pay.',
        channel: 'both',
        sent_at: '2025-06-10T08:00:00Z',
        created_by: null,
        read: false,
      },
      {
        id: 'notif-004',
        property_id: 'property-001',
        target_type: 'all_guests',
        target_id: null,
        title: 'Food Truck Friday',
        body: 'This Friday: Smokey BBQ & Taco Loco from 5-9pm at the main pavilion!',
        channel: 'push',
        sent_at: '2025-06-11T10:00:00Z',
        created_by: 'admin-001',
        read: false,
      },
    ];

    return NextResponse.json<ApiResponse<Notification[]>>(
      { data: mockNotifications, error: null },
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.notification_ids || !Array.isArray(body.notification_ids) || body.notification_ids.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'notification_ids array is required' },
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
    // // Upsert read records (so marking as read is idempotent)
    // const readRecords = body.notification_ids.map((notifId: string) => ({
    //   notification_id: notifId,
    //   guest_id: guest.id,
    //   read_at: new Date().toISOString(),
    // }));
    //
    // const { error } = await supabase
    //   .from('notification_reads')
    //   .upsert(readRecords, { onConflict: 'notification_id,guest_id' });

    return NextResponse.json<ApiResponse<{ marked_read: string[] }>>(
      { data: { marked_read: body.notification_ids }, error: null },
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
