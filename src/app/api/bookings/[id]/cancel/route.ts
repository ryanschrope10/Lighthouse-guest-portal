import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';

interface CancelBookingRequest {
  reason?: string;
}

interface CancelBookingResponse {
  booking_id: string;
  status: 'cancelled';
  refund_eligible: boolean;
  refund_amount: number | null;
  cancellation_fee: number | null;
  message: string;
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
    const body: CancelBookingRequest = await request.json().catch(() => ({}));

    // TODO: Replace with real logic
    // 1. Fetch booking to verify ownership and status
    // 2. Check cancellation policy (cutoff_days from property)
    // 3. Call NewBook API to cancel booking
    // 4. Calculate refund based on policy
    // 5. Update local booking status to 'cancelled'
    // 6. Create refund invoice if applicable

    const mockResponse: CancelBookingResponse = {
      booking_id: id,
      status: 'cancelled',
      refund_eligible: true,
      refund_amount: 375.0,
      cancellation_fee: 50.0,
      message: body.reason
        ? `Booking cancelled. Reason: ${body.reason}. Refund of $375.00 will be processed within 5-7 business days.`
        : 'Booking cancelled. Refund of $375.00 will be processed within 5-7 business days.',
    };

    return NextResponse.json<ApiResponse<CancelBookingResponse>>(
      { data: mockResponse, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/bookings/[id]/cancel error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
