import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentProperty } from "@/lib/session";
import type { EventContent } from "@/types/events";
import type { ApiResponse } from "@/types/index";

export async function GET(request: NextRequest) {
  try {
    const upcoming = request.nextUrl.searchParams.get("upcoming") === "true";
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Math.max(1, Math.min(50, Number(limitParam))) : null;

    const property = await getCurrentProperty();

    const nowIso = new Date().toISOString();
    const rows = upcoming
      ? (limit
          ? (await sql`
              select id, property_id, type, title, body, media_url, external_url, location,
                     starts_at, ends_at, schedule, sort_order, active, created_at
              from property_content
              where property_id = ${property.id}
                and active = true
                and type in ('event','schedule')
                and (ends_at >= ${nowIso} or starts_at >= ${nowIso})
              order by starts_at asc nulls last
              limit ${limit}
            `)
          : (await sql`
              select id, property_id, type, title, body, media_url, external_url, location,
                     starts_at, ends_at, schedule, sort_order, active, created_at
              from property_content
              where property_id = ${property.id}
                and active = true
                and type in ('event','schedule')
                and (ends_at >= ${nowIso} or starts_at >= ${nowIso})
              order by starts_at asc nulls last
            `))
      : (limit
          ? (await sql`
              select id, property_id, type, title, body, media_url, external_url, location,
                     starts_at, ends_at, schedule, sort_order, active, created_at
              from property_content
              where property_id = ${property.id}
                and active = true
                and type in ('event','schedule')
              order by starts_at asc nulls last
              limit ${limit}
            `)
          : (await sql`
              select id, property_id, type, title, body, media_url, external_url, location,
                     starts_at, ends_at, schedule, sort_order, active, created_at
              from property_content
              where property_id = ${property.id}
                and active = true
                and type in ('event','schedule')
              order by starts_at asc nulls last
            `));

    return NextResponse.json<ApiResponse<EventContent[]>>(
      { data: rows as EventContent[], error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: error instanceof Error ? error.message : "Failed to load events",
      },
      { status: 500 }
    );
  }
}
