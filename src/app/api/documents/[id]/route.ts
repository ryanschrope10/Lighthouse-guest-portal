import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentGuest } from '@/lib/session';
import { guestFacingError } from '@/lib/api-error';
import type { GuestDocument, ApiResponse } from '@/types';

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
      select id, guest_id, property_id, type, label, file_path,
             expires_at, uploaded_at, verified_by, verified_at
      from guest_documents
      where id = ${id} and guest_id = ${guest.id}
      limit 1
    `) as DocumentRow[];

    if (rows.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<GuestDocument>>(
      { data: toDocument(rows[0]), error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/documents/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: guestFacingError(error) },
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

    // Ownership-scoped delete: only rows belonging to the current guest.
    const rows = (await sql`
      delete from guest_documents
      where id = ${id} and guest_id = ${guest.id}
      returning id
    `) as Array<{ id: string }>;

    if (rows.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ deleted: string }>>(
      { data: { deleted: id }, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/documents/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: guestFacingError(error) },
      { status: 500 }
    );
  }
}
