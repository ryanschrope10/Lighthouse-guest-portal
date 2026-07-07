import { NextRequest, NextResponse } from 'next/server';
import { getBookings, NoLinkedGuestError } from '@/lib/newbook/data';
import type { Invoice, InvoiceStatus, ApiResponse } from '@/types';

// Invoices aren't a first-class Newbook object — they're derived per
// booking (tariffs + fees + discounts folded into one invoice). We
// aggregate the signed-in guest's bookings into a flat invoice list,
// each carrying its booking (sans nested invoices) for display/search.

export async function GET(request: NextRequest) {
  try {
    const bookings = await getBookings();

    const all: Invoice[] = bookings.flatMap((b) => {
      const { invoices: _nested, ...bookingSummary } = b;
      return (b.invoices ?? []).map((inv) => ({
        ...inv,
        booking: bookingSummary,
      }));
    });

    // Optional filters (kept compatible with the previous route).
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status') as InvoiceStatus | null;
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search');

    let filtered = all;
    if (status) filtered = filtered.filter((inv) => inv.status === status);
    if (dateFrom) filtered = filtered.filter((inv) => inv.due_date && inv.due_date >= dateFrom);
    if (dateTo) filtered = filtered.filter((inv) => inv.due_date && inv.due_date <= dateTo);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((inv) => inv.description?.toLowerCase().includes(q));
    }

    return NextResponse.json<ApiResponse<Invoice[]>>(
      { data: filtered, error: null },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof NoLinkedGuestError) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('GET /api/invoices error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'We couldn’t load your invoices.' },
      { status: 502 }
    );
  }
}
