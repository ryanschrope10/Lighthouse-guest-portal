import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Vehicle, ApiResponse } from '@/types';

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
    // const { data: vehicles, error } = await supabase
    //   .from('vehicles')
    //   .select('*')
    //   .eq('guest_id', guest.id)
    //   .order('created_at', { ascending: false });

    const mockVehicles: Vehicle[] = [
      {
        id: 'vehicle-001',
        guest_id: 'guest-001',
        property_id: 'property-001',
        type: 'rv',
        make: 'Winnebago',
        model: 'View 24D',
        year: 2022,
        license_plate: 'TX-RV-1234',
        length_ft: 25,
        details: { slides: 1, hookups: ['30amp', 'water', 'sewer'] },
        created_at: '2025-02-01T10:00:00Z',
      },
      {
        id: 'vehicle-002',
        guest_id: 'guest-001',
        property_id: 'property-001',
        type: 'vehicle',
        make: 'Ford',
        model: 'F-150',
        year: 2021,
        license_plate: 'TX-ABC-5678',
        length_ft: null,
        details: {},
        created_at: '2025-02-01T10:05:00Z',
      },
    ];

    return NextResponse.json<ApiResponse<Vehicle[]>>(
      { data: mockVehicles, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/guest/vehicles error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
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

    const body = await request.json();

    // Validate required fields
    if (!body.type) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Vehicle type is required' },
        { status: 400 }
      );
    }

    const validTypes = ['rv', 'trailer', 'motorhome', 'vehicle', 'other'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: `Invalid vehicle type. Must be one of: ${validTypes.join(', ')}` },
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
    // const { data: vehicle, error } = await supabase
    //   .from('vehicles')
    //   .insert({
    //     guest_id: guest.id,
    //     property_id: body.property_id,
    //     type: body.type,
    //     make: body.make,
    //     model: body.model,
    //     year: body.year,
    //     license_plate: body.license_plate,
    //     length_ft: body.length_ft,
    //     details: body.details ?? {},
    //   })
    //   .select()
    //   .single();

    const newVehicle: Vehicle = {
      id: `vehicle-${Date.now()}`,
      guest_id: 'guest-001',
      property_id: body.property_id ?? 'property-001',
      type: body.type,
      make: body.make ?? null,
      model: body.model ?? null,
      year: body.year ?? null,
      license_plate: body.license_plate ?? null,
      length_ft: body.length_ft ?? null,
      details: body.details ?? {},
      created_at: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse<Vehicle>>(
      { data: newVehicle, error: null },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/guest/vehicles error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
