import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireSession } from "@/lib/session";
import type { EventContent, EventInput } from "@/types/events";
import type { ApiResponse } from "@/types/index";

const ALLOWED_TYPES = new Set(["event", "schedule"]);

interface SanitizedInsert {
  type: string;
  title: string;
  body: string | null;
  media_url: string | null;
  external_url: string | null;
  location: string | null;
  starts_at: string | null;
  ends_at: string | null;
  schedule: unknown;
  sort_order: number;
  active: boolean;
  property_id: string;
}

function sanitize(input: Partial<EventInput>): SanitizedInsert {
  return {
    type: input.type ?? "event",
    title: input.title ?? "",
    body: input.body ?? null,
    media_url: input.media_url ?? null,
    external_url: input.external_url ?? null,
    location: input.location ?? null,
    starts_at: input.starts_at ?? null,
    ends_at: input.ends_at ?? null,
    schedule: input.schedule ?? null,
    sort_order: input.sort_order ?? 0,
    active: input.active ?? true,
    property_id: input.property_id ?? "",
  };
}

export async function GET(request: NextRequest) {
  try {
    // TODO: enforce admin role once admin login exists
    await requireSession();

    const propertyId = request.nextUrl.searchParams.get("property_id");

    const rows = propertyId
      ? (await sql`
          select id, property_id, type, title, body, media_url, external_url, location,
                 starts_at, ends_at, schedule, sort_order, active, created_at
          from property_content
          where type in ('event','schedule') and property_id = ${propertyId}
          order by starts_at asc nulls last
        `)
      : (await sql`
          select id, property_id, type, title, body, media_url, external_url, location,
                 starts_at, ends_at, schedule, sort_order, active, created_at
          from property_content
          where type in ('event','schedule')
          order by starts_at asc nulls last
        `);

    return NextResponse.json<ApiResponse<EventContent[]>>(
      { data: rows as EventContent[], error: null },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load events";
    const status = msg.includes("Forbidden") ? 403 : msg.includes("Unauthorized") ? 401 : 500;
    if (status === 500) console.error("GET /api/admin/events error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: enforce admin role once admin login exists
    await requireSession();

    const body = (await request.json()) as Partial<EventInput>;

    if (!body.title || !body.type || !ALLOWED_TYPES.has(body.type) || !body.property_id) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Missing required fields: type, title, property_id" },
        { status: 400 }
      );
    }

    const p = sanitize(body);
    const inserted = (await sql`
      insert into property_content (
        type, title, body, media_url, external_url, location,
        starts_at, ends_at, schedule, sort_order, active, property_id
      )
      values (
        ${p.type}, ${p.title}, ${p.body}, ${p.media_url}, ${p.external_url}, ${p.location},
        ${p.starts_at}, ${p.ends_at}, ${JSON.stringify(p.schedule)}::jsonb,
        ${p.sort_order}, ${p.active}, ${p.property_id}
      )
      returning id, property_id, type, title, body, media_url, external_url, location,
                starts_at, ends_at, schedule, sort_order, active, created_at
    `) as Array<EventContent>;

    return NextResponse.json<ApiResponse<EventContent>>(
      { data: inserted[0], error: null },
      { status: 201 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create event";
    const status = msg.includes("Forbidden") ? 403 : msg.includes("Unauthorized") ? 401 : 500;
    if (status === 500) console.error("POST /api/admin/events error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}
