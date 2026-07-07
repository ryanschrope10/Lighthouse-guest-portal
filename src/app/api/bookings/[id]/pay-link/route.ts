import { NextResponse } from 'next/server';
import { getBookingById, NoLinkedGuestError } from '@/lib/newbook/data';
import { sendContactTemplate } from '@/lib/newbook/templates';
import { getPayTemplateId } from '@/lib/newbook/config';
import { guestFacingError } from '@/lib/api-error';
import type { ApiResponse } from '@/types';

// POST /api/bookings/[id]/pay-link
// Sends the signed-in guest a "Pay Your Booking Online" email (via Newbook's
// contact-template) for THEIR OWN booking. getBookingById is scoped to the
// session guest, so a guest can only request a link for their own booking.
export async function POST(
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

    const templateId = getPayTemplateId();
    if (!templateId) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error:
            "Online payment isn't enabled yet. Please contact the front desk to pay.",
        },
        { status: 503 }
      );
    }

    await sendContactTemplate({
      templateId,
      dataId: booking.newbook_booking_id,
      dataType: 'bookings',
      sendVia: 'html_email',
    });

    return NextResponse.json<ApiResponse<{ sent: true }>>(
      { data: { sent: true }, error: null },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof NoLinkedGuestError) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Please sign in to pay.' },
        { status: 401 }
      );
    }
    console.error('POST /api/bookings/[id]/pay-link error:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: guestFacingError(error, 'We couldn’t send your payment link.'),
      },
      { status: 502 }
    );
  }
}
