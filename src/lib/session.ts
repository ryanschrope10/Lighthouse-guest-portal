import { cookies } from 'next/headers';
import { verifyToken } from './auth';
import { sql } from './db';

const COOKIE_NAME = 'auth-token';

export interface SessionUser {
  userId: string;
  email: string;
  role: string;
  newbookGuestId: string | null;
}

export interface CurrentGuest {
  id: string;                // UUID in the guests table
  newbook_guest_id: string;
  property_id: string;       // UUID of the resolved property
  email: string | null;
}

/** Read the JWT cookie. Returns null if missing/invalid. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const newbookGuestId = payload.userId.startsWith('newbook:')
    ? payload.userId.slice('newbook:'.length)
    : null;
  return { ...payload, newbookGuestId };
}

export async function requireSession(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new Error('Unauthorized');
  return u;
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireSession();
  if (u.role !== 'admin') throw new Error('Forbidden: admin only');
  return u;
}

/**
 * Return (or lazily provision) the demo property. Single-property demo mode:
 * one Holiday Motel row whose slug is 'holiday'.
 */
export async function getCurrentProperty(): Promise<{ id: string; slug: string; name: string }> {
  const existing = await sql`
    select id, slug, name from properties where slug = 'holiday' limit 1
  ` as Array<{ id: string; slug: string; name: string }>;
  if (existing.length > 0) return existing[0];
  const created = await sql`
    insert into properties (name, slug, branding, contact_info)
    values ('Holiday Motel', 'holiday', '{}'::jsonb, '{}'::jsonb)
    returning id, slug, name
  ` as Array<{ id: string; slug: string; name: string }>;
  return created[0];
}

/**
 * Resolve (or lazily provision) the logged-in guest's row. Keyed by the
 * Newbook guest id carried in the JWT.
 */
export async function getCurrentGuest(): Promise<CurrentGuest | null> {
  const user = await getSessionUser();
  if (!user || !user.newbookGuestId) return null;
  const property = await getCurrentProperty();

  const existing = await sql`
    select id, newbook_guest_id, email
    from guests
    where newbook_guest_id = ${user.newbookGuestId}
    limit 1
  ` as Array<{ id: string; newbook_guest_id: string; email: string | null }>;

  let row = existing[0];
  if (!row) {
    const created = await sql`
      insert into guests (newbook_guest_id, email)
      values (${user.newbookGuestId}, ${user.email})
      returning id, newbook_guest_id, email
    ` as Array<{ id: string; newbook_guest_id: string; email: string | null }>;
    row = created[0];
  }

  // Ensure the guest is linked to the demo property.
  await sql`
    insert into guest_properties (guest_id, property_id, newbook_guest_id)
    values (${row.id}, ${property.id}, ${user.newbookGuestId})
    on conflict do nothing
  `;

  return { ...row, property_id: property.id };
}

export async function requireGuest(): Promise<CurrentGuest> {
  const g = await getCurrentGuest();
  if (!g) throw new Error('Unauthorized');
  return g;
}
