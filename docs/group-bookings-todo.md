# Group Bookings — Deferred

**Status:** Not in this round. Park owner classified it as "down the line — not necessarily a pressing item" in the 2026-05-20 walkthrough.

## What guests need to be able to do

A group booking is a parent reservation (e.g. wedding party, festival group, work crew) that wraps N child bookings — one per room/site, sometimes with varying dates. Each member of the group should be able to:

1. Receive a login that drops them on the group's landing screen.
2. See every unclaimed room/site in the group along with its check-in/check-out dates.
3. Claim a specific room/site (their own).
4. Pay for **just that one** room/site (not the whole group).
5. Have the option for the group organizer to pay for everything in one go instead.

The current Newbook-native flow exists but the owner described it as "not crazy user friendly for the guest experience." Today they tell guests to call the front desk and staff assigns rooms manually.

## What the schema already supports

- `bookings.group_booking_id` (uuid, nullable) — child bookings can already point at a parent.
- `bookings.booking_type` — could carry `'group_parent' | 'group_child'`.
- No table exists yet for the parent group entity itself (group name, organizer guest_id, total amount, billing mode).

## Suggested shape for V1

- New table `group_bookings`: id, property_id, organizer_guest_id, name, newbook_group_id, billing_mode ('per_room' | 'organizer_pays_all'), total_amount, status, created_at.
- New table `group_invitations`: id, group_booking_id, email, claim_token, claimed_by_guest_id, claimed_booking_id, expires_at.
- New route `/group/[token]` (unauthenticated landing) → asks for email → magic link → drops them on `/group/[id]` once authed.
- New route `/group/[id]` — list of rooms/sites in the group, with claim button on each unclaimed row.
- Claim flow: assigns the child booking's `guest_id` to the claiming guest, then routes to the existing payments flow for that booking.

## Open questions to ask the owner before building

1. How does Newbook actually represent a group on the API side? (Need to grep their docs for `group_id`/`master_booking_id`.)
2. Is the organizer always also a guest, or can it be a non-staying contact? Affects whether organizer needs a guest record.
3. For "organizer pays all" mode, do they need an itemized breakdown to share with attendees afterward?
4. Can the dates of group children genuinely differ, or is it always shared dates with just different sites?
5. Are there any group types where one person doesn't get a room of their own but is still on the group (e.g. coordinator with day-pass access)?

## References

- Owner walkthrough transcript: 2026-05-20.
- Newbook staff-side group booking screenshots: not yet attached.
