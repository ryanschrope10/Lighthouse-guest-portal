// ============================================================
// Lock code types
// ============================================================
//
// Backed by the `lock_codes` table (migration 002). The portal
// app — not RLS — enforces the reveal_after gate before showing
// the code to a guest.
// ============================================================

export type LockCodeSource = 'manual' | 'nextlock';

export type LockCodeRevealAfter = 'paid_and_checkin' | 'paid' | 'always';

export interface LockCode {
  id: string;
  booking_id: string;
  property_id: string;
  code: string;
  source: LockCodeSource;
  reveal_after: LockCodeRevealAfter;
  issued_at: string;
  issued_by: string | null;
  revoked_at: string | null;
  notes: string | null;
}

export interface CreateLockCodeInput {
  booking_id: string;
  property_id: string;
  code: string;
  reveal_after?: LockCodeRevealAfter;
  source?: LockCodeSource;
  notes?: string | null;
}

export interface UpdateLockCodeInput {
  code?: string;
  reveal_after?: LockCodeRevealAfter;
  notes?: string | null;
  revoked_at?: string | null;
}

export interface LockCodeRevealState {
  revealed: boolean;
  reasons: Array<'not_paid' | 'not_checked_in' | 'no_code' | 'revoked'>;
}
