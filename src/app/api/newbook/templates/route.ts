import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { listContactTemplates } from "@/lib/newbook/templates";
import { guestFacingError } from "@/lib/api-error";
import type { ApiResponse } from "@/types/index";

// GET /api/newbook/templates
// The template picker for the staff email tool. Admin-only.
export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const data = await listContactTemplates();
    return NextResponse.json<ApiResponse<unknown[]>>({ data, error: null });
  } catch (error) {
    console.error("GET /api/newbook/templates error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: guestFacingError(error, "Could not load templates.") },
      { status: 502 }
    );
  }
}
