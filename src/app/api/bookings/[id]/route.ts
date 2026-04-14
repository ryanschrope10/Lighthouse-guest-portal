import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Booking, Invoice, ApiResponse } from '@/types';

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
    // const { data: booking, error } = await supabase
    //   .from('bookings')
    //   .select('*, property:properties(*), invoices(*)')
    //   .eq('id', id)
    //   .eq('guest_id', guest.id)
    //   .single();

    const mockInvoices: Invoice[] = [
      {
        id: 'invoice-001',
        booking_id: id,
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
      },
      {
        id: 'invoice-002',
        booking_id: id,
        property_id: 'property-001',
        guest_id: 'guest-001',
        newbook_invoice_id: 'NB-INV-5002',
        amount: 250.0,
        status: 'pending',
        due_date: '2025-06-15T00:00:00Z',
        paid_at: null,
        description: 'Site rental - second week',
        line_items: [
          { description: 'Site A-12 nightly rate', quantity: 7, unit_price: 50.0, total: 350.0 },
          { description: 'Discount - returning guest', quantity: 1, unit_price: -100.0, total: -100.0 },
        ],
        synced_at: '2025-06-01T10:00:00Z',
      },
    ];

    const mockBooking: Booking = {
      id,
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
      details: { hookups: '50amp full' },
      synced_at: '2025-06-01T10:00:00Z',
      created_at: '2025-05-15T10:00:00Z',
      invoices: mockInvoices,
    };

    return NextResponse.json<ApiResponse<Booking>>(
      { data: mockBooking, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/bookings/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
