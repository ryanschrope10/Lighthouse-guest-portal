"use client";

import Link from "next/link";
import {
  FileText,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mock data
const MOCK_DOCS_COUNT = 4;
const MOCK_EXPIRING_SOON = 1;

export function DocumentsSummary() {
  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-sand-200 bg-sand-50/50 px-4 py-3 text-center">
          <FileText className="mx-auto mb-1 h-6 w-6 text-gold-600" />
          <p className="text-2xl font-semibold text-sand-900">
            {MOCK_DOCS_COUNT}
          </p>
          <p className="text-xs text-sand-500">Documents Uploaded</p>
        </div>
        <div className="rounded-lg border border-sand-200 bg-sand-50/50 px-4 py-3 text-center">
          <AlertTriangle className="mx-auto mb-1 h-6 w-6 text-amber-500" />
          <p className="text-2xl font-semibold text-sand-900">
            {MOCK_EXPIRING_SOON}
          </p>
          <p className="text-xs text-sand-500">Expiring Soon</p>
        </div>
      </div>

      {/* Expiring badge */}
      {MOCK_EXPIRING_SOON > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {MOCK_EXPIRING_SOON} document{MOCK_EXPIRING_SOON > 1 ? "s" : ""}{" "}
            expiring within 30 days
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
