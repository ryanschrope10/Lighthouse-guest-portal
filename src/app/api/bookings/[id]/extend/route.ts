import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';

interface ExtendStayRequest {
  new_check_out: string;
}

interface ExtendStayResponse {
  booking_id: string;
  original_check_out: string;
  new_check_out: string;
  additional_amount: number;
  status: 'pending_confirmation' | 'confirmed';
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

    const { id } = await params;
    const body: ExtendStayRequest = await request.json();

    if (!body.new_check_out) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'new_check_out date is required' },
        { status: 400 }
      );
    }

    const newCheckOut = new Date(body.new_check_out);
    if (isNaN(newCheckOut.getTime())) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid date format for new_check_out' },
        { status: 400 }
      );
    }

    // TODO: Replace with real logic
    // 1. Fetch booking to verify ownership and current check_out
    // 2. Validate new_check_out is after current check_out
    // 3. Check availability via NewBook API
    // 4. Call NewBook API to extend booking
    // 5. Update local booking record
    // 6. Create new invoice for additional nights

    const mockResponse: ExtendStayResponse = {
      booking_id: id,
      original_check_out: '2025-06-15T11:00:00Z',
      new_check_out: body.new_check_out,
      additional_amount: 150.0,
      status: 'pending_confirmation',
    };

    return NextResponse.json<ApiResponse<ExtendStayResponse>>(
      { data: mockResponse, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/bookings/[id]/extend error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
