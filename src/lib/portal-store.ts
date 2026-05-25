// ============================================================
// Portal store (server-only, Neon Postgres-backed)
// ============================================================
//
// Real persistence for things Newbook doesn't own: Rules &
// Regulations signatures and served-document acknowledgments.
//
// Backed by Neon Postgres (tables: signatures, served_doc_acks;
// see supabase/migrations/neon_003_portal_store.sql). Previously
// file-backed under .data/, but Render's filesystem is ephemeral
// and wiped on deploy, so signatures vanished. The surface here is
// a small repository, so the storage swap is behind these
// functions — callers don't change.
// ============================================================

import { sql } from "@/lib/db";

/** A recorded Rules & Regulations signature (clickwrap). */
export interface SignatureRecord {
  id: string;
  guestId: string;
  bookingId: string;
  docId: string;
  docVersion: string;
  fullName: string;
  signedAt: string;
  ip: string;
  userAgent: string;
}

/** Proof a guest viewed/acknowledged a served document. */
export interface AckRecord {
  id: string;
  guestId: string;
  servedDocId: string;
  acknowledgedAt: string;
  ip: string;
  userAgent: string;
}

// ---- Row shapes (snake_case as returned from Postgres) ----

interface SignatureRow {
  id: string;
  guest_id: string;
  booking_id: string;
  doc_id: string;
  doc_version: string;
  full_name: string;
  signed_at: string | Date;
  ip: string | null;
  user_agent: string | null;
}

interface AckRow {
  id: string;
  guest_id: string;
  served_doc_id: string;
  acknowledged_at: string | Date;
  ip: string | null;
  user_agent: string | null;
}

function toISO(v: string | Date): string {
  return v instanceof Date ? v.toISOString() : new Date(v).toISOString();
}

function mapSignature(row: SignatureRow): SignatureRecord {
  return {
    id: row.id,
    guestId: row.guest_id,
    bookingId: row.booking_id,
    docId: row.doc_id,
    docVersion: row.doc_version,
    fullName: row.full_name,
    signedAt: toISO(row.signed_at),
    ip: row.ip ?? "",
    userAgent: row.user_agent ?? "",
  };
}

function mapAck(row: AckRow): AckRecord {
  return {
    id: row.id,
    guestId: row.guest_id,
    servedDocId: row.served_doc_id,
    acknowledgedAt: toISO(row.acknowledged_at),
    ip: row.ip ?? "",
    userAgent: row.user_agent ?? "",
  };
}

// ---- Signatures ----

export async function listSignatures(
  guestId: string,
): Promise<SignatureRecord[]> {
  const rows = (await sql`
    select id, guest_id, booking_id, doc_id, doc_version, full_name,
           signed_at, ip, user_agent
    from signatures
    where guest_id = ${guestId}
    order by signed_at asc
  `) as SignatureRow[];
  return rows.map(mapSignature);
}

export async function addSignature(
  rec: Omit<SignatureRecord, "id" | "signedAt">,
): Promise<SignatureRecord> {
  // Idempotent on (guest_id, booking_id, doc_version): if a signature for
  // this booking + doc version already exists, keep the original record
  // (do-nothing update) and return it rather than creating a duplicate.
  const rows = (await sql`
    insert into signatures
      (guest_id, booking_id, doc_id, doc_version, full_name, ip, user_agent)
    values
      (${rec.guestId}, ${rec.bookingId}, ${rec.docId}, ${rec.docVersion},
       ${rec.fullName}, ${rec.ip}, ${rec.userAgent})
    on conflict (guest_id, booking_id, doc_version) do update
      set guest_id = signatures.guest_id
    returning id, guest_id, booking_id, doc_id, doc_version, full_name,
              signed_at, ip, user_agent
  `) as SignatureRow[];
  return mapSignature(rows[0]);
}

// ---- Served-document acknowledgments ----

export async function listAcks(guestId: string): Promise<AckRecord[]> {
  const rows = (await sql`
    select id, guest_id, served_doc_id, acknowledged_at, ip, user_agent
    from served_doc_acks
    where guest_id = ${guestId}
    order by acknowledged_at asc
  `) as AckRow[];
  return rows.map(mapAck);
}

export async function addAck(
  rec: Omit<AckRecord, "id" | "acknowledgedAt">,
): Promise<AckRecord> {
  // Acknowledgment is idempotent on (guest_id, served_doc_id): re-acking
  // returns the existing record (and its original acknowledged_at).
  const rows = (await sql`
    insert into served_doc_acks
      (guest_id, served_doc_id, ip, user_agent)
    values
      (${rec.guestId}, ${rec.servedDocId}, ${rec.ip}, ${rec.userAgent})
    on conflict (guest_id, served_doc_id) do update
      set guest_id = served_doc_acks.guest_id
    returning id, guest_id, served_doc_id, acknowledged_at, ip, user_agent
  `) as AckRow[];
  return mapAck(rows[0]);
}
