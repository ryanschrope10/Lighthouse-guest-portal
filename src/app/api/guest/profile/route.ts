import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getDemoGuest, NoLinkedGuestError } from '@/lib/newbook/data';
import { getCurrentGuest } from '@/lib/session';
import { guestFacingError } from '@/lib/api-error';
import type { Guest, GuestAddress, GuestPreferences, ApiResponse } from '@/types';

export async function GET() {
  try {
    const guest = await getDemoGuest();

    if (!guest) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'No guest record found in Newbook' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Guest>>(
      { data: guest, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/guest/profile error:', error);
    if (error instanceof NoLinkedGuestError) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: guestFacingError(error, 'We couldn’t load your profile.'),
      },
      { status: 502 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const guest = await getCurrentGuest();

    if (!guest) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate that the request body contains at least one updatable field
    const allowedFields = [
      'first_name', 'last_name', 'phone', 'address', 'preferences',
    ];
    const updateKeys = Object.keys(body ?? {});
    const hasValidField = updateKeys.some((key) => allowedFields.includes(key));

    if (!hasValidField) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Only overwrite a column when the caller supplied that field; otherwise
    // keep the existing value (guarded per-column by a `case when` in SQL).
    const hasFirstName = 'first_name' in body;
    const hasLastName = 'last_name' in body;
    const hasPhone = 'phone' in body;
    const hasAddress = 'address' in body;
    const hasPreferences = 'preferences' in body;

    const addressJson = hasAddress ? JSON.stringify(body.address ?? {}) : null;
    const preferencesJson = hasPreferences
      ? JSON.stringify(body.preferences ?? {})
      : null;

    const rows = (await sql`
      update guests set
        first_name  = case when ${hasFirstName} then ${body.first_name ?? null} else first_name end,
        last_name   = case when ${hasLastName}  then ${body.last_name ?? null} else last_name end,
        phone       = case when ${hasPhone}     then ${body.phone ?? null} else phone end,
        address     = case when ${hasAddress}   then ${addressJson}::jsonb else address end,
        preferences = case when ${hasPreferences} then ${preferencesJson}::jsonb else preferences end,
        updated_at  = now()
      where id = ${guest.id}
      returning id, newbook_guest_id, email, first_name, last_name, phone,
                address, preferences, created_at, updated_at
    `) as Array<{
      id: string;
      newbook_guest_id: string | null;
      email: string | null;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
      address: GuestAddress | null;
      preferences: GuestPreferences | null;
      created_at: string;
      updated_at: string;
    }>;

    const row = rows[0];
    if (!row) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Guest not found' },
        { status: 404 }
      );
    }

    const updatedGuest: Guest = {
      id: row.id,
      auth_user_id: row.newbook_guest_id ? `newbook:${row.newbook_guest_id}` : '',
      newbook_guest_id: row.newbook_guest_id,
      email: row.email ?? '',
      first_name: row.first_name,
      last_name: row.last_name,
      phone: row.phone,
      address: row.address ?? {},
      preferences: row.preferences ?? {},
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    return NextResponse.json<ApiResponse<Guest>>(
      { data: updatedGuest, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/guest/profile error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
