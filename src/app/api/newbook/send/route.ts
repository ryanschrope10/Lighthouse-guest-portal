import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { sendContactTemplate, type SendVia } from "@/lib/newbook/templates";
import { guestFacingError } from "@/lib/api-error";
import type { ApiResponse } from "@/types/index";

// POST /api/newbook/send
// Body: { templateId, dataId, dataType?, sendVia? }
// Asks Newbook to SEND a templated email for a booking (real outbound).
// Admin-only — this triggers a real guest email.
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: "Forbidden" },
      { status: 403 }
    );
  }

  let body: {
    templateId?: string;
    dataId?: string;
    dataType?: string;
    sendVia?: SendVia;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.templateId || !body.dataId) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: "templateId and dataId are required" },
      { status: 400 }
    );
  }

  try {
    const data = await sendContactTemplate({
      templateId: body.templateId,
      dataId: body.dataId,
      dataType: body.dataType,
      sendVia: body.sendVia,
    });
    return NextResponse.json<ApiResponse<unknown>>({ data, error: null });
  } catch (error) {
    console.error("POST /api/newbook/send error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: guestFacingError(error, "Could not send the email.") },
      { status: 502 }
    );
  }
}
