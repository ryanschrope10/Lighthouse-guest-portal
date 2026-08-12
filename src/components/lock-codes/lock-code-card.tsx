"use client";

import { useEffect, useState } from "react";
import { Lock, Copy, Check, AlertCircle } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ApiResponse, Booking } from "@/types/index";
import type { GuestLockCode } from "@/app/api/bookings/[id]/lock-code/route";

interface LockCodeCardProps {
  booking: Booking;
}

const NO_CODE: GuestLockCode = {
  revealed: false,
  reasons: ["no_code"],
  code: null,
  notes: null,
};

export function LockCodeCard({ booking }: LockCodeCardProps) {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<GuestLockCode>(NO_CODE);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Guest-scoped endpoint: it returns the code value only once the
        // reveal gate passes, so the code is never in the response early.
        const res = await fetch(
          `/api/bookings/${encodeURIComponent(booking.id)}/lock-code`,
          { cache: "no-store" }
        );
        const json: ApiResponse<GuestLockCode> = await res.json();
        if (cancelled) return;
        setState(json.data ?? NO_CODE);
      } catch {
        if (!cancelled) setState(NO_CODE);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [booking.id]);

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

  if (state.revealed && state.code) {
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
              {state.code}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(state.code!);
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
          {state.notes && (
            <p className="text-xs text-sand-500">{state.notes}</p>
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
