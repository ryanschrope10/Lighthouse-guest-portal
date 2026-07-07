import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getContactTemplate } from "@/lib/newbook/templates";
import { guestFacingError } from "@/lib/api-error";
import type { ApiResponse } from "@/types/index";

// GET /api/newbook/template?id=<templateId>
// Fetch one template's definition (raw content, unresolved merge tags). Admin-only.
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: "Forbidden" },
      { status: 403 }
    );
  }

  const templateId = new URL(request.url).searchParams.get("id");
  if (!templateId) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: "Missing template id" },
      { status: 400 }
    );
  }

  try {
    const data = await getContactTemplate(templateId);
    return NextResponse.json<ApiResponse<unknown>>({ data, error: null });
  } catch (error) {
    console.error("GET /api/newbook/template error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: guestFacingError(error, "Could not load template preview.") },
      { status: 502 }
    );
  }
}
