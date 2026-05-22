// ============================================================
// Portal store (server-only, file-backed)
// ============================================================
//
// Real persistence for things Newbook doesn't own: Rules &
// Regulations signatures and served-document acknowledgments.
//
// Backed by a JSON file under .data/ (gitignored) so the feature
// works end-to-end in dev without provisioning a database. The
// surface here is deliberately a small repository so swapping to
// Postgres/Neon later is a single-file change behind these
// functions — callers don't change.
// ============================================================

import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "portal-store.json");

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

interface StoreShape {
  signatures: SignatureRecord[];
  acks: AckRecord[];
}

const EMPTY: StoreShape = { signatures: [], acks: [] };

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    return {
      signatures: parsed.signatures ?? [],
      acks: parsed.acks ?? [],
    };
  } catch {
    return { ...EMPTY };
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

// ---- Signatures ----

export async function listSignatures(
  guestId: string,
): Promise<SignatureRecord[]> {
  const store = await readStore();
  return store.signatures.filter((s) => s.guestId === guestId);
}

export async function addSignature(
  rec: Omit<SignatureRecord, "id" | "signedAt">,
): Promise<SignatureRecord> {
  const store = await readStore();
  const full: SignatureRecord = {
    ...rec,
    id: id("sig"),
    signedAt: new Date().toISOString(),
  };
  store.signatures.push(full);
  await writeStore(store);
  return full;
}

// ---- Served-document acknowledgments ----

export async function listAcks(guestId: string): Promise<AckRecord[]> {
  const store = await readStore();
  return store.acks.filter((a) => a.guestId === guestId);
}

export async function addAck(
  rec: Omit<AckRecord, "id" | "acknowledgedAt">,
): Promise<AckRecord> {
  const store = await readStore();
  const existing = store.acks.find(
    (a) => a.guestId === rec.guestId && a.servedDocId === rec.servedDocId,
  );
  if (existing) return existing; // acknowledgment is idempotent
  const full: AckRecord = {
    ...rec,
    id: id("ack"),
    acknowledgedAt: new Date().toISOString(),
  };
  store.acks.push(full);
  await writeStore(store);
  return full;
}
