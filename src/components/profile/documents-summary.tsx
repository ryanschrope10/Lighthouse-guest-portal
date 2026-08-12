"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { differenceInCalendarDays, parseISO, isValid } from "date-fns";
import { FileText, AlertTriangle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import type { GuestDocument, ApiResponse } from "@/types/index";

/** Expiring within the next 30 days (already-expired documents included). */
function expiringSoon(doc: GuestDocument): boolean {
  if (!doc.expires_at) return false;
  const parsed = parseISO(doc.expires_at);
  if (!isValid(parsed)) return false;
  return differenceInCalendarDays(parsed, new Date()) <= 30;
}

export function DocumentsSummary() {
  const [docs, setDocs] = useState<GuestDocument[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/documents");
        const json: ApiResponse<GuestDocument[]> = await res.json();
        if (cancelled) return;
        setDocs(json.data ?? []);
      } catch {
        if (!cancelled) setDocs([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (docs === null) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  const expiring = docs.filter(expiringSoon).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-sand-200 bg-sand-50/50 px-4 py-3 text-center">
          <FileText className="mx-auto mb-1 h-6 w-6 text-gold-600" />
          <p className="text-2xl font-semibold text-sand-900">{docs.length}</p>
          <p className="text-xs text-sand-500">Documents Uploaded</p>
        </div>
        <div className="rounded-lg border border-sand-200 bg-sand-50/50 px-4 py-3 text-center">
          <AlertTriangle className="mx-auto mb-1 h-6 w-6 text-amber-500" />
          <p className="text-2xl font-semibold text-sand-900">{expiring}</p>
          <p className="text-xs text-sand-500">Expiring Soon</p>
        </div>
      </div>

      {/* Expiring badge */}
      {expiring > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {expiring} document{expiring > 1 ? "s" : ""} expiring within 30 days
          </span>
          <Badge status="warning" className="ml-auto">
            Action Needed
          </Badge>
        </div>
      )}

      {/* Link to documents page */}
      <Link
        href="/documents"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold-600 px-4 py-3 text-sm font-medium text-white hover:bg-gold-700 active:bg-gold-800 transition-colors"
      >
        Manage Documents
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
