import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireSession } from "@/lib/session";
import type { EventContent, EventInput } from "@/types/events";
import type { ApiResponse } from "@/types/index";

const ALLOWED_TYPES = new Set(["event", "schedule"]);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = (await sql`
      select id, property_id, type, title, body, media_url, external_url, location,
             starts_at, ends_at, schedule, sort_order, active, created_at
      from property_content
      where id = ${id}
      limit 1
    `) as Array<EventContent>;

    if (rows.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<EventContent>>(
      { data: rows[0], error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/admin/events/[id] error:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: error instanceof Error ? error.message : "Failed to load event",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: enforce admin role once admin login exists
    await requireSession();

    const { id } = await params;
    const body = (await request.json()) as Partial<EventInput>;

    const existing = (await sql`
      select id, property_id, type, title, body, media_url, external_url, location,
             starts_at, ends_at, schedule, sort_order, active, created_at
      from property_content
      where id = ${id}
      limit 1
    `) as Array<EventContent>;

    if (existing.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Not found" },
        { status: 404 }
      );
    }

    const current = existing[0];
    const next = {
      type:
        body.type !== undefined && ALLOWED_TYPES.has(body.type)
          ? body.type
          : current.type,
      title: body.title !== undefined ? body.title : current.title,
      body: body.body !== undefined ? body.body || null : current.body,
      media_url:
        body.media_url !== undefined ? body.media_url || null : current.media_url,
      external_url:
        body.external_url !== undefined
          ? body.external_url || null
          : current.external_url,
      location:
        body.location !== undefined ? body.location || null : current.location,
      starts_at:
        body.starts_at !== undefined
          ? body.starts_at || null
          : current.starts_at,
      ends_at:
        body.ends_at !== undefined ? body.ends_at || null : current.ends_at,
      schedule:
        body.schedule !== undefined ? body.schedule ?? null : current.schedule,
      sort_order:
        body.sort_order !== undefined
          ? body.sort_order ?? 0
          : current.sort_order,
      active: body.active !== undefined ? !!body.active : current.active,
    };

    const updated = (await sql`
      update property_content set
        type = ${next.type},
        title = ${next.title},
        body = ${next.body},
        media_url = ${next.media_url},
        external_url = ${next.external_url},
        location = ${next.location},
        starts_at = ${next.starts_at},
        ends_at = ${next.ends_at},
        schedule = ${JSON.stringify(next.schedule)}::jsonb,
        sort_order = ${next.sort_order},
        active = ${next.active}
      where id = ${id}
      returning id, property_id, type, title, body, media_url, external_url, location,
                starts_at, ends_at, schedule, sort_order, active, created_at
    `) as Array<EventContent>;

    return NextResponse.json<ApiResponse<EventContent>>(
      { data: updated[0], error: null },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update event";
    const status = msg.includes("Forbidden") ? 403 : msg.includes("Unauthorized") ? 401 : 500;
    if (status === 500) console.error("PUT /api/admin/events/[id] error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: enforce admin role once admin login exists
    await requireSession();

    const { id } = await params;
    await sql`delete from property_content where id = ${id}`;

    return NextResponse.json<ApiResponse<{ id: string }>>(
      { data: { id }, error: null },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete event";
    const status = msg.includes("Forbidden") ? 403 : msg.includes("Unauthorized") ? 401 : 500;
    if (status === 500) console.error("DELETE /api/admin/events/[id] error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: msg },
      { status }
    );
  }
}
