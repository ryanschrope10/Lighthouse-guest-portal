"use client";

import { format, parseISO } from "date-fns";
import { ShieldCheck, AlertCircle, ExternalLink } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import type { Booking } from "@/types/index";
import type { SignatureStatus } from "@/types/signature";

interface SignatureStatusCardProps {
  booking: Booking;
}

function readSignature(booking: Booking): {
  status: SignatureStatus;
  signedAt: string | null;
  url: string | null;
} {
  const details = (booking.details ?? {}) as Record<string, unknown>;
  const status = (details.signature_status as SignatureStatus | undefined) ??
    "not_required";
  const signedAt =
    typeof details.signature_signed_at === "string"
      ? details.signature_signed_at
      : null;
  const url =
    typeof details.signature_document_url === "string"
      ? details.signature_document_url
      : null;
  return { status, signedAt, url };
}

export function SignatureStatusCard({ booking }: SignatureStatusCardProps) {
  const { status, signedAt, url } = readSignature(booking);

  if (status === "not_required") return null;

  if (status === "pending") {
    return (
      <Card className="border-amber-300 bg-amber-50/60">
        <CardBody className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-700" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-amber-900">
                Rules &amp; Regulations
              </h3>
              <p className="mt-0.5 text-sm text-amber-800">
                Signature required. Please sign before check-in.
              </p>
            </div>
          </div>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
            >
              Sign Now
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <p className="text-xs text-amber-700">
              Check your email for the signing link from the property.
            </p>
          )}
        </CardBody>
      </Card>
    );
  }

  // signed
  return (
    <Card className="border-emerald-300 bg-emerald-50/60">
      <CardBody className="space-y-2">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
            <ShieldCheck className="h-5 w-5 text-emerald-700" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-emerald-900">
              Rules &amp; Regulations
            </h3>
            <p className="mt-0.5 text-sm text-emerald-800">
              {signedAt
                ? `Signed on ${format(parseISO(signedAt), "MMM d, yyyy")}.`
                : "Signed."}
            </p>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 hover:text-emerald-900"
              >
                View document
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
