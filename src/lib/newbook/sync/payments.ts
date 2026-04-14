// ============================================================
// Payment Operations — NewBook API
// ============================================================
//
// Functions for processing payments, managing stored payment
// methods, and configuring auto-pay through the NewBook PMS.
//
// All payment processing goes through NewBook's payment gateway
// integration. We never handle raw card numbers — only tokenized
// payment methods.
// ============================================================

import type { PaymentMethod } from '@/types/index';
import type { NewBookPayment, NewBookStoredPaymentMethod } from '../types';
import { createNewBookClient } from '../client';

/** Result of a payment processing attempt. */
export interface PaymentResult {
  success: boolean;
  transactionId: string | null;
  errorMessage: string | null;
  newBookPaymentId: number | null;
}

/** Tokenized payment method data received from the client-side tokenizer. */
export interface TokenizedPaymentMethod {
  /** Token from the payment processor (e.g., Stripe token, NewBook token) */
  token: string;
  /** Card or account type */
  type: 'credit_card' | 'ach';
  /** Last four digits for display */
  lastFour: string;
  /** Card brand (Visa, Mastercard, etc.) or null for ACH */
  brand: string | null;
}

/**
 * Process a payment for an invoice through the NewBook API.
 *
 * This sends a payment request to NewBook using a previously stored
 * (tokenized) payment method. NewBook handles the actual charge
 * through its integrated payment gateway.
 *
 * @param invoiceId - The portal invoice ID to pay
 * @param paymentMethodId - The portal payment method ID to charge
 * @param amount - The amount to pay (in dollars, not cents)
 * @returns Result of the payment attempt
 */
export async function processPayment(
  invoiceId: string,
  paymentMethodId: string,
  amount: number
): Promise<PaymentResult> {
  // TODO: Look up the invoice and payment method from our database
  //
  // Example:
  //   const supabase = await createClient();
  //   const [{ data: invoice }, { data: paymentMethod }] = await Promise.all([
  //     supabase.from('invoices').select('*').eq('id', invoiceId).single(),
  //     supabase.from('payment_methods').select('*').eq('id', paymentMethodId).single(),
  //   ]);
  //
  //   if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);
  //   if (!paymentMethod) throw new Error(`Payment method ${paymentMethodId} not found`);
  //   if (!paymentMethod.newbook_payment_token) {
  //     throw new Error('Payment method has no NewBook token');
  //   }

  const newbookInvoiceId = '';    // TODO: From DB lookup (invoice.newbook_invoice_id)
  const newbookPaymentToken = ''; // TODO: From DB lookup (paymentMethod.newbook_payment_token)
  const propertyId = '';          // TODO: From DB lookup (invoice.property_id)

  const client = await createNewBookClient(propertyId);

  try {
    // TODO: Confirm the actual NewBook endpoint for processing payments
    // NewBook might use /payments, /invoices/:id/payments, or a dedicated
    // payment processing endpoint
    const response = await client.post<NewBookPayment>('/payments', {
      invoice_id: Number(newbookInvoiceId),
      token: newbookPaymentToken,
      amount: amount,
      // TODO: Additional fields NewBook may require:
      // payment_type: 'credit_card',
      // reference: `portal_${invoiceId}`,
    });

    const nbPayment = response.data;

    // TODO: Record the payment in our database
    //
    // Example:
    //   await supabase.from('payments').insert({
    //     invoice_id: invoiceId,
    //     amount: amount,
    //     newbook_payment_id: String(nbPayment.payment_id),
    //     status: 'completed',
    //     processed_at: new Date().toISOString(),
    //   });

    // TODO: Re-sync the invoice to update balance_due/status
    //   await syncInvoicesForBooking(invoice.booking_id, propertyId);

    return {
      success: true,
      transactionId: nbPayment.reference,
      errorMessage: null,
      newBookPaymentId: nbPayment.payment_id,
    };
  } catch (error) {
    // TODO: Log payment failures for auditing
    // TODO: Differentiate between declined cards and system errors

    return {
      success: false,
      transactionId: null,
      errorMessage: error instanceof Error ? error.message : 'Payment processing failed',
      newBookPaymentId: null,
    };
  }
}

