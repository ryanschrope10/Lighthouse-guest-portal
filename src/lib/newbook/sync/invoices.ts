// ============================================================
// Invoice Sync — NewBook -> Portal
// ============================================================
//
// Functions for synchronizing invoice data from the NewBook PMS
// into our portal database. Invoices are pull-only (we don't
// create invoices in NewBook from the portal).
// ============================================================

import type { Invoice } from '@/types/index';
import type { NewBookInvoice } from '../types';
import { createNewBookClient } from '../client';
import { mapNewBookInvoiceToInvoice } from '../mappers';

/**
 * Pull all invoices for a specific booking from NewBook and sync to our database.
 *
 * Fetches invoices associated with a NewBook booking ID, maps them
 * to our schema, and upserts into the portal database.
 *
 * @param bookingId - The portal booking ID to sync invoices for
 * @param propertyId - The portal property ID (determines which NewBook instance to query)
 * @returns Array of upserted portal Invoice records
 */
export async function syncInvoicesForBooking(
  bookingId: string,
  propertyId: string
): Promise<Invoice[]> {
  // TODO: Look up the NewBook booking ID from our database
  //
  // Example:
  //   const supabase = await createClient();
  //   const { data: booking } = await supabase
  //     .from('bookings')
  //     .select('newbook_booking_id, guest_id')
  //     .eq('id', bookingId)
  //     .single();
  //
  //   if (!booking) throw new Error(`Booking ${bookingId} not found`);

  const newbookBookingId = ''; // TODO: From DB lookup
  const guestId = '';          // TODO: From DB lookup

  const client = await createNewBookClient(propertyId);

  // TODO: Confirm the actual NewBook endpoint for listing invoices by booking
  // NewBook might use /invoices?booking_id=X or /bookings/X/invoices
  const response = await client.get<NewBookInvoice[]>('/invoices', {
    booking_id: newbookBookingId,
  });

  const nbInvoices = response.data;

  const mappedInvoices = nbInvoices.map((nbInvoice) => {
    const mapped = mapNewBookInvoiceToInvoice(nbInvoice);
    return {
      ...mapped,
      booking_id: bookingId,
      property_id: propertyId,
      guest_id: guestId,
    };
  });

  // TODO: Upsert all invoices into database via Supabase
  // Upsert should match on newbook_invoice_id to avoid duplicates.
  //
  // Example implementation:
  //
  //   const { data, error } = await supabase
  //     .from('invoices')
  //     .upsert(
  //       mappedInvoices.map((inv) => ({
  //         ...inv,
  //         synced_at: new Date().toISOString(),
  //       })),
  //       { onConflict: 'newbook_invoice_id' }
  //     )
  //     .select();
  //
  //   if (error) throw error;
  //   return data;

  // Placeholder: return stubs until DB integration is complete
  return mappedInvoices.map((inv) => ({
    id: '',
    ...inv,
  })) as Invoice[];
}

/**
 * Pull all invoices for a property from NewBook (full sync).
 *
 * This is a heavier operation intended for periodic background sync
 * or initial data population. It fetches all invoices from NewBook
 * for the property and upserts them.
 *
 * @param propertyId - The portal property ID to sync all invoices for
 * @returns Array of upserted portal Invoice records
 */
export async function syncAllInvoices(propertyId: string): Promise<Invoice[]> {
  const client = await createNewBookClient(propertyId);

  // TODO: Implement pagination — NewBook will likely cap results per page
  // We need to loop through all pages to get a complete sync.
  //
  // Example pagination pattern:
  //
  //   let allInvoices: NewBookInvoice[] = [];
  //   let page = 1;
  //   let hasMore = true;
  //
  //   while (hasMore) {
  //     const response = await client.get<NewBookInvoice[]>('/invoices', {
  //       page: String(page),
  //       per_page: '100',
  //     });
  //     allInvoices = allInvoices.concat(response.data);
  //     hasMore = response.data.length === 100;
  //     page++;
  //   }

  // TODO: Confirm the actual NewBook endpoint for listing all invoices
  const response = await client.get<NewBookInvoice[]>('/invoices', {
    // TODO: Add date range filter to limit to recent invoices
    // for incremental sync rather than pulling everything
    per_page: '100',
  });

  const nbInvoices = response.data;

  const mappedInvoices = nbInvoices.map((nbInvoice) => {
    const mapped = mapNewBookInvoiceToInvoice(nbInvoice);
    return {
      ...mapped,
      // TODO: Resolve portal booking_id and guest_id from NewBook IDs
      // This requires lookups:
      //   SELECT id FROM bookings WHERE newbook_booking_id = nbInvoice.booking_id
      //   SELECT id FROM guests WHERE newbook_guest_id = nbInvoice.guest_id
      booking_id: '', // Placeholder
      property_id: propertyId,
      guest_id: '',   // Placeholder
    };
  });

  // TODO: Batch upsert all invoices into database
  // Same pattern as syncInvoicesForBooking but potentially with
  // larger batches. Consider chunking for Supabase limits.

  // Placeholder
  return mappedInvoices.map((inv) => ({
    id: '',
    ...inv,
  })) as Invoice[];
}
