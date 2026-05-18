import { NextResponse } from 'next/server';
import { getBookingById } from '@/lib/newbook/data';
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
    console.error('GET /api/bookings/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error:
          error instanceof Error ? error.message : 'Failed to load booking',
      },
      { status: 502 }
    );
  }
}
