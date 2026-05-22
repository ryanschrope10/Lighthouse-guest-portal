import { NextResponse } from "next/server";
import { getDemoGuest, getProperty } from "@/lib/newbook/data";
import { getServedDocs } from "@/lib/legal-docs";
import { addAck } from "@/lib/portal-store";
import { requestProof } from "@/lib/request-proof";
import type { ApiResponse } from "@/types";

export async function POST(request: Request) {
  try {
    const { docId } = await request.json();
    if (!docId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "docId is required" },
        { status: 400 },
      );
    }

    const property = getProperty();
    const guest = await getDemoGuest();
    if (!guest) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "No guest record found" },
        { status: 404 },
      );
    }

    const exists = getServedDocs(property.slug).some((d) => d.id === docId);
    if (!exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Document not found" },
        { status: 404 },
      );
    }

    const { ip, userAgent } = requestProof(request);
    const record = await addAck({
      guestId: guest.id,
      servedDocId: docId,
      ip,
      userAgent,
    });

    return NextResponse.json<ApiResponse<typeof record>>(
      { data: record, error: null },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/documents/served/ack error:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : "Failed to acknowledge document",
      },
      { status: 502 },
    );
  }
}
