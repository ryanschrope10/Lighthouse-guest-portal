// ============================================================
// Newbook guest lookup (server-only)
// ============================================================
// Used to link a portal signup to the right Newbook guest by
// email. `guests_list` accepts a `search` term (matches email,
// name, etc.); we then require an EXACT email match among the
// results so we never link the wrong person.
// ============================================================

import { createNewBookClient } from './client';
import type { NewBookGuest } from './types';

function guestEmail(g: NewBookGuest): string | null {
  const hit = (g.contact_details ?? []).find(
    (c) => c.type?.toLowerCase() === 'email' && c.content
  );
  return hit?.content ?? null;
}

/**
 * Find the Newbook guest whose email exactly matches `email`, or
 * null if there's no match. Case-insensitive.
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

  return (
    results.find((g) => guestEmail(g)?.trim().toLowerCase() === norm) ?? null
  );
}
