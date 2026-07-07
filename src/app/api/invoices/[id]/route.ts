import { NextResponse } from 'next/server';
import { getBookings, NoLinkedGuestError } from '@/lib/newbook/data';
import type { Invoice, ApiResponse } from '@/types';

// Invoices aren't a first-class Newbook object — they're derived per booking
// (see /api/invoices). Here we find the single derived invoice matching [id]
// among the signed-in guest's bookings; 404 if it isn't theirs.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const bookings = await getBookings();

    let found: Invoice | null = null;
    for (const b of bookings) {
      const inv = (b.invoices ?? []).find((i) => i.id === id);
      if (inv) {
        const { invoices: _nested, ...bookingSummary } = b;
        found = { ...inv, booking: bookingSummary };
        break;
      }
    }

    if (!found) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Invoice>>(
      { data: found, error: null },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof NoLinkedGuestError) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('GET /api/invoices/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'We couldn’t load this invoice.' },
      { status: 502 }
    );
  }
}
