"use client";

import { useEffect, useState } from "react";
import { Lock, Copy, Check, AlertCircle } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ApiResponse, Booking } from "@/types/index";
import type { LockCode, LockCodeRevealState } from "@/types/lock-codes";

interface LockCodeCardProps {
  booking: Booking;
}

function evaluateReveal(
  booking: Booking,
  code: LockCode | null
): LockCodeRevealState {
  const reasons: LockCodeRevealState["reasons"] = [];
  if (!code) {
    reasons.push("no_code");
    return { revealed: false, reasons };
  }
  if (code.revoked_at) {
    reasons.push("revoked");
    return { revealed: false, reasons };
  }
  const paid = booking.balance_due <= 0;
  const checkedIn = booking.status === "checked_in";

  if (code.reveal_after === "always") {
    return { revealed: true, reasons };
  }
  if (code.reveal_after === "paid") {
    if (!paid) reasons.push("not_paid");
    return { revealed: paid, reasons };
  }
  // paid_and_checkin
  if (!paid) reasons.push("not_paid");
  if (!checkedIn) reasons.push("not_checked_in");
  return { revealed: paid && checkedIn, reasons };
}

export function LockCodeCard({ booking }: LockCodeCardProps) {
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState<LockCode | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/lock-codes?booking_id=${encodeURIComponent(booking.id)}`,
          { cache: "no-store" }
        );
        const json: ApiResponse<LockCode[]> = await res.json();
        if (cancelled) return;
        const active = (json.data ?? []).find((c) => !c.revoked_at) ?? null;
        setCode(active);
      } catch {
        if (!cancelled) setCode(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [booking.id]);

  const state = evaluateReveal(booking, code);

  if (loading) {
    return (
      <div id="lock-code">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <Spinner />
              <span className="text-sm text-sand-500">
                Loading access code…
              </span>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (state.revealed && code) {
    return (
      <div id="lock-code">
      <Card className="border-gold-300">
        <CardBody className="space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-gold-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              Your Access Code
            </h3>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-sand-50 px-4 py-3">
            <span className="font-mono text-2xl font-bold tracking-wider text-gray-900 sm:text-3xl">
              {code.code}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(code.code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  // Clipboard unavailable; user can still read the code.
                }
              }}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-sand-600">
            Use this code at your unit&apos;s lock to enter.
          </p>
          {code.notes && (
            <p className="text-xs text-sand-500">{code.notes}</p>
          )}
        </CardBody>
      </Card>
      </div>
    );
  }

  const messages: string[] = [];
  if (state.reasons.includes("no_code")) {
    messages.push("Your code has not been issued yet.");
  }
  if (state.reasons.includes("revoked")) {
    messages.push("The previous code has been revoked — contact the front desk.");
  }
  if (state.reasons.includes("not_paid")) {
    messages.push("Outstanding balance must be paid.");
  }
  if (state.reasons.includes("not_checked_in")) {
    messages.push("You must be checked in.");
  }

  return (
    <div id="lock-code">
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-sand-400" />
          <h3 className="text-sm font-semibold text-gray-900">Access Code</h3>
        </div>
        <p className="text-sm text-sand-600">
          Your access code will appear here once your balance is paid and
          you&apos;re checked in.
        </p>
        {messages.length > 0 && (
          <ul className="space-y-1.5">
            {messages.map((m) => (
              <li
                key={m}
                className="flex items-start gap-2 text-xs text-sand-500"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                <span>{m}</span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
    </div>
  );
}
