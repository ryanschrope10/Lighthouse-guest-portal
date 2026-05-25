// Shared shapes for the documents API <-> Documents page.
import type { RulesDoc, ServedDoc } from "./legal-docs";

export interface BookingSigningStatus {
  bookingId: string;
  label: string;
  checkIn: string;
  checkOut: string;
  bookingStatus: string;
  /** True for stays a signature is required on (current/upcoming). */
  requiresSignature: boolean;
  signed: boolean;
  signedAt: string | null;
  signedName: string | null;
}

export interface RulesPayload {
  doc: RulesDoc;
  guestName: string;
  bookings: BookingSigningStatus[];
  /** Active/upcoming bookings still missing a current-version signature. */
  outstandingCount: number;
}

export interface ServedDocStatus extends ServedDoc {
  acknowledged: boolean;
  acknowledgedAt: string | null;
}

export interface ServedPayload {
  documents: ServedDocStatus[];
  outstandingCount: number;
}
