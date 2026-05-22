import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionUser, requireGuest } from "@/lib/session";
import type { ApiResponse } from "@/types/index";
import type { Review, ReviewWithGuestBooking } from "@/types/reviews";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const isAdmin = session.role === "admin";

    const rows = (isAdmin
      ? await sql`
        select
          r.id, r.property_id, r.guest_id, r.booking_id, r.rating, r.feedback,
          r.is_public_intent, r.public_cta_url, r.public_cta_clicked,
          r.staff_response, r.staff_responded_at, r.staff_responded_by, r.created_at,
          g.id as g_id, g.first_name as g_first_name, g.last_name as g_last_name, g.email as g_email,
          b.id as b_id, b.check_in as b_check_in, b.check_out as b_check_out, b.site_or_room as b_site_or_room
        from reviews r
        left join guests g on g.id = r.guest_id
        left join bookings b on b.id = r.booking_id
        order by r.created_at desc
      `
      : await sql`
        select
          r.id, r.property_id, r.guest_id, r.booking_id, r.rating, r.feedback,
          r.is_public_intent, r.public_cta_url, r.public_cta_clicked,
          r.staff_response, r.staff_responded_at, r.staff_responded_by, r.created_at,
          g.id as g_id, g.first_name as g_first_name, g.last_name as g_last_name, g.email as g_email,
          b.id as b_id, b.check_in as b_check_in, b.check_out as b_check_out, b.site_or_room as b_site_or_room
        from reviews r
        left join guests g on g.id = r.guest_id
        left join bookings b on b.id = r.booking_id
        where r.guest_id in (
          select id from guests where newbook_guest_id = ${session.newbookGuestId}
        )
        order by r.created_at desc
      `) as Array<{
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
      g_id: string | null;
      g_first_name: string | null;
      g_last_name: string | null;
      g_email: string | null;
      b_id: string | null;
      b_check_in: string | null;
      b_check_out: string | null;
      b_site_or_room: string | null;
    }>;

    const result: ReviewWithGuestBooking[] = rows.map((r) => ({
      id: r.id,
      property_id: r.property_id,
      guest_id: r.guest_id,
      booking_id: r.booking_id,
      rating: r.rating,
      feedback: r.feedback,
      is_public_intent: r.is_public_intent,
      public_cta_url: r.public_cta_url,
      public_cta_clicked: r.public_cta_clicked,
      staff_response: r.staff_response,
      staff_responded_at: r.staff_responded_at,
      staff_responded_by: r.staff_responded_by,
      created_at: r.created_at,
      guest: r.g_id
        ? {
            id: r.g_id,
            first_name: r.g_first_name,
            last_name: r.g_last_name,
            email: r.g_email ?? "",
          }
        : null,
      booking:
        r.b_id && r.b_check_in && r.b_check_out
          ? {
              id: r.b_id,
              check_in: r.b_check_in,
              check_out: r.b_check_out,
              site_or_room: r.b_site_or_room,
            }
          : null,
    }));

    return NextResponse.json<ApiResponse<ReviewWithGuestBooking[]>>(
      { data: result, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const guest = await requireGuest();

    const body = await request.json();
    const rating = Number(body?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "rating must be an integer 1-5" },
        { status: 400 }
      );
    }

    const isPublicIntent = Boolean(body?.is_public_intent);
    const feedback: string | null =
      typeof body?.feedback === "string" && body.feedback.trim().length > 0
        ? body.feedback.trim()
        : null;
    const bookingId: string | null =
      typeof body?.booking_id === "string" && body.booking_id.length > 0
        ? body.booking_id
        : null;

    let publicCtaUrl: string | null = null;
    if (isPublicIntent) {
      const props = (await sql`
        select branding from properties where id = ${guest.property_id} limit 1
      `) as Array<{ branding: { public_review_url?: string } | null }>;
      publicCtaUrl = props[0]?.branding?.public_review_url ?? null;
    }

    const inserted = (await sql`
      insert into reviews (
        property_id, guest_id, booking_id, rating, feedback,
        is_public_intent, public_cta_url
      )
      values (
        ${guest.property_id}, ${guest.id}, ${bookingId}, ${rating}, ${feedback},
        ${isPublicIntent}, ${publicCtaUrl}
      )
      returning *
    `) as Array<Review>;

    if (rating < 5) {
      const excerpt = feedback
        ? feedback.slice(0, 160)
        : `Rating: ${rating} star${rating === 1 ? "" : "s"}`;
      await sql`
        insert into notifications (property_id, target_type, target_id, title, body, channel)
        values (${guest.property_id}, 'admin', ${guest.property_id}, 'New private feedback', ${excerpt}, 'push')
      `;
    }

    return NextResponse.json<ApiResponse<Review>>(
      { data: inserted[0], error: null },
      { status: 201 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    const status = msg === "Unauthorized" ? 401 : msg.includes("Forbidden") ? 403 : 500;
    if (status === 500) console.error("POST /api/reviews error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}
