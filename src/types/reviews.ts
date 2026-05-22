export interface Review {
  id: string;
  property_id: string;
  guest_id: string;
  booking_id: string | null;
  rating: number;
  feedback: string | null;
  is_public_intent: boolean;
  public_cta_url: string | null;
  public_cta_clicked: boolean;
  staff_response: string | null;
  staff_responded_at: string | null;
  staff_responded_by: string | null;
  created_at: string;
}

export interface ReviewWithGuestBooking extends Review {
  guest?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  booking?: {
    id: string;
    check_in: string;
    check_out: string;
    site_or_room: string | null;
  } | null;
}

export interface CreateReviewInput {
  booking_id?: string;
  rating: number;
  feedback?: string;
  is_public_intent: boolean;
}
