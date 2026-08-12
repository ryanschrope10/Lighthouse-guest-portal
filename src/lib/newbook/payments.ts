// Newbook card payments for paid add-ons.
//
// There is no implementation yet — the Newbook payment endpoint contract
// isn't documented on this integration. This deliberately FAILS CLOSED: it
// used to mint a synthetic "STUB-…" token that always succeeded, which made
// the caller mark the add-on request `paid` in the database while no money
// ever moved. Refusing is the safe behaviour until a real charge path (or
// the Newbook hosted pay link) is wired in.

import type {
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
} from '@/types/addons';

export async function createPaymentIntent(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  input: CreatePaymentIntentInput
): Promise<CreatePaymentIntentResult> {
  return {
    ok: false,
    reason:
      "Card payment for add-ons isn't enabled yet. The front desk will take payment for this request.",
  };
}
