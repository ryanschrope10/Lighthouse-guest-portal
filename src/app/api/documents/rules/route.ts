import { NextResponse } from "next/server";
import { getDemoGuest, getBookings, getProperty } from "@/lib/newbook/data";
import { getRulesDoc, type RulesDoc } from "@/lib/legal-docs";
import { getContactTemplateContent } from "@/lib/newbook/templates";
import { getRulesTemplateId } from "@/lib/newbook/config";
import { listSignatures } from "@/lib/portal-store";
import { guestFacingError } from "@/lib/api-error";
import type { ApiResponse } from "@/types";
import type {
  RulesPayload,
  BookingSigningStatus,
} from "@/lib/documents-types";

// Prefer the park's live Rules & Regs from Newbook (contact template #94),
// falling back to the built-in copy if Newbook is unreachable or the template
// is empty. Never let a Newbook hiccup break the rules/signing page.
async function resolveRulesDoc(base: RulesDoc): Promise<RulesDoc> {
  try {
    const { name, body } = await getContactTemplateContent(getRulesTemplateId());
    if (body) {
      return { ...base, html: body, title: name?.trim() || base.title };
    }
  } catch (err) {
    console.warn("Rules template fetch failed; using built-in copy:", err);
  }
  return base;
}

export async function GET() {
  try {
    const property = getProperty();
    const baseDoc = getRulesDoc(property.slug);
    const doc = baseDoc ? await resolveRulesDoc(baseDoc) : null;
    const guest = await getDemoGuest();

    if (!doc) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "No Rules & Regulations on file for this park" },
        { status: 404 },
      );
    }
    if (!guest) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "No guest record found" },
        { status: 404 },
      );
    }

    const [bookings, sigs] = await Promise.all([
      getBookings(),
      listSignatures(guest.id),
    ]);

    const statuses: BookingSigningStatus[] = bookings.map((b) => {
      const sig = sigs.find(
        (s) => s.bookingId === b.id && s.docVersion === doc.version,
      );
      const requiresSignature =
        b.status === "upcoming" || b.status === "checked_in";
      return {
        bookingId: b.id,
        label: b.site_or_room ?? "Booking",
        checkIn: b.check_in,
        checkOut: b.check_out,
        bookingStatus: b.status,
        requiresSignature,
        signed: !!sig,
        signedAt: sig?.signedAt ?? null,
        signedName: sig?.fullName ?? null,
      };
    });

    // Action-needed first, then most recent stay first.
    statuses.sort((a, b) => {
      const aNeed = a.requiresSignature && !a.signed ? 0 : 1;
      const bNeed = b.requiresSignature && !b.signed ? 0 : 1;
      if (aNeed !== bNeed) return aNeed - bNeed;
      return new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime();
    });

    const outstandingCount = statuses.filter(
      (s) => s.requiresSignature && !s.signed,
    ).length;

    return NextResponse.json<ApiResponse<RulesPayload>>(
      {
        data: {
          doc,
          guestName:
            [guest.first_name, guest.last_name].filter(Boolean).join(" ") ||
            "",
          bookings: statuses,
          outstandingCount,
        },
        error: null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/documents/rules error:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: guestFacingError(
          error,
          "We couldn’t load your Rules & Regulations.",
        ),
      },
      { status: 502 },
    );
  }
}
