// ============================================================
// Per-park legal documents
// ============================================================
//
// Rules & Regulations are versioned: bumping `version` makes
// every booking require a fresh signature against the new
// version. Content is plain text the park owns/edits — not a
// scraped or third-party document.
//
// "Served" documents are notices the park sends a specific guest.
// Until a staff admin upload flow exists they're seeded here so
// the guest-facing acknowledge-with-proof flow is real and
// testable; the guest's acknowledgment IS persisted.
// ============================================================

export interface RulesSection {
  heading: string;
  body: string;
}

export interface RulesDoc {
  id: string;
  /** Bump to force re-signing on every booking. */
  version: string;
  title: string;
  effectiveDate: string;
  intro: string;
  sections: RulesSection[];
}

export type ServedCategory = "notice" | "policy" | "billing";

export interface ServedDoc {
  id: string;
  title: string;
  category: ServedCategory;
  /** ISO date the park sent/served this to the guest. */
  sentAt: string;
  /** Plain-text body of the notice. */
  body: string;
}

const HOLIDAY_RULES: RulesDoc = {
  id: "holiday-rr",
  version: "2026.1",
  title: "Holiday Motel & RV Park — Rules & Regulations",
  effectiveDate: "2026-01-01",
  intro:
    "These Rules & Regulations are part of your booking agreement. " +
    "By signing, you acknowledge you have read and agree to abide by them " +
    "for the duration of this stay. They must be signed for each booking.",
  sections: [
    {
      heading: "1. Check-in & Check-out",
      body: "Check-in is after 3:00 PM and check-out is by 11:00 AM unless arranged in advance with the front desk. Late departures may be charged an additional night.",
    },
    {
      heading: "2. Quiet Hours",
      body: "Quiet hours are 10:00 PM to 7:00 AM. Please keep generators, music, and gatherings at a courteous level so all guests can rest.",
    },
    {
      heading: "3. Site Use & Vehicles",
      body: "Park only on your assigned site/pad. One RV and two vehicles per site unless approved. Maintain a 10 MPH speed limit throughout the park. Washing RVs/vehicles on site is not permitted.",
    },
    {
      heading: "4. Pets",
      body: "Pets must be leashed at all times, never left unattended outside, and waste must be picked up immediately. Aggressive animals are not permitted. A pet fee may apply.",
    },
    {
      heading: "5. Utilities & Sewer",
      body: "Use a sewer donut/seal on all connections. Do not dump gray or black water on the ground. Do not exceed the electrical service rating for your site.",
    },
    {
      heading: "6. Cleanliness & Conduct",
      body: "Keep your site clean and free of clutter. Trash goes in designated receptacles. Unlawful, unsafe, or disorderly conduct is grounds for removal without refund.",
    },
    {
      heading: "7. Liability",
      body: "Guests use the park and its facilities at their own risk. The park is not responsible for loss, theft, or damage to personal property, or for personal injury.",
    },
    {
      heading: "8. Termination of Stay",
      body: "Management reserves the right to terminate a stay for violation of these rules. Notices may be served to you electronically through this portal and are considered delivered when sent.",
    },
  ],
};

const HOLIDAY_SERVED: ServedDoc[] = [
  {
    id: "served-rate-2026",
    title: "2026 Seasonal Rate Adjustment Notice",
    category: "billing",
    sentAt: "2026-04-15T16:00:00Z",
    body: "Effective June 1, 2026, monthly RV site rates will adjust to reflect updated utility costs. Long-term guests will see the new rate on their next billing cycle. Please contact the front desk with any questions.",
  },
  {
    id: "served-quiet-reminder",
    title: "Reminder: Quiet Hours Enforcement",
    category: "notice",
    sentAt: "2026-05-02T18:30:00Z",
    body: "We have received guest reports of noise after 10:00 PM. This is a friendly reminder that quiet hours are strictly 10:00 PM to 7:00 AM. Continued disturbances may result in a formal violation notice.",
  },
];

const RULES_BY_SLUG: Record<string, RulesDoc> = {
  "holiday-motel": HOLIDAY_RULES,
};

const SERVED_BY_SLUG: Record<string, ServedDoc[]> = {
  "holiday-motel": HOLIDAY_SERVED,
};

export function getRulesDoc(slug: string | undefined): RulesDoc | null {
  if (!slug) return null;
  return RULES_BY_SLUG[slug] ?? null;
}

export function getServedDocs(slug: string | undefined): ServedDoc[] {
  if (!slug) return [];
  return SERVED_BY_SLUG[slug] ?? [];
}
