"use client";

import { useState, useCallback } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import {
  ShieldCheck,
  Car,
  CreditCard,
  FileSignature,
  FileText,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import clsx from "clsx";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentUploader } from "@/components/document-uploader";
import type { GuestDocument } from "@/types/index";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const initialDocuments: GuestDocument[] = [
  {
    id: "doc_001",
    guest_id: "guest_001",
    property_id: "prop_001",
    type: "insurance",
    label: "RV Insurance — State Farm",
    file_path: "/uploads/guest_001/insurance_2026.pdf",
    expires_at: "2026-04-20T00:00:00Z",
    uploaded_at: "2025-11-15T09:00:00Z",
    verified_by: "staff_001",
    verified_at: "2025-11-16T10:30:00Z",
  },
  {
    id: "doc_002",
    guest_id: "guest_001",
    property_id: "prop_001",
    type: "registration",
    label: "TX Vehicle Registration",
    file_path: "/uploads/guest_001/registration_2026.pdf",
    expires_at: "2026-09-30T00:00:00Z",
    uploaded_at: "2026-02-01T14:00:00Z",
    verified_by: "staff_001",
    verified_at: "2026-02-02T08:00:00Z",
  },
  {
    id: "doc_005",
    guest_id: "guest_001",
    property_id: "prop_001",
    type: "license",
    label: "Driver's License — Mike Henderson",
    file_path: "/uploads/guest_001/license_2026.jpg",
    expires_at: "2028-06-10T00:00:00Z",
    uploaded_at: "2026-03-15T10:00:00Z",
    verified_by: null,
    verified_at: null,
  },
];

