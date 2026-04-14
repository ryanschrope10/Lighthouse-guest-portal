import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PaymentMethod, ApiResponse } from '@/types';

export async function PUT(
  request: Request,
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
    const body = await request.json();

    // Only allow updating is_preferred and auto_pay_enabled
    const allowedFields = ['is_preferred', 'auto_pay_enabled'];
    const updateKeys = Object.keys(body);
    const hasValidField = updateKeys.some((key) => allowedFields.includes(key));

    if (!hasValidField) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'No valid fields to update. Allowed: is_preferred, auto_pay_enabled' },
        { status: 400 }
      );
    }

    // TODO: Replace with real Supabase query
    // const { data: guest } = await supabase
    //   .from('guests')
    //   .select('id')
    //   .eq('auth_user_id', user.id)
    //   .single();
    //
    // If setting is_preferred to true, unset all others first
    // if (body.is_preferred === true) {
    //   await supabase
    //     .from('payment_methods')
    //     .update({ is_preferred: false })
    //     .eq('guest_id', guest.id);
    // }
    //
    // const { data: method, error } = await supabase
    //   .from('payment_methods')
    //   .update({
    //     ...(body.is_preferred !== undefined && { is_preferred: body.is_preferred }),
    //     ...(body.auto_pay_enabled !== undefined && { auto_pay_enabled: body.auto_pay_enabled }),
    //   })
    //   .eq('id', id)
    //   .eq('guest_id', guest.id)
    //   .select()
    //   .single();

    const updatedMethod: PaymentMethod = {
      id,
      guest_id: 'guest-001',
      type: 'credit_card',
      last_four: '4242',
      brand: 'Visa',
      is_preferred: body.is_preferred ?? true,
      auto_pay_enabled: body.auto_pay_enabled ?? true,
      newbook_payment_token: null,
      created_at: '2025-01-20T10:00:00Z',
    };

    return NextResponse.json<ApiResponse<PaymentMethod>>(
      { data: updatedMethod, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/payments/methods/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    // // Prevent deleting the preferred method if it's the only one
    // const { data: method } = await supabase
    //   .from('payment_methods')
    //   .select('is_preferred')
    //   .eq('id', id)
    //   .eq('guest_id', guest.id)
    //   .single();
    //
    // const { error } = await supabase
    //   .from('payment_methods')
    //   .delete()
    //   .eq('id', id)
    //   .eq('guest_id', guest.id);

    return NextResponse.json<ApiResponse<{ deleted: string }>>(
      { data: { deleted: id }, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/payments/methods/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
