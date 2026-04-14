import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Guest, ApiResponse } from '@/types';

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
    // const { data: guest, error } = await supabase
    //   .from('guests')
    //   .select('*')
    //   .eq('auth_user_id', user.id)
    //   .single();

    const mockGuest: Guest = {
      id: 'guest-001',
      auth_user_id: user.id,
      newbook_guest_id: null,
      email: user.email ?? '',
      first_name: 'Jane',
      last_name: 'Doe',
      phone: '(555) 123-4567',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'TX',
        zip: '75001',
        country: 'US',
      },
      preferences: {
        kids_count: 2,
        kids_ages: [5, 8],
        pets: [{ type: 'dog', breed: 'Golden Retriever', name: 'Buddy' }],
        site_preferences: 'Pull-through, shaded',
        special_needs: '',
      },
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-03-20T14:30:00Z',
    };

    return NextResponse.json<ApiResponse<Guest>>(
      { data: mockGuest, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/guest/profile error:', error);
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

    // Validate that the request body contains at least one updatable field
    const allowedFields = [
      'first_name', 'last_name', 'phone', 'address', 'preferences',
    ];
    const updateKeys = Object.keys(body);
    const hasValidField = updateKeys.some((key) => allowedFields.includes(key));

    if (!hasValidField) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // TODO: Replace with real Supabase query
    // const { data: guest, error } = await supabase
    //   .from('guests')
    //   .update({
    //     ...body,
    //     updated_at: new Date().toISOString(),
    //   })
    //   .eq('auth_user_id', user.id)
    //   .select()
    //   .single();

    const updatedGuest: Guest = {
      id: 'guest-001',
      auth_user_id: user.id,
      newbook_guest_id: null,
      email: user.email ?? '',
      first_name: body.first_name ?? 'Jane',
      last_name: body.last_name ?? 'Doe',
      phone: body.phone ?? '(555) 123-4567',
      address: body.address ?? {
        street: '123 Main St',
        city: 'Anytown',
        state: 'TX',
        zip: '75001',
        country: 'US',
      },
      preferences: body.preferences ?? {
        kids_count: 2,
        kids_ages: [5, 8],
        pets: [],
        site_preferences: 'Pull-through, shaded',
        special_needs: '',
      },
      created_at: '2025-01-15T10:00:00Z',
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse<Guest>>(
      { data: updatedGuest, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/guest/profile error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
