import { NextResponse } from "next/server";
import { getDemoGuest, getProperty } from "@/lib/newbook/data";
import { getServedDocs } from "@/lib/legal-docs";
import { listAcks } from "@/lib/portal-store";
import { guestFacingError } from "@/lib/api-error";
import type { ApiResponse } from "@/types";
import type { ServedPayload, ServedDocStatus } from "@/lib/documents-types";

export async function GET() {
  try {
    const property = getProperty();
    const guest = await getDemoGuest();
    if (!guest) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "No guest record found" },
        { status: 404 },
      );
    }

    const docs = getServedDocs(property.slug);
    const acks = await listAcks(guest.id);

    const documents: ServedDocStatus[] = docs
      .map((d) => {
        const ack = acks.find((a) => a.servedDocId === d.id);
        return {
          ...d,
          acknowledged: !!ack,
          acknowledgedAt: ack?.acknowledgedAt ?? null,
        };
      })
      .sort(
        (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
      );

    return NextResponse.json<ApiResponse<ServedPayload>>(
      {
        data: {
          documents,
          outstandingCount: documents.filter((d) => !d.acknowledged).length,
        },
        error: null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/documents/served error:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: guestFacingError(error, "We couldn’t load your documents."),
      },
      { status: 502 },
    );
  }
}
