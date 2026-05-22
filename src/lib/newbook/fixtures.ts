// ============================================================
// Offline fallback snapshot (dev only)
// ============================================================
//
// A small, faithful snapshot of the demo guest's Newbook data
// (Timothy Moore, guest 5170 at TRAINING Holiday Motel). Used
// ONLY when NEWBOOK_OFFLINE_FALLBACK=true AND the live API is
// unreachable (e.g. an upstream Cloudflare rate-limit), so the
// portal stays usable for local dev/demos. Live data resumes
// automatically the moment Newbook is reachable again.
//
// This is a point-in-time copy, not live — never enable the flag
// in production.
// ============================================================

import type { NewBookBooking, NewBookGuest } from "./types";

const TIMOTHY: NewBookGuest = {
  guest_id: "5170",
  id: "5170",
  firstname: "Timothy",
  lastname: "Moore",
  primary_client: "1",
  contact_details: [
    { id: "1", type: "email", content: "timothy.moore@example.com" },
    { id: "2", type: "mobile", content: "+1 208 555 0170" },
  ],
  street: "",
  city: "Emmett",
  state_shortname: "ID",
  state_name: "Idaho",
  postcode: "83617",
  country_code: "US",
  account_id: "5170",
  account_balance: "0.00",
  equipment: [],
  date_created: "2023-12-01 09:00:00",
  modified_when: "2026-05-01 09:00:00",
};

function booking(
  partial: Pick<
    NewBookBooking,
    | "booking_id"
    | "booking_status"
    | "booking_arrival"
    | "booking_departure"
    | "booking_checkedin"
    | "booking_checkedout"
    | "site_name"
    | "category_name"
    | "booking_total"
  >,
): NewBookBooking {
  return {
    booking_cancelled: null,
    booking_length: 1,
    booking_adults: "2",
    booking_children: "0",
    booking_infants: "0",
    booking_animals: "0",
    booking_placed: "2026-01-01 09:00:00",
    booking_modified: "2026-05-01 09:00:00",
    account_id: "5170",
    account_balance: "0.00",
    tariffs_quoted: [],
    inventory_items: [],
    discounts: [],
    discount_total: "0.00",
    guests: [TIMOTHY],
    ...partial,
  };
}

/** Demo guest's bookings snapshot (offline fallback only). */
export const DEMO_RAW_BOOKINGS: NewBookBooking[] = [
  booking({
    booking_id: 31329959,
    booking_status: "Confirmed",
    booking_arrival: "2026-06-12 15:00:00",
    booking_departure: "2026-06-14 11:00:00",
    booking_checkedin: null,
    booking_checkedout: null,
    site_name: "Room #11 [2Q]",
    category_name: "Double Queen Room",
    booking_total: "266.40",
  }),
  booking({
    booking_id: 31329906,
    booking_status: "Arrived",
    booking_arrival: "2026-03-18 15:00:00",
    booking_departure: "2026-05-18 11:00:00",
    booking_checkedin: "2026-03-18 16:02:59",
    booking_checkedout: null,
    site_name: "Site 07",
    category_name: "RV Site",
    booking_total: "2600.00",
  }),
  booking({
    booking_id: 31267342,
    booking_status: "Departed",
    booking_arrival: "2026-02-18 15:00:00",
    booking_departure: "2026-03-18 11:00:00",
    booking_checkedin: "2026-02-18 15:30:00",
    booking_checkedout: "2026-03-18 10:30:00",
    site_name: "Site 07",
    category_name: "RV Site",
    booking_total: "650.00",
  }),
];
