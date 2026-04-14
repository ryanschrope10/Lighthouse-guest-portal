import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { AddonRequest, ApiResponse } from '@/types';

interface AddAddonRequest {
  addon_type: string;
  details?: Record<string, unknown>;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: bookingId } = await params;
    const body: AddAddonRequest = await request.json();

    if (!body.addon_type) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'addon_type is required' },
        { status: 400 }
      );
    }

    // TODO: Replace with real Supabase query
    // 1. Verify booking ownership
    // const { data: guest } = await supabase
    //   .from('guests')
    //   .select('id')
    //   .eq('auth_user_id', user.id)
    //   .single();
    //
    // const { data: booking } = await supabase
    //   .from('bookings')
    //   .select('id, property_id')
    //   .eq('id', bookingId)
    //   .eq('guest_id', guest.id)
    //   .single();
    //
    // 2. Insert addon request
    // const { data: addon, error } = await supabase
    //   .from('addon_requests')
    //   .insert({
    //     booking_id: bookingId,
    //     guest_id: guest.id,
    //     property_id: booking.property_id,
    //     addon_type: body.addon_type,
    //     status: 'requested',
    //     details: body.details ?? {},
    //   })
    //   .select()
    //   .single();

    const mockAddon: AddonRequest = {
      id: `addon-${Date.now()}`,
      booking_id: bookingId,
      guest_id: 'guest-001',
      property_id: 'property-001',
      addon_type: body.addon_type,
      status: 'requested',
      details: body.details ?? {},
      requested_at: new Date().toISOString(),
      resolved_at: null,
    };

    return NextResponse.json<ApiResponse<AddonRequest>>(
      { data: mockAddon, error: null },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/bookings/[id]/addons error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
