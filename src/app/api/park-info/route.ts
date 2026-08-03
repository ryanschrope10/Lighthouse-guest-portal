import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentGuest } from "@/lib/session";
import type { ApiResponse } from "@/types/index";

export interface ParkInfo {
  wifi_network: string | null;
  wifi_password: string | null;
  wifi_note: string | null;
}

// Guest-facing park info (Wi-Fi, etc.) the front desk controls via the admin
// park settings. Scoped to the signed-in guest's property; the password is
// only ever returned to an authenticated guest.
export async function GET() {
  try {
    const guest = await getCurrentGuest();
    if (!guest) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const rows = (await sql`
      select wifi_network, wifi_password, wifi_note
      from park_settings
      where property_id = ${guest.property_id}
      limit 1
    `) as ParkInfo[];

    return NextResponse.json<ApiResponse<ParkInfo>>(
      {
        data: rows[0] ?? { wifi_network: null, wifi_password: null, wifi_note: null },
        error: null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/park-info error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: "Failed to load park info" },
      { status: 500 }
    );
  }
}
