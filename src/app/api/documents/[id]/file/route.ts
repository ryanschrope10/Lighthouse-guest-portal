import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentGuest } from '@/lib/session';

// GET /api/documents/[id]/file
// Streams the signed-in guest's OWN uploaded document bytes (ownership-scoped).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guest = await getCurrentGuest();
  if (!guest) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const rows = (await sql`
    select file_data, content_type, file_path
    from guest_documents
    where id = ${id} and guest_id = ${guest.id}
    limit 1
  `) as {
    file_data: string | null;
    content_type: string | null;
    file_path: string | null;
  }[];

  const row = rows[0];
  if (!row || !row.file_data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const bytes = new Uint8Array(Buffer.from(row.file_data, 'base64'));
  const fileName = (row.file_path || 'document').replace(/["\r\n]/g, '');
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': row.content_type || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