const signedDocuments: GuestDocument[] = [
  {
    id: "doc_003",
    guest_id: "guest_001",
    property_id: "prop_001",
    type: "signed_agreement",
    label: "Park Rules & Regulations Agreement",
    file_path: "/uploads/guest_001/park_rules_signed.pdf",
    expires_at: null,
    uploaded_at: "2024-06-10T15:00:00Z",
    verified_by: "staff_001",
    verified_at: "2024-06-10T15:30:00Z",
  },
  {
    id: "doc_004",
    guest_id: "guest_001",
    property_id: "prop_001",
    type: "signed_agreement",
    label: "2026 Season Pet Policy Addendum",
    file_path: "/uploads/guest_001/pet_policy_signed.pdf",
    expires_at: null,
    uploaded_at: "2026-04-01T00:00:00Z",
    verified_by: "staff_001",
    verified_at: "2026-04-01T09:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const typeIcons: Record<string, typeof FileText> = {
  insurance: ShieldCheck,
  registration: Car,
  license: CreditCard,
  signed_agreement: FileSignature,
};

const typeLabels: Record<string, string> = {
  insurance: "Insurance",
  registration: "Registration",
  license: "Driver's License",
  signed_agreement: "Signed Agreement",
};

function getExpiryStatus(
  expiresAt: string | null,
): { label: string; status: "success" | "warning" | "danger" } | null {
  if (!expiresAt) return null;

  const now = new Date();
  const expiry = parseISO(expiresAt);
  const daysUntil = differenceInDays(expiry, now);

  if (daysUntil < 0) {
    return { label: "Expired", status: "danger" };
  }
  if (daysUntil <= 30) {
    return {
      label: `Expires in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`,
      status: "warning",
    };
  }
  return null;
}

function getVerificationBadge(
  doc: GuestDocument,
): { label: string; status: "success" | "neutral"; icon: typeof CheckCircle2 } {
  if (doc.verified_at) {
    return { label: "Verified", status: "success", icon: CheckCircle2 };
  }
  return { label: "Pending", status: "neutral", icon: Clock };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DocumentsPage() {
  const [myDocuments, setMyDocuments] =
    useState<GuestDocument[]>(initialDocuments);

  const handleDelete = useCallback((id: string) => {
    setMyDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const handleUploadComplete = useCallback(
    (data: { file: File; documentType: string; expiryDate: string | null }) => {
      const newDoc: GuestDocument = {
        id: `doc_${Date.now()}`,
        guest_id: "guest_001",
        property_id: "prop_001",
        type: data.documentType as GuestDocument["type"],
        label: data.file.name,
        file_path: `/uploads/guest_001/${data.file.name}`,
        expires_at: data.expiryDate
          ? new Date(data.expiryDate).toISOString()
          : null,
        uploaded_at: new Date().toISOString(),
        verified_by: null,
        verified_at: null,
      };
      setMyDocuments((prev) => [newDoc, ...prev]);
    },
    [],
  );

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-gray-900">Documents</h1>

      {/* ── Upload Section ── */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">
            Upload Document
          </h2>
          <p className="mt-0.5 text-sm text-sand-500">
            Upload insurance, registration, or license documents
          </p>
        </CardHeader>
        <CardBody>
          <DocumentUploader onUploadComplete={handleUploadComplete} />
        </CardBody>
      </Card>

      {/* ── My Documents Section ── */}
      <section>
        <h2 className="text-base font-semibold text-gray-900">My Documents</h2>
        <p className="mt-0.5 text-sm text-sand-500">
          Documents you have uploaded
        </p>

        {myDocuments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents"
            description="Upload your first document using the form above."
            className="mt-6"
          />
        ) : (
          <div className="mt-4 space-y-3">
            {myDocuments.map((doc) => {
              const Icon = typeIcons[doc.type] ?? FileText;
              const verification = getVerificationBadge(doc);
              const VerifIcon = verification.icon;
              const expiry = getExpiryStatus(doc.expires_at);

              return (
                <div
                  key={doc.id}
                  className="flex items-start gap-3 rounded-xl border border-sand-200 bg-white p-4 shadow-sm"
                >
                  {/* Type icon */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sand-100">
                    <Icon className="h-5 w-5 text-sand-600" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {doc.label || typeLabels[doc.type]}
                    </p>

                    <p className="mt-0.5 text-xs text-sand-500">
                      Uploaded{" "}
                      {format(parseISO(doc.uploaded_at), "MMM d, yyyy")}
                    </p>

                    {doc.expires_at && (
                      <p className="mt-0.5 text-xs text-sand-500">
                        Expires{" "}
                        {format(parseISO(doc.expires_at), "MMM d, yyyy")}
                      </p>
                    )}

                    {/* Badges row */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge status={verification.status}>
                        <VerifIcon className="mr-1 h-3 w-3" />
                        {verification.label}
                      </Badge>

                      {expiry && (
                        <Badge status={expiry.status}>
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {expiry.label}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        /* placeholder — open preview/download */
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-sand-400 transition-colors hover:bg-sand-100 hover:text-sand-600"
                      aria-label="View document"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-sand-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      aria-label="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Signed Documents Section ── */}
      <section>
        <h2 className="text-base font-semibold text-gray-900">
          Signed Documents
        </h2>
        <p className="mt-0.5 text-sm text-sand-500">
          Agreements and policies signed during your stay
        </p>

        {signedDocuments.length === 0 ? (
          <EmptyState
            icon={FileSignature}
            title="No signed documents"
            description="Signed agreements will appear here once provided by staff."
            className="mt-6"
          />
        ) : (
          <div className="mt-4 space-y-3">
            {signedDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-xl border border-sand-200 bg-white p-4 shadow-sm"
              >
                {/* Icon */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold-50">
                  <FileSignature className="h-5 w-5 text-gold-600" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {doc.label}
                  </p>
                  <p className="mt-0.5 text-xs text-sand-500">
                    Signed{" "}
                    {doc.verified_at
                      ? format(parseISO(doc.verified_at), "MMM d, yyyy")
                      : format(parseISO(doc.uploaded_at), "MMM d, yyyy")}
                  </p>
                </div>

                {/* View button */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    /* placeholder — open document viewer */
                  }}
                >
                  <Eye className="h-4 w-4" />
                  View
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
