import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import type { ApiResponse } from "@/types/index";
import type { Review } from "@/types/reviews";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAdmin();

    const body = await request.json().catch(() => ({}));
    const response: string | null =
      typeof body?.staff_response === "string" &&
      body.staff_response.trim().length > 0
        ? body.staff_response.trim()
        : null;

    if (!response) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "staff_response is required" },
        { status: 400 }
      );
    }

    // staff_responded_by expects a UUID. The session user.id is a JWT subject (e.g. "newbook:123"),
    // so we leave it null until admin_users provides a real local UUID.
    const respondedBy = user.role === "admin" ? null : null;

    const updated = (await sql`
      update reviews
      set staff_response = ${response},
          staff_responded_at = now(),
          staff_responded_by = ${respondedBy}
      where id = ${id}
      returning *
    `) as Array<Review>;

    if (updated.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Review>>(
      { data: updated[0], error: null },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    const status = msg === "Unauthorized" ? 401 : msg.includes("Forbidden") ? 403 : 500;
    if (status === 500) console.error("POST /api/admin/reviews/[id]/respond error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}
