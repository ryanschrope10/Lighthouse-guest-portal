import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';

interface ProcessPaymentRequest {
  invoice_ids: string[];
  payment_method_id: string;
  amount: number;
}

interface ProcessPaymentResponse {
  transaction_id: string;
  invoice_ids: string[];
  amount: number;
  status: 'success' | 'pending' | 'failed';
  message: string;
  processed_at: string;
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

    const body: ProcessPaymentRequest = await request.json();

    // Validate required fields
    if (!body.invoice_ids || !Array.isArray(body.invoice_ids) || body.invoice_ids.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'At least one invoice_id is required' },
        { status: 400 }
      );
    }

    if (!body.payment_method_id) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'payment_method_id is required' },
        { status: 400 }
      );
    }

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'A positive amount is required' },
        { status: 400 }
      );
    }

    // TODO: Replace with real logic
    // 1. Verify guest owns the invoices and payment method
    // 2. Verify invoices are payable (not already paid)
    // 3. Verify amount matches sum of invoices (or allow partial)
    // 4. Call NewBook payment API or payment gateway
    // 5. Update invoice statuses to 'paid'
    // 6. Record transaction

    const mockResponse: ProcessPaymentResponse = {
      transaction_id: `txn-${Date.now()}`,
      invoice_ids: body.invoice_ids,
      amount: body.amount,
      status: 'success',
      message: `Payment of $${body.amount.toFixed(2)} processed successfully.`,
      processed_at: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse<ProcessPaymentResponse>>(
      { data: mockResponse, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/payments error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
