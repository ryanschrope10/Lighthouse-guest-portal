"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  FileText,
  FileSignature,
  ShieldCheck,
  Car,
  CreditCard,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Mail,
} from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { DocumentUploader } from "@/components/document-uploader";
import type { GuestDocument, ApiResponse } from "@/types/index";
import type {
  RulesPayload,
  ServedPayload,
  BookingSigningStatus,
  ServedDocStatus,
} from "@/lib/documents-types";

function fmt(d: string) {
  return format(parseISO(d), "MMM d, yyyy");
}
function fmtRange(a: string, b: string) {
  return `${format(parseISO(a), "MMM d")} – ${format(parseISO(b), "MMM d, yyyy")}`;
}

// ───────────────────────── Rules & Regulations ─────────────────────────

function SignForm({
  booking,
  defaultName,
  onSigned,
}: {
  booking: BookingSigningStatus;
  defaultName: string;
  onSigned: () => void;
}) {
  const [name, setName] = useState(defaultName);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/documents/rules/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.bookingId, fullName: name }),
      });
      const json: ApiResponse<unknown> = await res.json();
      if (!res.ok || json.error) {
        setError(json.error ?? "Could not record your signature.");
        return;
      }
      onSigned();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-gold-200 bg-gold-50/60 p-4">
      <label className="block">
        <span className="text-xs font-medium text-sand-700">
          Type your full legal name to sign
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="mt-1 block w-full rounded-lg border border-sand-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
        />
      </label>
      <label className="flex items-start gap-2.5 text-sm text-sand-700">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-sand-300 text-gold-600 focus:ring-gold-500"
        />
        <span>
          I have read and agree to the Rules &amp; Regulations for this
          booking. I understand this is a legally binding electronic
          signature.
        </span>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button
        size="sm"
        disabled={busy || name.trim().length < 2 || !agreed}
        onClick={submit}
      >
        <FileSignature className="h-4 w-4" />
        {busy ? "Signing…" : "Sign Rules & Regulations"}
      </Button>
    </div>
  );
}

