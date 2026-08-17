// ============================================================
// Newbook guest writes (server-only)
// ============================================================
//
// Newbook is the source of truth for guest contact details, so an edit made
// in the portal has to land THERE — otherwise the office and the portal
// disagree about someone's phone number or address.
//
// Contract (v1 `guests_update`, verified against Newbook's REST docs):
//   { region, api_key, guest_id, firstname, lastname, street, city,
//     state, postcode, country, contact_phone, contact_email }
// Only the fields provided are changed.
// ============================================================

import { createNewBookClient } from './client';
import type { NewBookGuest } from './types';

export interface GuestContactUpdate {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  street?: string | null;
  city?: string | null;
  zip?: string | null;
}

// State and country are deliberately NOT synced. Newbook stores them as its
// own display strings ("Idaho (ID)", "United States of America") while the
// portal shows the short forms it reads back ("ID", "US"), and the API
// credentials have no permission for states_list/countries_list to translate
// between them — sending "ID" risks clearing a good address. Those two fields
// stay read-only in the portal; the front desk changes them.

/** Drop keys the caller didn't set so we never blank a field by omission. */
function present(
  params: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && String(v).trim() !== ''
    )
  );
}

/**
 * Push contact changes to the Newbook guest record. Throws NewBookApiError if
 * Newbook rejects it, so the caller can refuse the edit rather than reporting
 * a save that only ever existed locally.
 */
export async function updateNewbookGuestContact(
  newbookGuestId: string,
  update: GuestContactUpdate
): Promise<NewBookGuest> {
  const client = createNewBookClient();

  const params = present({
    firstname: update.first_name,
    lastname: update.last_name,
    contact_phone: update.phone,
    street: update.street,
    city: update.city,
    postcode: update.zip,
  });

  return client.request<NewBookGuest>('guests_update', {
    guest_id: newbookGuestId,
    ...params,
  });
}
