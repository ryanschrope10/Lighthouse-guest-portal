// ============================================================
// Guest Sync — NewBook <-> Portal
// ============================================================
//
// Functions for synchronizing guest profile data between the
// NewBook PMS and our portal database. Handles both pull
// (NewBook -> portal) and push (portal -> NewBook) directions.
// ============================================================

import type { Guest } from '@/types/index';
import type { NewBookGuest } from '../types';
import { createNewBookClient } from '../client';
import { mapNewBookGuestToGuest, mapGuestToNewBookGuest } from '../mappers';

/**
 * Pull a guest's profile from NewBook and upsert it into the portal database.
 *
 * This is the primary function for keeping a guest's data in sync.
 * It fetches the latest data from NewBook, maps it to our schema,
 * and performs an upsert keyed on `newbook_guest_id`.
 *
 * @param guestId - The NewBook guest ID to sync
 * @param propertyId - The portal property ID (determines which NewBook instance to query)
 * @returns The upserted portal Guest record
 */
export async function syncGuestFromNewBook(
  guestId: string,
  propertyId: string
): Promise<Guest> {
  const client = await createNewBookClient(propertyId);

  // TODO: Confirm the actual NewBook endpoint path for fetching a guest
  const response = await client.get<NewBookGuest>(`/guests/${guestId}`);
  const nbGuest = response.data;

  // Map NewBook guest data to portal format
  const mappedGuest = mapNewBookGuestToGuest(nbGuest);

  // TODO: Upsert into database via Supabase
  // The upsert should match on newbook_guest_id to avoid duplicates.
  //
  // Example implementation:
  //
  //   const supabase = await createClient();
  //   const { data, error } = await supabase
  //     .from('guests')
  //     .upsert(
  //       {
  //         ...mappedGuest,
  //         updated_at: new Date().toISOString(),
  //       },
  //       { onConflict: 'newbook_guest_id' }
  //     )
  //     .select()
  //     .single();
  //
  //   if (error) throw error;
  //   return data;

  // Placeholder: return a stub until DB integration is complete
  return {
    id: '',
    auth_user_id: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...mappedGuest,
  } as Guest;
}

/**
 * Push a portal guest's profile updates to NewBook.
 *
 * Used when a guest updates their profile through the portal
 * and we need to sync those changes back to NewBook.
 *
 * @param guest - The portal Guest record to push
 * @returns The updated NewBook guest ID
 */
export async function pushGuestToNewBook(guest: Guest): Promise<string> {
  if (!guest.newbook_guest_id) {
    throw new Error(`Guest ${guest.id} has no NewBook guest ID — cannot push to NewBook`);
  }

  // TODO: Determine which property to use. The guest may have bookings
  // at multiple properties. We may need to push to all of them, or
  // accept a propertyId parameter.
  const propertyId = ''; // TODO: Resolve from guest's bookings or accept as parameter

  const client = await createNewBookClient(propertyId);

  // Map portal guest data to NewBook format
  const nbGuestData = mapGuestToNewBookGuest(guest);

  // TODO: Confirm the actual NewBook endpoint for updating a guest
  const response = await client.put<NewBookGuest>(
    `/guests/${guest.newbook_guest_id}`,
    nbGuestData as Record<string, unknown>
  );

  // TODO: Update the guest's synced_at timestamp in our database
  //
  // Example:
  //   const supabase = await createClient();
  //   await supabase
  //     .from('guests')
  //     .update({ updated_at: new Date().toISOString() })
  //     .eq('id', guest.id);

  return String(response.data.guest_id);
}

/**
 * Search NewBook for a guest matching the given email address.
 *
 * Used during registration/login to link a portal account
 * to an existing NewBook guest record.
 *
 * @param email - Email address to search for
 * @param propertyId - The portal property ID (determines which NewBook instance to query)
 * @returns The matching NewBook guest, or null if not found
 */
export async function findGuestByEmail(
  email: string,
  propertyId: string
): Promise<NewBookGuest | null> {
  const client = await createNewBookClient(propertyId);

  // TODO: Confirm the actual NewBook search endpoint and query parameter format
  // NewBook may use a search endpoint or a filter parameter on the list endpoint
  try {
    const response = await client.get<NewBookGuest[]>('/guests', {
      email: email,
      // TODO: NewBook might use different parameter names, e.g.:
      // search: email,
      // filter[email]: email,
    });

    const guests = response.data;
    if (!guests || guests.length === 0) {
      return null;
    }

    // Return the first matching guest
    // TODO: Handle case where multiple guests share an email
    // (might need to match on additional fields)
    return guests[0];
  } catch {
    // TODO: Differentiate between "not found" and actual errors
    // A 404 might be expected; a 500 should be thrown
    return null;
  }
}
