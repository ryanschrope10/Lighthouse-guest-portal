import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Invoice, ApiResponse } from '@/types';

export async function GET(
  _request: Request,
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

    // TODO: Replace with real Supabase query
    // const { data: guest } = await supabase
    //   .from('guests')
    //   .select('id')
    //   .eq('auth_user_id', user.id)
    //   .single();
    //
    // const { data: invoice, error } = await supabase
    //   .from('invoices')
    //   .select('*, booking:bookings(id, site_or_room, check_in, check_out, status)')
    //   .eq('id', id)
    //   .eq('guest_id', guest.id)
    //   .single();

    const mockInvoice: Invoice = {
      id,
      booking_id: 'booking-001',
      property_id: 'property-001',
      guest_id: 'guest-001',
      newbook_invoice_id: 'NB-INV-5001',
      amount: 500.0,
      status: 'paid',
      due_date: '2025-06-01T00:00:00Z',
      paid_at: '2025-05-28T14:30:00Z',
      description: 'Site rental - first week',
      line_items: [
        { description: 'Site A-12 nightly rate', quantity: 7, unit_price: 50.0, total: 350.0 },
        { description: 'Full hookup fee', quantity: 7, unit_price: 15.0, total: 105.0 },
        { description: 'Resort fee', quantity: 1, unit_price: 45.0, total: 45.0 },
      ],
      synced_at: '2025-06-01T10:00:00Z',
      booking: {
        id: 'booking-001',
        property_id: 'property-001',
        guest_id: 'guest-001',
        newbook_booking_id: 'NB-10001',
        status: 'checked_in',
        check_in: '2025-06-01T15:00:00Z',
        check_out: '2025-06-15T11:00:00Z',
        site_or_room: 'Site A-12',
        booking_type: 'rv',
        group_booking_id: null,
        total_amount: 750.0,
        balance_due: 250.0,
        details: {},
        synced_at: '2025-06-01T10:00:00Z',
        created_at: '2025-05-15T10:00:00Z',
      },
    };

    return NextResponse.json<ApiResponse<Invoice>>(
      { data: mockInvoice, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/invoices/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
