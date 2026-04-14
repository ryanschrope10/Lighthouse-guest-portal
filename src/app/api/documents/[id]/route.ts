import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { GuestDocument, ApiResponse } from '@/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // TODO: Replace with real Supabase query
    // const { data: guest } = await supabase
    //   .from('guests')
    //   .select('id')
    //   .eq('auth_user_id', user.id)
    //   .single();
    //
    // const { data: doc, error } = await supabase
    //   .from('guest_documents')
    //   .select('*')
    //   .eq('id', id)
    //   .eq('guest_id', guest.id)
    //   .single();
    //
    // // Generate a fresh signed URL
    // const { data: urlData } = await supabase.storage
    //   .from('guest-documents')
    //   .createSignedUrl(doc.file_path, 3600);
    // doc.file_url = urlData?.signedUrl;

    const mockDocument: GuestDocument = {
      id,
      guest_id: 'guest-001',
      property_id: 'property-001',
      type: 'insurance',
      label: 'RV Insurance Policy',
      file_path: 'guest-001/insurance/policy-2025.pdf',
      file_url: 'https://placeholder.storage/signed-url/insurance.pdf',
      expires_at: '2026-01-15T00:00:00Z',
      uploaded_at: '2025-05-01T10:00:00Z',
      verified_by: null,
      verified_at: null,
    };

    return NextResponse.json<ApiResponse<GuestDocument>>(
      { data: mockDocument, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/documents/[id] error:', error);
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // TODO: Replace with real Supabase query
    // const { data: guest } = await supabase
    //   .from('guests')
    //   .select('id')
    //   .eq('auth_user_id', user.id)
    //   .single();
    //
    // // Get doc first to find file path
    // const { data: doc } = await supabase
    //   .from('guest_documents')
    //   .select('file_path')
    //   .eq('id', id)
    //   .eq('guest_id', guest.id)
    //   .single();
    //
    // // Delete from storage
    // await supabase.storage
    //   .from('guest-documents')
    //   .remove([doc.file_path]);
    //
    // // Delete from database
    // const { error } = await supabase
    //   .from('guest_documents')
    //   .delete()
    //   .eq('id', id)
    //   .eq('guest_id', guest.id);

    return NextResponse.json<ApiResponse<{ deleted: string }>>(
      { data: { deleted: id }, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/documents/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
