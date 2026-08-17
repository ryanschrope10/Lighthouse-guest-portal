import { NextResponse } from 'next/server';
import { getBookings, NoLinkedGuestError } from '@/lib/newbook/data';
import { createNewBookClient } from '@/lib/newbook/client';
import type { NewBookInvoice } from '@/lib/newbook/types';
import type { ApiResponse } from '@/types';

// GET /api/invoices/[id]/pdf
//
// Streams Newbook's official invoice PDF for one of the SIGNED-IN GUEST'S OWN
// invoices. Newbook's view_link embeds the instance api_key in a decodable JWT
// payload, so the link is resolved and fetched here and only the PDF bytes go
// to the browser. `id` is the Newbook invoice id.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Ownership: the id must belong to one of this guest's own invoices.
    const bookings = await getBookings();
    const owned = bookings
      .flatMap((b) => b.invoices ?? [])
      .some((inv) => inv.newbook_invoice_id === id);
    if (!owned) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // The links are short-lived, so fetch a fresh one rather than reusing
    // whatever was cached with the list.
    const client = createNewBookClient();
    const invoice = await client.request<NewBookInvoice | NewBookInvoice[]>(
      'invoices_get',
      { id: Number(id) }
    );
    const record = Array.isArray(invoice) ? invoice[0] : invoice;
    const link = record?.view_link || record?.download_link;
    if (!link) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'No PDF available for this invoice' },
        { status: 404 }
      );
    }

    const pdf = await fetch(link, { cache: 'no-store' });
    if (!pdf.ok) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Could not retrieve the invoice PDF' },
        { status: 502 }
      );
    }

    return new NextResponse(pdf.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${id}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    if (error instanceof NoLinkedGuestError) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Please sign in.' },
        { status: 401 }
      );
    }
    console.error('GET /api/invoices/[id]/pdf error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
