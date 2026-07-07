import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { listInhouseBookings } from "@/lib/newbook/templates";
import { guestFacingError } from "@/lib/api-error";
import type { ApiResponse } from "@/types/index";

// GET /api/newbook/inhouse
// Current in-house guests for the staff email tool. Admin-only.
// (Holiday-only for now; multi-park `?park=` scoping comes later.)
export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const data = await listInhouseBookings();
    return NextResponse.json<ApiResponse<unknown[]>>({ data, error: null });
  } catch (error) {
    console.error("GET /api/newbook/inhouse error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: guestFacingError(error, "Could not load in-house guests.") },
      { status: 502 }
    );
  }
}
