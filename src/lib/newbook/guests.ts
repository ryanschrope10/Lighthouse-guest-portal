// ============================================================
// Newbook guest lookup (server-only)
// ============================================================
// Used to link a portal signup to the right Newbook guest by
// email. `guests_list` accepts a `search` term (matches email,
// name, etc.); we then require an EXACT match against ANY of the
// guest's email addresses so we never link the wrong person, but
// still accept a guest who registers with a secondary email.
// ============================================================

import { createNewBookClient } from './client';
import type { NewBookGuest } from './types';

/** All email addresses on a guest (a guest can have more than one). */
function guestEmails(g: NewBookGuest): string[] {
  return (g.contact_details ?? [])
    .filter((c) => c.type?.toLowerCase() === 'email' && c.content)
    .map((c) => String(c.content).trim().toLowerCase());
}

/**
 * Find the Newbook guest who has `email` among their contacts, or
 * null if there's no match. Case-insensitive; matches any of the
 * guest's email addresses.
 */
export async function findNewbookGuestByEmail(
  email: string
): Promise<NewBookGuest | null> {
  const norm = email.trim().toLowerCase();
  if (!norm) return null;

  const client = createNewBookClient();
  const results = await client.request<NewBookGuest[]>('guests_list', {
    search: norm,
  });
  if (!Array.isArray(results)) return null;

  return results.find((g) => guestEmails(g).includes(norm)) ?? null;
}
