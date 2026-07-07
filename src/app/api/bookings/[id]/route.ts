import { NextResponse } from 'next/server';
import { getBookingById, NoLinkedGuestError } from '@/lib/newbook/data';
import { guestFacingError } from '@/lib/api-error';
import type { Booking, ApiResponse } from '@/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = await getBookingById(id);

    if (!booking) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Booking>>(
      { data: booking, error: null },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof NoLinkedGuestError) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Please sign in to view this booking.' },
        { status: 401 }
      );
    }
    console.error('GET /api/bookings/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: guestFacingError(error, 'We couldn’t load this booking.'),
      },
      { status: 502 }
    );
  }
}
