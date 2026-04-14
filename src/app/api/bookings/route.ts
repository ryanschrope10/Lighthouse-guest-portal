import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Booking, BookingStatus, ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status') as BookingStatus | null;

    // TODO: Replace with real Supabase query
    // const { data: guest } = await supabase
    //   .from('guests')
    //   .select('id')
    //   .eq('auth_user_id', user.id)
    //   .single();
    //
    // let query = supabase
    //   .from('bookings')
    //   .select('*, property:properties(*)')
    //   .eq('guest_id', guest.id)
    //   .order('check_in', { ascending: false });
    //
    // if (status) {
    //   query = query.eq('status', status);
    // }
    //
    // const { data: bookings, error } = await query;

    const allBookings: Booking[] = [
      {
        id: 'booking-001',
        property_id: 'property-001',
        guest_id: 'guest-001',
        newbook_booking_id: 'NB-10001',
        status: 'checked_in',
        check_in: '2025-06-01T15:00:00Z',
        check_out: '2025-06-15T11:00:00Z',
        site_or_room: 'Site A-12',
        booking_type: 'rv',
        group_booking_id: null,
        total_amount: 750.0,
        balance_due: 250.0,
        details: { hookups: '50amp full' },
        synced_at: '2025-06-01T10:00:00Z',
        created_at: '2025-05-15T10:00:00Z',
      },
      {
        id: 'booking-002',
        property_id: 'property-001',
        guest_id: 'guest-001',
        newbook_booking_id: 'NB-10002',
        status: 'upcoming',
        check_in: '2025-08-01T15:00:00Z',
        check_out: '2025-08-10T11:00:00Z',
        site_or_room: 'Site B-5',
        booking_type: 'rv',
        group_booking_id: null,
        total_amount: 500.0,
        balance_due: 500.0,
        details: { hookups: '30amp full' },
        synced_at: '2025-06-01T10:00:00Z',
        created_at: '2025-05-20T10:00:00Z',
      },
      {
        id: 'booking-003',
        property_id: 'property-001',
        guest_id: 'guest-001',
        newbook_booking_id: 'NB-10003',
        status: 'checked_out',
        check_in: '2025-03-01T15:00:00Z',
        check_out: '2025-03-07T11:00:00Z',
        site_or_room: 'Cabin 3',
        booking_type: 'cabin',
        group_booking_id: null,
        total_amount: 420.0,
        balance_due: 0,
        details: {},
        synced_at: '2025-03-08T10:00:00Z',
        created_at: '2025-02-10T10:00:00Z',
      },
    ];

    const filteredBookings = status
      ? allBookings.filter((b) => b.status === status)
      : allBookings;

    return NextResponse.json<ApiResponse<Booking[]>>(
      { data: filteredBookings, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/bookings error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
