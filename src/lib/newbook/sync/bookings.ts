// ============================================================
// Booking Sync — NewBook <-> Portal
// ============================================================
//
// Functions for synchronizing booking/reservation data between
// the NewBook PMS and our portal database. Supports both full
// guest-level sync and targeted active-booking sync.
// ============================================================

import type { Booking } from '@/types/index';
import type { NewBookBooking } from '../types';
import { createNewBookClient } from '../client';
import { mapNewBookBookingToBooking, mapBookingToNewBookBooking } from '../mappers';

/**
 * Pull all bookings for a specific guest from NewBook and sync to our database.
 *
 * Fetches the complete booking history for a guest from NewBook,
 * maps each booking to our schema, and upserts into the portal database.
 *
 * @param guestId - The NewBook guest ID to pull bookings for
 * @param propertyId - The portal property ID (determines which NewBook instance to query)
 * @returns Array of upserted portal Booking records
 */
export async function syncBookingsForGuest(
  guestId: string,
  propertyId: string
): Promise<Booking[]> {
  const client = await createNewBookClient(propertyId);

  // TODO: Confirm the actual NewBook endpoint for listing guest bookings
  // NewBook might use /bookings?guest_id=X or /guests/X/bookings
  const response = await client.get<NewBookBooking[]>('/bookings', {
    guest_id: guestId,
    // TODO: Add pagination support for guests with many bookings
  });

  const nbBookings = response.data;

  // Map all NewBook bookings to portal format
  const mappedBookings = nbBookings.map((nbBooking) => {
    const mapped = mapNewBookBookingToBooking(nbBooking);
    return {
      ...mapped,
      property_id: propertyId,
      // TODO: Resolve portal guest_id from NewBook guest_id
      // This requires a lookup: SELECT id FROM guests WHERE newbook_guest_id = guestId
      guest_id: '', // Placeholder — must be resolved
    };
  });

  // TODO: Upsert all bookings into database via Supabase
  // Upsert should match on newbook_booking_id to avoid duplicates.
  //
  // Example implementation:
  //
  //   const supabase = await createClient();
  //   const { data, error } = await supabase
  //     .from('bookings')
  //     .upsert(
  //       mappedBookings.map((b) => ({
  //         ...b,
  //         synced_at: new Date().toISOString(),
  //       })),
  //       { onConflict: 'newbook_booking_id' }
  //     )
  //     .select();
  //
  //   if (error) throw error;
  //   return data;

  // Placeholder: return stubs until DB integration is complete
  return mappedBookings.map((b) => ({
    id: '',
    created_at: new Date().toISOString(),
    ...b,
  })) as Booking[];
}

/**
 * Pull all active/upcoming bookings for a property from NewBook.
 *
 * "Active" means bookings with a check-in date within the next 7 days,
 * plus any currently checked-in bookings. This is used for the
 * property dashboard and pre-arrival workflows.
 *
 * @param propertyId - The portal property ID
 * @returns Array of upserted portal Booking records
 */
export async function syncActiveBookings(propertyId: string): Promise<Booking[]> {
  const client = await createNewBookClient(propertyId);

  // Calculate date range: today through 7 days from now
  const today = new Date();
  const sevenDaysOut = new Date(today);
  sevenDaysOut.setDate(today.getDate() + 7);

  const fromDate = today.toISOString().split('T')[0];
  const toDate = sevenDaysOut.toISOString().split('T')[0];

  // TODO: Confirm the actual NewBook endpoint for date-range booking queries
  // NewBook might use arrival_from/arrival_to, date_from/date_to, or similar
  const response = await client.get<NewBookBooking[]>('/bookings', {
    arrival_from: fromDate,
    arrival_to: toDate,
    // TODO: Also include currently checked-in bookings (status=in_house)
    // This might require a separate API call or a status filter
  });

  const nbBookings = response.data;

  const mappedBookings = nbBookings.map((nbBooking) => {
    const mapped = mapNewBookBookingToBooking(nbBooking);
    return {
      ...mapped,
      property_id: propertyId,
      guest_id: '', // TODO: Resolve portal guest_id from NewBook guest_id
    };
  });

  // TODO: Upsert all bookings into database (same pattern as syncBookingsForGuest)
  // TODO: Also sync the guest records for any new guests found in these bookings

  // Placeholder
  return mappedBookings.map((b) => ({
    id: '',
    created_at: new Date().toISOString(),
    ...b,
  })) as Booking[];
}

