import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PaymentMethod, ApiResponse } from '@/types';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Replace with real Supabase query
    // const { data: guest } = await supabase
    //   .from('guests')
    //   .select('id')
    //   .eq('auth_user_id', user.id)
    //   .single();
    //
    // const { data: methods, error } = await supabase
    //   .from('payment_methods')
    //   .select('*')
    //   .eq('guest_id', guest.id)
    //   .order('is_preferred', { ascending: false });

    const mockMethods: PaymentMethod[] = [
      {
        id: 'pm-001',
        guest_id: 'guest-001',
        type: 'credit_card',
        last_four: '4242',
        brand: 'Visa',
        is_preferred: true,
        auto_pay_enabled: true,
        newbook_payment_token: null,
        created_at: '2025-01-20T10:00:00Z',
      },
      {
        id: 'pm-002',
        guest_id: 'guest-001',
        type: 'credit_card',
        last_four: '1234',
        brand: 'Mastercard',
        is_preferred: false,
        auto_pay_enabled: false,
        newbook_payment_token: null,
        created_at: '2025-03-10T10:00:00Z',
      },
      {
        id: 'pm-003',
        guest_id: 'guest-001',
        type: 'ach',
        last_four: '6789',
        brand: null,
        is_preferred: false,
        auto_pay_enabled: false,
        newbook_payment_token: null,
        created_at: '2025-04-01T10:00:00Z',
      },
    ];

    return NextResponse.json<ApiResponse<PaymentMethod[]>>(
      { data: mockMethods, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/payments/methods error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.type || !['credit_card', 'ach'].includes(body.type)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'type must be "credit_card" or "ach"' },
        { status: 400 }
      );
    }

    if (!body.last_four || body.last_four.length !== 4) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'last_four must be exactly 4 characters' },
        { status: 400 }
      );
    }

    // TODO: Replace with real logic
    // 1. Tokenize payment details via payment gateway
    // 2. Store token in NewBook if applicable
    // 3. Insert payment method record
    // const { data: guest } = await supabase
    //   .from('guests')
    //   .select('id')
    //   .eq('auth_user_id', user.id)
    //   .single();
    //
    // const { data: method, error } = await supabase
    //   .from('payment_methods')
    //   .insert({
    //     guest_id: guest.id,
    //     type: body.type,
    //     last_four: body.last_four,
    //     brand: body.brand,
    //     is_preferred: body.is_preferred ?? false,
    //     auto_pay_enabled: body.auto_pay_enabled ?? false,
    //     newbook_payment_token: null,
    //   })
    //   .select()
    //   .single();

    const newMethod: PaymentMethod = {
      id: `pm-${Date.now()}`,
      guest_id: 'guest-001',
      type: body.type,
      last_four: body.last_four,
      brand: body.brand ?? null,
      is_preferred: body.is_preferred ?? false,
      auto_pay_enabled: body.auto_pay_enabled ?? false,
      newbook_payment_token: null,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse<PaymentMethod>>(
      { data: newMethod, error: null },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/payments/methods error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
