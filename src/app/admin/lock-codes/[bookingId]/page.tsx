"use client";

// TODO: Check for admin role — redirect non-admins away from /admin routes

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Lock } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { ApiResponse, Booking } from "@/types/index";
import type { LockCode, LockCodeRevealAfter } from "@/types/lock-codes";

const revealOptions: { label: string; value: LockCodeRevealAfter }[] = [
  { label: "Paid & checked in (default)", value: "paid_and_checkin" },
  { label: "Paid only", value: "paid" },
  { label: "Always (no gating)", value: "always" },
];

export default function AdminLockCodeEditPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [existing, setExisting] = useState<LockCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [revealAfter, setRevealAfter] =
    useState<LockCodeRevealAfter>("paid_and_checkin");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [bRes, cRes] = await Promise.all([
          fetch(`/api/bookings/${params.bookingId}`),
          fetch(
            `/api/admin/lock-codes?booking_id=${encodeURIComponent(params.bookingId)}`
          ),
        ]);
        const bJson: ApiResponse<Booking> = await bRes.json();
        const cJson: ApiResponse<LockCode[]> = await cRes.json();
        if (cancelled) return;
        setBooking(bJson.data);
        const active = (cJson.data ?? []).find((c) => !c.revoked_at) ?? null;
        setExisting(active);
        if (active) {
          setCode(active.code);
          setRevealAfter(active.reveal_after);
          setNotes(active.notes ?? "");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.bookingId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!booking || !code.trim()) return;
    setSaving(true);
    setError(null);
    try {
      let res: Response;
      if (existing) {
        res = await fetch(`/api/admin/lock-codes/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: code.trim(),
            reveal_after: revealAfter,
            notes: notes.trim() || null,
          }),
        });
      } else {
        res = await fetch("/api/admin/lock-codes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booking_id: booking.id,
            property_id: booking.property_id,
            code: code.trim(),
            reveal_after: revealAfter,
            notes: notes.trim() || null,
            source: "manual",
          }),
        });
      }
      const json: ApiResponse<LockCode> = await res.json();
      if (!res.ok || json.error) {
        setError(json.error ?? "Failed to save code");
        return;
      }
      router.push("/admin/lock-codes");
    } catch {
      setError("Failed to save code");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/lock-codes"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-700 hover:text-gold-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lock Codes
        </Link>
        <p className="text-sm text-sand-500">Booking not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/lock-codes"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-700 hover:text-gold-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lock Codes
        </Link>
        <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Lock className="h-5 w-5 text-gold-600" />
          {existing ? "Edit Lock Code" : "Issue Lock Code"}
        </h1>
        <p className="mt-1 text-sm text-sand-500">
          {booking.site_or_room ?? "Booking"} ·{" "}
          {format(parseISO(booking.check_in), "MMM d")} —{" "}
          {format(parseISO(booking.check_out), "MMM d, yyyy")}
        </p>
      </div>

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Lock Code"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. 4827"
              required
              autoComplete="off"
              helperText="Entered manually for now. NextLock auto-issue coming later."
            />
            <Select
              label="Reveal to guest after"
              name="reveal_after"
              value={revealAfter}
              onChange={(e) =>
                setRevealAfter(e.target.value as LockCodeRevealAfter)
              }
              options={revealOptions}
            />
            <Textarea
              label="Internal notes (optional)"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. shared back door code; rotate after departure"
            />

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" loading={saving} disabled={!code.trim()}>
                {existing ? "Save Changes" : "Issue Code"}
              </Button>
              <Link
                href="/admin/lock-codes"
                className="text-sm font-medium text-sand-600 hover:text-gray-900"
              >
                Cancel
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
