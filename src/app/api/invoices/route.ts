import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Invoice, InvoiceStatus, ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status') as InvoiceStatus | null;
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search');

    // TODO: Replace with real Supabase query
    // const { data: guest } = await supabase
    //   .from('guests')
    //   .select('id')
    //   .eq('auth_user_id', user.id)
    //   .single();
    //
    // let query = supabase
    //   .from('invoices')
    //   .select('*, booking:bookings(id, site_or_room, check_in, check_out)')
    //   .eq('guest_id', guest.id)
    //   .order('due_date', { ascending: false });
    //
    // if (status) query = query.eq('status', status);
    // if (dateFrom) query = query.gte('due_date', dateFrom);
    // if (dateTo) query = query.lte('due_date', dateTo);
    // if (search) query = query.ilike('description', `%${search}%`);
    //
    // const { data: invoices, error } = await query;

    const allInvoices: Invoice[] = [
      {
        id: 'invoice-001',
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
      },
      {
        id: 'invoice-002',
        booking_id: 'booking-001',
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
      {
        id: 'invoice-003',
        booking_id: 'booking-002',
        property_id: 'property-001',
        guest_id: 'guest-001',
        newbook_invoice_id: 'NB-INV-5003',
        amount: 500.0,
        status: 'pending',
        due_date: '2025-08-01T00:00:00Z',
        paid_at: null,
        description: 'Deposit - August reservation',
        line_items: [
          { description: 'Reservation deposit', quantity: 1, unit_price: 500.0, total: 500.0 },
        ],
        synced_at: '2025-06-01T10:00:00Z',
      },
      {
        id: 'invoice-004',
        booking_id: 'booking-003',
        property_id: 'property-001',
        guest_id: 'guest-001',
        newbook_invoice_id: 'NB-INV-5004',
        amount: 420.0,
        status: 'paid',
        due_date: '2025-03-01T00:00:00Z',
        paid_at: '2025-02-28T10:00:00Z',
        description: 'Cabin 3 - full stay',
        line_items: [
          { description: 'Cabin 3 nightly rate', quantity: 6, unit_price: 70.0, total: 420.0 },
        ],
        synced_at: '2025-03-08T10:00:00Z',
      },
    ];

    let filtered = allInvoices;

    if (status) {
      filtered = filtered.filter((inv) => inv.status === status);
    }
    if (dateFrom) {
      filtered = filtered.filter((inv) => inv.due_date && inv.due_date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((inv) => inv.due_date && inv.due_date <= dateTo);
    }
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (inv) => inv.description?.toLowerCase().includes(lowerSearch)
      );
    }

    return NextResponse.json<ApiResponse<Invoice[]>>(
      { data: filtered, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/invoices error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