/**
 * Push a booking modification to NewBook.
 *
 * Used when a guest requests changes to their booking through the portal
 * (e.g., date changes, site changes). The modification is sent to NewBook
 * and the local record is updated on success.
 *
 * @param bookingId - The portal booking ID to modify
 * @param changes - Partial booking data with the fields to change
 * @returns The updated portal Booking record
 */
export async function modifyBooking(
  bookingId: string,
  changes: Partial<Pick<Booking, 'check_in' | 'check_out' | 'site_or_room'>>
): Promise<Booking> {
  // TODO: Look up the booking to get the NewBook booking ID and property ID
  //
  // Example:
  //   const supabase = await createClient();
  //   const { data: booking } = await supabase
  //     .from('bookings')
  //     .select('*')
  //     .eq('id', bookingId)
  //     .single();
  //
  //   if (!booking) throw new Error(`Booking ${bookingId} not found`);

  // Placeholder booking for type satisfaction
  const booking = {
    id: bookingId,
    newbook_booking_id: '', // TODO: From DB lookup
    property_id: '',        // TODO: From DB lookup
  } as Booking;

  const client = await createNewBookClient(booking.property_id);

  // Build the NewBook update payload from the changes
  const nbChanges = mapBookingToNewBookBooking({
    ...booking,
    ...changes,
  } as Booking);

  // TODO: Confirm the actual NewBook endpoint for modifying a booking
  await client.put<NewBookBooking>(
    `/bookings/${booking.newbook_booking_id}`,
    nbChanges as Record<string, unknown>
  );

  // TODO: Re-sync the booking from NewBook to get the authoritative state
  // NewBook may adjust dates, recalculate pricing, etc.
  //
  // Example:
  //   const refreshed = await client.get<NewBookBooking>(
  //     `/bookings/${booking.newbook_booking_id}`
  //   );
  //   const mapped = mapNewBookBookingToBooking(refreshed.data);
  //   // Update in DB...

  // TODO: Update local database record
  //
  // Example:
  //   const { data: updated } = await supabase
  //     .from('bookings')
  //     .update({ ...changes, synced_at: new Date().toISOString() })
  //     .eq('id', bookingId)
  //     .select()
  //     .single();

  // Placeholder
  return {
    ...booking,
    ...changes,
    synced_at: new Date().toISOString(),
  } as Booking;
}

/**
 * Cancel a booking via the NewBook API.
 *
 * Sends a cancellation request to NewBook and updates the local
 * booking status to "cancelled". Respects the property's
 * cancellation policy for timing/eligibility.
 *
 * @param bookingId - The portal booking ID to cancel
 * @returns The updated portal Booking record with cancelled status
 */
export async function cancelBooking(bookingId: string): Promise<Booking> {
  // TODO: Look up the booking from the database (same pattern as modifyBooking)
  // TODO: Check cancellation policy eligibility before sending to NewBook
  //
  // Example:
  //   const supabase = await createClient();
  //   const { data: booking } = await supabase
  //     .from('bookings')
  //     .select('*, property:properties(cancellation_policy)')
  //     .eq('id', bookingId)
  //     .single();
  //
  //   // Check cutoff
  //   const checkIn = new Date(booking.check_in);
  //   const cutoffDate = new Date();
  //   cutoffDate.setDate(cutoffDate.getDate() + booking.property.cancellation_policy.cutoff_days);
  //   if (checkIn < cutoffDate) {
  //     throw new Error('Cancellation window has passed');
  //   }

  const booking = {
    id: bookingId,
    newbook_booking_id: '', // TODO: From DB lookup
    property_id: '',        // TODO: From DB lookup
  } as Booking;

  const client = await createNewBookClient(booking.property_id);

  // TODO: Confirm the actual NewBook endpoint for cancelling a booking
  // It might be DELETE /bookings/:id, PUT /bookings/:id/cancel,
  // or POST /bookings/:id/cancel
  await client.post<NewBookBooking>(
    `/bookings/${booking.newbook_booking_id}/cancel`,
    {}
  );

  // TODO: Update local database record
  //
  // Example:
  //   const { data: updated } = await supabase
  //     .from('bookings')
  //     .update({
  //       status: 'cancelled',
  //       synced_at: new Date().toISOString(),
  //     })
  //     .eq('id', bookingId)
  //     .select()
  //     .single();

  // Placeholder
  return {
    ...booking,
    status: 'cancelled' as const,
    synced_at: new Date().toISOString(),
  } as Booking;
}
