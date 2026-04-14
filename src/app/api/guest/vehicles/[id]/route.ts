import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Vehicle, ApiResponse } from '@/types';

export async function PUT(
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

    const { id } = await params;
    const body = await request.json();

    if (body.type) {
      const validTypes = ['rv', 'trailer', 'motorhome', 'vehicle', 'other'];
      if (!validTypes.includes(body.type)) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, error: `Invalid vehicle type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // TODO: Replace with real Supabase query
    // const { data: guest } = await supabase
    //   .from('guests')
    //   .select('id')
    //   .eq('auth_user_id', user.id)
    //   .single();
    //
    // const { data: vehicle, error } = await supabase
    //   .from('vehicles')
    //   .update({ ...body })
    //   .eq('id', id)
    //   .eq('guest_id', guest.id)  // Ensure ownership
    //   .select()
    //   .single();

    const updatedVehicle: Vehicle = {
      id,
      guest_id: 'guest-001',
      property_id: body.property_id ?? 'property-001',
      type: body.type ?? 'rv',
      make: body.make ?? 'Winnebago',
      model: body.model ?? 'View 24D',
      year: body.year ?? 2022,
      license_plate: body.license_plate ?? 'TX-RV-1234',
      length_ft: body.length_ft ?? 25,
      details: body.details ?? {},
      created_at: '2025-02-01T10:00:00Z',
    };

    return NextResponse.json<ApiResponse<Vehicle>>(
      { data: updatedVehicle, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/guest/vehicles/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
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

    const { id } = await params;

    // TODO: Replace with real Supabase query
    // const { data: guest } = await supabase
    //   .from('guests')
    //   .select('id')
    //   .eq('auth_user_id', user.id)
    //   .single();
    //
    // const { error } = await supabase
    //   .from('vehicles')
    //   .delete()
    //   .eq('id', id)
    //   .eq('guest_id', guest.id);  // Ensure ownership

    return NextResponse.json<ApiResponse<{ deleted: string }>>(
      { data: { deleted: id }, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/guest/vehicles/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
