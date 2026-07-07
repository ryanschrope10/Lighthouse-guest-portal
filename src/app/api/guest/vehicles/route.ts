import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentGuest } from '@/lib/session';
import type { Vehicle, ApiResponse } from '@/types';

const VALID_TYPES = ['rv', 'trailer', 'motorhome', 'vehicle', 'other'];

interface VehicleRow {
  id: string;
  guest_id: string;
  property_id: string;
  type: Vehicle['type'];
  make: string | null;
  model: string | null;
  year: number | null;
  license_plate: string | null;
  length_ft: number | string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

function toVehicle(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    guest_id: row.guest_id,
    property_id: row.property_id,
    type: row.type,
    make: row.make,
    model: row.model,
    year: row.year,
    license_plate: row.license_plate,
    length_ft: row.length_ft === null ? null : Number(row.length_ft),
    details: row.details ?? {},
    created_at: row.created_at,
  };
}

export async function GET() {
  try {
    const guest = await getCurrentGuest();

    if (!guest) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const rows = (await sql`
      select id, guest_id, property_id, type, make, model, year,
             license_plate, length_ft, details, created_at
      from guest_vehicles
      where guest_id = ${guest.id}
      order by created_at desc
    `) as VehicleRow[];

    return NextResponse.json<ApiResponse<Vehicle[]>>(
      { data: rows.map(toVehicle), error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/guest/vehicles error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const guest = await getCurrentGuest();

    if (!guest) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body?.type) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Vehicle type is required' },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(body.type)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: `Invalid vehicle type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const detailsJson = JSON.stringify(body.details ?? {});

    const rows = (await sql`
      insert into guest_vehicles
        (guest_id, property_id, type, make, model, year, license_plate, length_ft, details)
      values (
        ${guest.id}, ${guest.property_id}, ${body.type},
        ${body.make ?? null}, ${body.model ?? null}, ${body.year ?? null},
        ${body.license_plate ?? null}, ${body.length_ft ?? null}, ${detailsJson}::jsonb
      )
      returning id, guest_id, property_id, type, make, model, year,
                license_plate, length_ft, details, created_at
    `) as VehicleRow[];

    return NextResponse.json<ApiResponse<Vehicle>>(
      { data: toVehicle(rows[0]), error: null },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/guest/vehicles error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