/**
 * Store a tokenized payment method in NewBook for future use.
 *
 * The client-side payment form tokenizes the card/account details
 * with the payment processor. This function stores that token in
 * NewBook and records the payment method in our database.
 *
 * @param guestId - The portal guest ID to store the method for
 * @param tokenizedMethod - The tokenized payment details from the client
 * @returns The created portal PaymentMethod record
 */
export async function storePaymentMethod(
  guestId: string,
  tokenizedMethod: TokenizedPaymentMethod
): Promise<PaymentMethod> {
  // TODO: Look up the guest to get their NewBook guest ID and property
  //
  // Example:
  //   const supabase = await createClient();
  //   const { data: guest } = await supabase
  //     .from('guests')
  //     .select('newbook_guest_id')
  //     .eq('id', guestId)
  //     .single();
  //
  //   if (!guest?.newbook_guest_id) {
  //     throw new Error('Guest has no NewBook ID — cannot store payment method');
  //   }

  const newbookGuestId = ''; // TODO: From DB lookup
  const propertyId = '';     // TODO: Resolve from guest's bookings

  const client = await createNewBookClient(propertyId);

  // TODO: Confirm the actual NewBook endpoint for storing payment methods
  const response = await client.post<NewBookStoredPaymentMethod>('/payment-methods', {
    guest_id: Number(newbookGuestId),
    token: tokenizedMethod.token,
    card_type: tokenizedMethod.brand,
    // TODO: Additional fields NewBook may require
  });

  const nbMethod = response.data;

  // TODO: Store the payment method in our database
  //
  // Example:
  //   const { data: paymentMethod } = await supabase
  //     .from('payment_methods')
  //     .insert({
  //       guest_id: guestId,
  //       type: tokenizedMethod.type,
  //       last_four: tokenizedMethod.lastFour,
  //       brand: tokenizedMethod.brand,
  //       is_preferred: false,
  //       auto_pay_enabled: false,
  //       newbook_payment_token: nbMethod.token_id,
  //     })
  //     .select()
  //     .single();
  //
  //   return paymentMethod;

  // Placeholder
  return {
    id: '',
    guest_id: guestId,
    type: tokenizedMethod.type,
    last_four: tokenizedMethod.lastFour,
    brand: tokenizedMethod.brand,
    is_preferred: false,
    auto_pay_enabled: false,
    newbook_payment_token: nbMethod.token_id,
    created_at: new Date().toISOString(),
  };
}

/**
 * Toggle auto-pay for a guest in NewBook.
 *
 * When enabled, NewBook will automatically charge the guest's
 * preferred payment method when invoices are generated.
 *
 * @param guestId - The portal guest ID
 * @param enabled - Whether to enable or disable auto-pay
 */
export async function setAutoPay(
  guestId: string,
  enabled: boolean
): Promise<void> {
  // TODO: Look up the guest and their preferred payment method
  //
  // Example:
  //   const supabase = await createClient();
  //   const { data: methods } = await supabase
  //     .from('payment_methods')
  //     .select('*')
  //     .eq('guest_id', guestId)
  //     .eq('is_preferred', true)
  //     .single();
  //
  //   if (enabled && !methods) {
  //     throw new Error('Cannot enable auto-pay without a preferred payment method');
  //   }

  const newbookGuestId = ''; // TODO: From DB lookup
  const propertyId = '';     // TODO: Resolve from guest's bookings

  const client = await createNewBookClient(propertyId);

  // TODO: Confirm the actual NewBook endpoint for configuring auto-pay
  // This might be a guest setting, a payment method setting, or a
  // dedicated auto-pay endpoint
  await client.put<{ success: boolean }>(`/guests/${newbookGuestId}/auto-pay`, {
    enabled: enabled,
    // TODO: May need to specify which payment method to auto-charge
    // token_id: methods.newbook_payment_token,
  });

  // TODO: Update all payment methods in our database
  //
  // Example:
  //   await supabase
  //     .from('payment_methods')
  //     .update({ auto_pay_enabled: enabled })
  //     .eq('guest_id', guestId)
  //     .eq('is_preferred', true);
}
