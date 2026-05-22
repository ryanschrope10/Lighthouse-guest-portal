// ============================================================
// Signature status types
// ============================================================
//
// Newbook owns the signing flow; the portal just mirrors the
// current state. Cached on the `bookings` table (migration 002)
// and mapped onto Booking.details by mapBooking.
// ============================================================

export type SignatureStatus = 'not_required' | 'pending' | 'signed';

export interface SignatureInfo {
  signature_status: SignatureStatus;
  signature_signed_at: string | null;
  signature_document_url: string | null;
}
