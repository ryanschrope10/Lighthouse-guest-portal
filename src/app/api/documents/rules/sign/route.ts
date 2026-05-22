import { NextResponse } from "next/server";
import { getDemoGuest, getBookings, getProperty } from "@/lib/newbook/data";
import { getRulesDoc } from "@/lib/legal-docs";
import { addSignature, listSignatures } from "@/lib/portal-store";
import { requestProof } from "@/lib/request-proof";
import type { ApiResponse } from "@/types";

export async function POST(request: Request) {
  try {
    const { bookingId, fullName } = await request.json();

    const name = typeof fullName === "string" ? fullName.trim() : "";
    if (!bookingId || name.length < 2) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Your full name and a reservation are required" },
        { status: 400 },
      );
    }

    const property = getProperty();
    const doc = getRulesDoc(property.slug);
    const guest = await getDemoGuest();
    if (!doc || !guest) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Unable to record signature" },
        { status: 404 },
      );
    }

    // The booking must belong to this guest, and must be a stay that
    // requires signing (current/upcoming).
    const bookings = await getBookings();
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Reservation not found" },
        { status: 404 },
      );
    }
    if (booking.status !== "upcoming" && booking.status !== "checked_in") {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: "This reservation does not require a signature",
        },
        { status: 409 },
      );
    }

    // Idempotent: if already signed for this version, return it.
    const existing = (await listSignatures(guest.id)).find(
      (s) => s.bookingId === bookingId && s.docVersion === doc.version,
    );
    if (existing) {
      return NextResponse.json<ApiResponse<typeof existing>>(
        { data: existing, error: null },
        { status: 200 },
      );
    }

    const { ip, userAgent } = requestProof(request);
    const record = await addSignature({
      guestId: guest.id,
      bookingId,
      docId: doc.id,
      docVersion: doc.version,
      fullName: name,
      ip,
      userAgent,
    });

    return NextResponse.json<ApiResponse<typeof record>>(
      { data: record, error: null },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/documents/rules/sign error:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error:
          error instanceof Error ? error.message : "Failed to sign document",
      },
      { status: 502 },
    );
  }
}
