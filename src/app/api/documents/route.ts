import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentGuest } from '@/lib/session';
import { guestFacingError } from '@/lib/api-error';
import type { GuestDocument, ApiResponse } from '@/types';

const VALID_TYPES: GuestDocument['type'][] = [
  'insurance',
  'registration',
  'license',
  'signed_agreement',
];

interface DocumentRow {
  id: string;
  guest_id: string;
  property_id: string;
  type: GuestDocument['type'];
  label: string | null;
  file_path: string;
  expires_at: string | null;
  uploaded_at: string;
  verified_by: string | null;
  verified_at: string | null;
}

function toDocument(row: DocumentRow): GuestDocument {
  return {
    id: row.id,
    guest_id: row.guest_id,
    property_id: row.property_id,
    type: row.type,
    label: row.label,
    file_path: row.file_path,
    expires_at: row.expires_at,
    uploaded_at: row.uploaded_at,
    verified_by: row.verified_by,
    verified_at: row.verified_at,
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
      select id, guest_id, property_id, type, label, file_path,
             expires_at, uploaded_at, verified_by, verified_at
      from guest_documents
      where guest_id = ${guest.id}
      order by uploaded_at desc
    `) as DocumentRow[];

    return NextResponse.json<ApiResponse<GuestDocument[]>>(
      { data: rows.map(toDocument), error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/documents error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: guestFacingError(error) },
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

    const type = body?.type as string | undefined;
    if (!type || !VALID_TYPES.includes(type as GuestDocument['type'])) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: `type must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const fileName = typeof body?.file_name === 'string' ? body.file_name.trim() : '';
    if (!fileName) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'file_name is required' },
        { status: 400 }
      );
    }

    const label = typeof body?.label === 'string' && body.label.trim() ? body.label.trim() : fileName;

    // Normalize expiry to an ISO timestamp (or null).
    let expiresAt: string | null = null;
    if (body?.expires_at) {
      const parsed = new Date(body.expires_at);
      if (!Number.isNaN(parsed.getTime())) {
        expiresAt = parsed.toISOString();
      }
    }

    // NOTE: This track has no blob/file storage configured, so we persist
    // document METADATA only. file_path records the original file name for
    // reference; the actual file bytes are not stored anywhere yet.
    const rows = (await sql`
      insert into guest_documents
        (guest_id, property_id, type, label, file_path, expires_at)
      values (
        ${guest.id}, ${guest.property_id}, ${type},
        ${label}, ${fileName}, ${expiresAt}
      )
      returning id, guest_id, property_id, type, label, file_path,
                expires_at, uploaded_at, verified_by, verified_at
    `) as DocumentRow[];

    return NextResponse.json<ApiResponse<GuestDocument>>(
      { data: toDocument(rows[0]), error: null },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/documents error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: guestFacingError(error) },
      { status: 500 }
    );
  }
}
