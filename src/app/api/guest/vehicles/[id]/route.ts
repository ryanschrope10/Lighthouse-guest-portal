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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guest = await getCurrentGuest();

    if (!guest) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const rows = (await sql`
      select id, guest_id, property_id, type, make, model, year,
             license_plate, length_ft, details, created_at
      from guest_vehicles
      where id = ${id} and guest_id = ${guest.id}
      limit 1
    `) as VehicleRow[];

    if (rows.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Vehicle>>(
      { data: toVehicle(rows[0]), error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/guest/vehicles/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guest = await getCurrentGuest();

    if (!guest) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    if (body?.type && !VALID_TYPES.includes(body.type)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: `Invalid vehicle type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Only overwrite a column when the caller supplied that field; ownership
    // is enforced by the guest_id filter so a guest can't edit another's row.
    const hasType = 'type' in body;
    const hasMake = 'make' in body;
    const hasModel = 'model' in body;
    const hasYear = 'year' in body;
    const hasPlate = 'license_plate' in body;
    const hasLength = 'length_ft' in body;
    const hasDetails = 'details' in body;
    const detailsJson = hasDetails ? JSON.stringify(body.details ?? {}) : null;

    const rows = (await sql`
      update guest_vehicles set
        type          = case when ${hasType}    then ${body.type ?? null} else type end,
        make          = case when ${hasMake}    then ${body.make ?? null} else make end,
        model         = case when ${hasModel}   then ${body.model ?? null} else model end,
        year          = case when ${hasYear}    then ${body.year ?? null} else year end,
        license_plate = case when ${hasPlate}   then ${body.license_plate ?? null} else license_plate end,
        length_ft     = case when ${hasLength}  then ${body.length_ft ?? null} else length_ft end,
        details       = case when ${hasDetails} then ${detailsJson}::jsonb else details end
      where id = ${id} and guest_id = ${guest.id}
      returning id, guest_id, property_id, type, make, model, year,
                license_plate, length_ft, details, created_at
    `) as VehicleRow[];

    if (rows.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Vehicle>>(
      { data: toVehicle(rows[0]), error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/guest/vehicles/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guest = await getCurrentGuest();

    if (!guest) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const rows = (await sql`
      delete from guest_vehicles
      where id = ${id} and guest_id = ${guest.id}
      returning id
    `) as Array<{ id: string }>;

    if (rows.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ deleted: string }>>(
      { data: { deleted: id }, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/guest/vehicles/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
