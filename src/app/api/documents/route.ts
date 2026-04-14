import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { GuestDocument, ApiResponse } from '@/types';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Replace with real Supabase query
    // const { data: guest } = await supabase
    //   .from('guests')
    //   .select('id')
    //   .eq('auth_user_id', user.id)
    //   .single();
    //
    // const { data: documents, error } = await supabase
    //   .from('guest_documents')
    //   .select('*')
    //   .eq('guest_id', guest.id)
    //   .order('uploaded_at', { ascending: false });
    //
    // // Generate signed URLs for each document
    // for (const doc of documents) {
    //   const { data: urlData } = await supabase.storage
    //     .from('guest-documents')
    //     .createSignedUrl(doc.file_path, 3600);
    //   doc.file_url = urlData?.signedUrl;
    // }

    const mockDocuments: GuestDocument[] = [
      {
        id: 'doc-001',
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
      },
      {
        id: 'doc-002',
        guest_id: 'guest-001',
        property_id: 'property-001',
        type: 'registration',
        label: 'Vehicle Registration',
        file_path: 'guest-001/registration/rv-reg-2025.pdf',
        file_url: 'https://placeholder.storage/signed-url/registration.pdf',
        expires_at: '2026-03-01T00:00:00Z',
        uploaded_at: '2025-05-01T10:05:00Z',
        verified_by: 'admin-001',
        verified_at: '2025-05-02T09:00:00Z',
      },
      {
        id: 'doc-003',
        guest_id: 'guest-001',
        property_id: 'property-001',
        type: 'signed_agreement',
        label: 'Park Rules Agreement',
        file_path: 'guest-001/agreements/park-rules-signed.pdf',
        file_url: 'https://placeholder.storage/signed-url/agreement.pdf',
        expires_at: null,
        uploaded_at: '2025-05-15T14:30:00Z',
        verified_by: 'admin-001',
        verified_at: '2025-05-15T15:00:00Z',
      },
    ];

    return NextResponse.json<ApiResponse<GuestDocument[]>>(
      { data: mockDocuments, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/documents error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;
    const label = formData.get('label') as string | null;
    const propertyId = formData.get('property_id') as string | null;
    const expiresAt = formData.get('expires_at') as string | null;

    if (!file) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'File is required' },
        { status: 400 }
      );
    }

    const validTypes = ['insurance', 'registration', 'license', 'signed_agreement'];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: `type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'File size must be under 10MB' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'File must be a PDF, JPEG, PNG, or WebP image' },
        { status: 400 }
      );
    }

    // TODO: Replace with real Supabase Storage + DB logic
    // const { data: guest } = await supabase
    //   .from('guests')
    //   .select('id')
    //   .eq('auth_user_id', user.id)
    //   .single();
    //
    // const filePath = `${guest.id}/${type}/${Date.now()}-${file.name}`;
    //
    // const { error: uploadError } = await supabase.storage
    //   .from('guest-documents')
    //   .upload(filePath, file);
    //
    // const { data: doc, error } = await supabase
    //   .from('guest_documents')
    //   .insert({
    //     guest_id: guest.id,
    //     property_id: propertyId,
    //     type,
    //     label,
    //     file_path: filePath,
    //     expires_at: expiresAt,
    //   })
    //   .select()
    //   .single();

    const mockDocument: GuestDocument = {
      id: `doc-${Date.now()}`,
      guest_id: 'guest-001',
      property_id: propertyId ?? 'property-001',
      type: type as GuestDocument['type'],
      label: label ?? file.name,
      file_path: `guest-001/${type}/${Date.now()}-${file.name}`,
      file_url: `https://placeholder.storage/signed-url/${file.name}`,
      expires_at: expiresAt,
      uploaded_at: new Date().toISOString(),
      verified_by: null,
      verified_at: null,
    };

    return NextResponse.json<ApiResponse<GuestDocument>>(
      { data: mockDocument, error: null },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/documents error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