function RulesTab({ onCounts }: { onCounts: (n: number) => void }) {
  const [data, setData] = useState<RulesPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/documents/rules");
      const json: ApiResponse<RulesPayload> = await res.json();
      if (json.error || !json.data) {
        setError(json.error ?? "Failed to load Rules & Regulations.");
        return;
      }
      setData(json.data);
      onCounts(json.data.outstandingCount);
    } catch {
      setError("Could not reach the server.");
    }
  }, [onCounts]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-red-500" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mt-10 flex justify-center">
        <Spinner />
      </div>
    );
  }

  const { doc, bookings } = data;
  const actionable = bookings.filter((b) => b.requiresSignature && !b.signed);
  const others = bookings.filter((b) => !(b.requiresSignature && !b.signed));

  return (
    <div className="mt-4 space-y-5">
      {actionable.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            You have {actionable.length}{" "}
            {actionable.length > 1 ? "bookings" : "booking"} that
            require a signed Rules &amp; Regulations. Please review and sign
            below.
          </p>
        </div>
      )}

      {/* The document */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">{doc.title}</h2>
          <p className="mt-0.5 text-xs text-sand-500">
            Version {doc.version} · Effective {fmt(doc.effectiveDate)}
          </p>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-sand-700">{doc.intro}</p>
          <div className="mt-4 max-h-72 space-y-4 overflow-y-auto rounded-lg border border-sand-200 bg-sand-50/50 p-4">
            {doc.sections.map((s) => (
              <div key={s.heading}>
                <p className="text-sm font-semibold text-gray-900">
                  {s.heading}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-sand-700">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Sign per booking */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-sand-700">
          Sign for your booking
        </h3>
        {actionable.length === 0 ? (
          <p className="mt-2 text-sm text-sand-500">
            No bookings currently require a signature — you&apos;re all set.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {actionable.map((b) => (
              <Card key={b.bookingId}>
                <CardBody>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {b.label}
                      </p>
                      <p className="text-xs text-sand-500">
                        {fmtRange(b.checkIn, b.checkOut)}
                      </p>
                    </div>
                    <Badge status="warning">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Signature required
                    </Badge>
                  </div>
                  <SignForm
                    booking={b}
                    defaultName={data.guestName}
                    onSigned={load}
                  />
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* History */}
      {others.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-sand-700">
            Booking history
          </h3>
          <div className="mt-3 space-y-2">
            {others.map((b) => (
              <div
                key={b.bookingId}
                className="flex items-center justify-between gap-3 rounded-lg border border-sand-200 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {b.label}
                  </p>
                  <p className="text-xs text-sand-500">
                    {fmtRange(b.checkIn, b.checkOut)}
                  </p>
                </div>
                {b.signed ? (
                  <div className="text-right">
                    <Badge status="success">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Signed
                    </Badge>
                    <p className="mt-1 text-[11px] text-sand-500">
                      {b.signedName} · {b.signedAt ? fmt(b.signedAt) : ""}
                    </p>
                  </div>
                ) : (
                  <Badge status="neutral">Not required</Badge>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ───────────────────────── Sent & Served ─────────────────────────

const servedCategoryBadge: Record<
  ServedDocStatus["category"],
  { label: string; status: "info" | "warning" | "danger" }
> = {
  notice: { label: "Notice", status: "warning" },
  policy: { label: "Policy", status: "info" },
  billing: { label: "Billing", status: "danger" },
};

function ServedTab({ onCounts }: { onCounts: (n: number) => void }) {
  const [data, setData] = useState<ServedPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/documents/served");
      const json: ApiResponse<ServedPayload> = await res.json();
      if (json.error || !json.data) {
        setError(json.error ?? "Failed to load documents.");
        return;
      }
      setData(json.data);
      onCounts(json.data.outstandingCount);
    } catch {
      setError("Could not reach the server.");
    }
  }, [onCounts]);

  useEffect(() => {
    load();
  }, [load]);

  async function acknowledge(docId: string) {
    setBusyId(docId);
    try {
      await fetch("/api/documents/served/ack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (error) {
    return (
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-red-500" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mt-10 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (data.documents.length === 0) {
    return (
      <EmptyState
        icon={Mail}
        title="Nothing here yet"
        description="Notices and documents the park sends you will appear here."
        className="mt-6"
      />
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {data.documents.map((d) => {
        const cat = servedCategoryBadge[d.category];
        return (
          <Card key={d.id}>
            <CardBody>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {d.title}
                  </p>
                  <p className="mt-0.5 text-xs text-sand-500">
                    Sent {fmt(d.sentAt)}
                  </p>
                </div>
                <Badge status={cat.status}>{cat.label}</Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-sand-700">
                {d.body}
              </p>
              <div className="mt-4 border-t border-sand-100 pt-3">
                {d.acknowledged ? (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Receipt acknowledged
                    {d.acknowledgedAt ? ` on ${fmt(d.acknowledgedAt)}` : ""}
                  </p>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busyId === d.id}
                    onClick={() => acknowledge(d.id)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {busyId === d.id ? "Recording…" : "Acknowledge receipt"}
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

// ───────────────────────── My Uploads ─────────────────────────

const typeIcons: Record<string, typeof FileText> = {
  insurance: ShieldCheck,
  registration: Car,
  license: CreditCard,
  signed_agreement: FileSignature,
};

function UploadsTab() {
  const [docs, setDocs] = useState<GuestDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      const json: ApiResponse<GuestDocument[]> = await res.json();
      if (json.error || !json.data) {
        setError(json.error ?? "Failed to load your documents.");
        return;
      }
      setDocs(json.data);
      setError(null);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onUpload = useCallback(
    async (data: {
      file: File;
      documentType: string;
      expiryDate: string | null;
      fileData: string;
      contentType: string;
    }): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: data.documentType,
            label: data.file.name,
            file_name: data.file.name,
            expires_at: data.expiryDate,
            content_type: data.contentType,
            file_data: data.fileData,
          }),
        });
        const json: ApiResponse<GuestDocument> = await res.json();
        if (json.error || !json.data) {
          const msg = json.error ?? "Could not save your document.";
          setError(msg);
          return { ok: false, error: msg };
        }
        setDocs((prev) => [json.data as GuestDocument, ...prev]);
        setError(null);
        return { ok: true };
      } catch {
        const msg = "Could not reach the server.";
        setError(msg);
        return { ok: false, error: msg };
      }
    },
    [],
  );

  const onDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      const json: ApiResponse<{ deleted: string }> = await res.json();
      if (json.error) {
        setError(json.error);
        return;
      }
      setDocs((prev) => prev.filter((d) => d.id !== id));
      setError(null);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setDeletingId(null);
    }
  }, []);

  return (
    <div className="mt-4 space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">
            Upload a Document
          </h2>
          <p className="mt-0.5 text-sm text-sand-500">
            Insurance, registration, or license
          </p>
        </CardHeader>
        <CardBody>
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-sand-200 bg-sand-50/60 p-3 text-xs text-sand-600">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-sand-400" />
            <span>
              Files are stored securely (max 5 MB) and are visible only to you
              and the front desk.
            </span>
          </div>
          <DocumentUploader onUploadComplete={onUpload} />
        </CardBody>
      </Card>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="mt-10 flex justify-center">
          <Spinner />
        </div>
      ) : docs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents"
          description="Upload your first document above."
        />
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => {
            const Icon = typeIcons[doc.type] ?? FileText;
            return (
              <div
                key={doc.id}
                className="flex items-start gap-3 rounded-xl border border-sand-200 bg-white p-4 shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand-100">
                  <Icon className="h-5 w-5 text-sand-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {doc.label}
                  </p>
                  <p className="mt-0.5 text-xs text-sand-500">
                    Uploaded {fmt(doc.uploaded_at)}
                    {doc.expires_at ? ` · Expires ${fmt(doc.expires_at)}` : ""}
                  </p>
                  <div className="mt-2">
                    <Badge status={doc.verified_at ? "success" : "neutral"}>
                      {doc.verified_at ? (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      ) : (
                        <Clock className="mr-1 h-3 w-3" />
                      )}
                      {doc.verified_at ? "Verified" : "Pending review"}
                    </Badge>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        `/api/documents/${doc.id}/file`,
                        "_blank",
                        "noopener",
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-sand-400 hover:bg-sand-100 hover:text-sand-600"
                    aria-label="View"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === doc.id}
                    onClick={() => onDelete(doc.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-sand-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Page ─────────────────────────

export default function DocumentsPage() {
  const [tab, setTab] = useState("rules");
  const [rulesDue, setRulesDue] = useState<number | null>(null);
  const [servedDue, setServedDue] = useState<number | null>(null);

  const badge = (n: number | null) => (n && n > 0 ? ` (${n})` : "");

  const TABS = [
    { label: `Rules & Regulations${badge(rulesDue)}`, value: "rules" },
    { label: `Sent & Served${badge(servedDue)}`, value: "served" },
    { label: "My Uploads", value: "uploads" },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Documents</h1>
      <p className="mt-1 text-sm text-sand-500">
        Sign required agreements, review notices from the park, and manage your
        uploaded documents.
      </p>

      <div className="mt-5">
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
      </div>

      <TabPanel value="rules" activeValue={tab}>
        <RulesTab onCounts={setRulesDue} />
      </TabPanel>
      <TabPanel value="served" activeValue={tab}>
        <ServedTab onCounts={setServedDue} />
      </TabPanel>
      <TabPanel value="uploads" activeValue={tab}>
        <UploadsTab />
      </TabPanel>
    </div>
  );
}
