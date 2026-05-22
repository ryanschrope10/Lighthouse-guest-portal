import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireGuest } from "@/lib/session";
import type { ApiResponse } from "@/types/index";
import type { Review } from "@/types/reviews";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const guest = await requireGuest();

    const body = await request.json().catch(() => ({}));

    const ctaClicked: boolean | undefined =
      typeof body?.public_cta_clicked === "boolean"
        ? body.public_cta_clicked
        : undefined;
    const feedback: string | undefined =
      typeof body?.feedback === "string" ? body.feedback : undefined;

    if (ctaClicked === undefined && feedback === undefined) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "No updatable fields provided" },
        { status: 400 }
      );
    }

    const existing = (await sql`
      select * from reviews where id = ${id} and guest_id = ${guest.id} limit 1
    `) as Array<Review>;

    if (existing.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Review not found" },
        { status: 404 }
      );
    }

    const current = existing[0];
    const nextCta = ctaClicked !== undefined ? ctaClicked : current.public_cta_clicked;
    const nextFeedback = feedback !== undefined ? feedback : current.feedback;

    const updated = (await sql`
      update reviews
      set public_cta_clicked = ${nextCta}, feedback = ${nextFeedback}
      where id = ${id}
      returning *
    `) as Array<Review>;

    return NextResponse.json<ApiResponse<Review>>(
      { data: updated[0], error: null },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    const status = msg === "Unauthorized" ? 401 : msg.includes("Forbidden") ? 403 : 500;
    if (status === 500) console.error("PATCH /api/reviews/[id] error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}
