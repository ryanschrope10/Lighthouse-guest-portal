import { NextRequest, NextResponse } from 'next/server';
import { getBookings } from '@/lib/newbook/data';
import { guestFacingError } from '@/lib/api-error';
import type { Booking, BookingStatus, ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get(
      'status'
    ) as BookingStatus | null;

    const all = await getBookings();
    const data = status ? all.filter((b) => b.status === status) : all;

    return NextResponse.json<ApiResponse<Booking[]>>(
      { data, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/bookings error:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: guestFacingError(error, 'We couldn’t load your bookings.'),
      },
      { status: 502 }
    );
  }
}
