import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin, getCurrentProperty } from "@/lib/session";
import type { ApiResponse } from "@/types/index";

export interface ParkSettings {
  wifi_network: string | null;
  wifi_password: string | null;
  wifi_note: string | null;
}

const EMPTY: ParkSettings = {
  wifi_network: null,
  wifi_password: null,
  wifi_note: null,
};

export async function GET() {
  try {
    await requireAdmin();
    const property = await getCurrentProperty();

    const rows = (await sql`
      select wifi_network, wifi_password, wifi_note
      from park_settings
      where property_id = ${property.id}
      limit 1
    `) as ParkSettings[];

    return NextResponse.json<ApiResponse<ParkSettings>>(
      { data: rows[0] ?? EMPTY, error: null },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load settings";
    const status = msg.includes("Forbidden") ? 403 : msg.includes("Unauthorized") ? 401 : 500;
    if (status === 500) console.error("GET /api/admin/park-settings error:", error);
    return NextResponse.json<ApiResponse<null>>({ data: null, error: msg }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const property = await getCurrentProperty();

    const body = (await request.json().catch(() => ({}))) as Partial<ParkSettings>;
    const clean = (v: unknown): string | null => {
      if (typeof v !== "string") return null;
      const t = v.trim();
      return t.length ? t : null;
    };
    const wifiNetwork = clean(body.wifi_network);
    const wifiPassword = clean(body.wifi_password);
    const wifiNote = clean(body.wifi_note);

    const rows = (await sql`
      insert into park_settings (property_id, wifi_network, wifi_password, wifi_note, updated_at)
      values (${property.id}, ${wifiNetwork}, ${wifiPassword}, ${wifiNote}, now())
      on conflict (property_id) do update set
        wifi_network = excluded.wifi_network,
        wifi_password = excluded.wifi_password,
        wifi_note = excluded.wifi_note,
        updated_at = now()
      returning wifi_network, wifi_password, wifi_note
    `) as ParkSettings[];

    return NextResponse.json<ApiResponse<ParkSettings>>(
      { data: rows[0], error: null },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to save settings";
    const status = msg.includes("Forbidden") ? 403 : msg.includes("Unauthorized") ? 401 : 500;
    if (status === 500) console.error("POST /api/admin/park-settings error:", error);
    return NextResponse.json<ApiResponse<null>>({ data: null, error: msg }, { status });
  }
}
