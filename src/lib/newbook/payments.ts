// Thin Newbook payments shim — returns a synthetic token in dev.
// TODO: wire to real Newbook payment endpoint when contract is documented.

import type {
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
} from '@/types/addons';

export async function createPaymentIntent(
  input: CreatePaymentIntentInput
): Promise<CreatePaymentIntentResult> {
  const token =
    'STUB-' +
    Buffer.from(
      `${input.bookingId}:${input.amountCents}:${Date.now()}`
    ).toString('base64url');

  return { ok: true, newbook_payment_token: token };
}
