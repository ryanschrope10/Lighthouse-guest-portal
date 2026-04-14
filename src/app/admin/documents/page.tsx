"use client";

// TODO: Check for admin role — redirect non-admins away from /admin routes

import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  Upload,
  Filter,
  Search,
} from "lucide-react";
import clsx from "clsx";
import type { GuestDocument } from "@/types/index";

/* ------------------------------------------------------------------ */
/*  Mock Data                                                         */
/* ------------------------------------------------------------------ */

const mockProperties = [
  { id: "prop-1", name: "Lighthouse Bay RV Resort" },
  { id: "prop-2", name: "Sunset Cove Marina" },
  { id: "prop-3", name: "Pine Ridge Campground" },
  { id: "prop-4", name: "Harbor View Motel" },
];

type DocStatus = "pending" | "verified" | "rejected";

interface DocumentEntry extends GuestDocument {
  guest_name: string;
  guest_email: string;
  property_name: string;
  status: DocStatus;
}

const initialDocuments: DocumentEntry[] = [
  {
    id: "doc-1",
    guest_id: "guest-1",
    guest_name: "James Wilson",
    guest_email: "james.wilson@email.com",
    property_id: "prop-1",
    property_name: "Lighthouse Bay RV Resort",
    type: "insurance",
    label: "RV Insurance - State Farm",
    file_path: "/uploads/doc-1.pdf",
    file_url: "#",
    expires_at: "2026-12-15T00:00:00Z",
    uploaded_at: "2026-04-10T14:30:00Z",
    verified_by: null,
    verified_at: null,
    status: "pending",
  },
  {
    id: "doc-2",
    guest_id: "guest-2",
    guest_name: "Sarah Chen",
    guest_email: "sarah.chen@email.com",
    property_id: "prop-1",
    property_name: "Lighthouse Bay RV Resort",
    type: "registration",
    label: "Vehicle Registration - Texas",
    file_path: "/uploads/doc-2.pdf",
    file_url: "#",
    expires_at: "2027-03-01T00:00:00Z",
    uploaded_at: "2026-04-11T09:15:00Z",
    verified_by: null,
    verified_at: null,
    status: "pending",
  },
  {
    id: "doc-3",
    guest_id: "guest-3",
    guest_name: "Michael Brown",
    guest_email: "m.brown@email.com",
    property_id: "prop-2",
    property_name: "Sunset Cove Marina",
    type: "license",
    label: "Driver License",
    file_path: "/uploads/doc-3.jpg",
    file_url: "#",
    expires_at: "2028-06-20T00:00:00Z",
    uploaded_at: "2026-04-12T11:00:00Z",
    verified_by: null,
    verified_at: null,
    status: "pending",
  },
  {
    id: "doc-4",
    guest_id: "guest-4",
    guest_name: "Emily Rodriguez",
    guest_email: "emily.r@email.com",
    property_id: "prop-3",
    property_name: "Pine Ridge Campground",
    type: "insurance",
    label: "Trailer Insurance - Geico",
    file_path: "/uploads/doc-4.pdf",
    file_url: "#",
    expires_at: "2026-05-01T00:00:00Z",
    uploaded_at: "2026-04-09T16:45:00Z",
    verified_by: null,
    verified_at: null,
    status: "pending",
  },
  {
    id: "doc-5",
    guest_id: "guest-5",
    guest_name: "David Kim",
    guest_email: "david.kim@email.com",
    property_id: "prop-1",
    property_name: "Lighthouse Bay RV Resort",
    type: "insurance",
    label: "RV Insurance - Progressive",
    file_path: "/uploads/doc-5.pdf",
    file_url: "#",
    expires_at: "2026-11-30T00:00:00Z",
    uploaded_at: "2026-04-08T10:20:00Z",
    verified_by: "admin-1",
    verified_at: "2026-04-08T12:00:00Z",
    status: "verified",
  },
  {
    id: "doc-6",
    guest_id: "guest-6",
    guest_name: "Lisa Thompson",
    guest_email: "lisa.t@email.com",
    property_id: "prop-2",
    property_name: "Sunset Cove Marina",
    type: "registration",
    label: "Boat Registration - Florida",
    file_path: "/uploads/doc-6.pdf",
    file_url: "#",
    expires_at: "2026-04-01T00:00:00Z",
    uploaded_at: "2026-04-05T08:30:00Z",
    verified_by: "admin-1",
    verified_at: "2026-04-06T09:00:00Z",
    status: "rejected",
  },
  {
    id: "doc-7",
    guest_id: "guest-7",
    guest_name: "Robert Garcia",
    guest_email: "r.garcia@email.com",
    property_id: "prop-4",
    property_name: "Harbor View Motel",
    type: "license",
    label: "Driver License - CA",
    file_path: "/uploads/doc-7.jpg",
    file_url: "#",
    expires_at: "2027-09-15T00:00:00Z",
    uploaded_at: "2026-04-13T13:10:00Z",
    verified_by: null,
    verified_at: null,
    status: "pending",
  },
];

const mockGuests = [
  { id: "guest-1", name: "James Wilson", email: "james.wilson@email.com" },
  { id: "guest-2", name: "Sarah Chen", email: "sarah.chen@email.com" },
  { id: "guest-3", name: "Michael Brown", email: "m.brown@email.com" },
  { id: "guest-4", name: "Emily Rodriguez", email: "emily.r@email.com" },
  { id: "guest-5", name: "David Kim", email: "david.kim@email.com" },
  { id: "guest-6", name: "Lisa Thompson", email: "lisa.t@email.com" },
  { id: "guest-7", name: "Robert Garcia", email: "r.garcia@email.com" },
];

const docTypes = [
  { value: "", label: "All Types" },
  { value: "insurance", label: "Insurance" },
  { value: "registration", label: "Registration" },
  { value: "license", label: "License" },
  { value: "signed_agreement", label: "Signed Agreement" },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentEntry[]>(initialDocuments);

  // Filters
  const [filterProperty, setFilterProperty] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Upload form
  const [showUpload, setShowUpload] = useState(false);
  const [uploadGuestId, setUploadGuestId] = useState("");
  const [uploadLabel, setUploadLabel] = useState("");
  const [uploadFile, setUploadFile] = useState<string>("");

  const filtered = documents.filter((doc) => {
    if (filterProperty && doc.property_id !== filterProperty) return false;
    if (filterType && doc.type !== filterType) return false;
    if (filterStatus && doc.status !== filterStatus) return false;
    return true;
  });

  function handleVerify(id: string) {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: "verified" as DocStatus,
              verified_by: "admin-1",
              verified_at: new Date().toISOString(),
            }
          : d
      )
    );
  }

  function handleReject(id: string) {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: "rejected" as DocStatus,
              verified_by: "admin-1",
              verified_at: new Date().toISOString(),
            }
          : d
      )
    );
  }

  function handleUpload() {
    if (!uploadGuestId || !uploadLabel) return;
    const guest = mockGuests.find((g) => g.id === uploadGuestId);
    if (!guest) return;

    const newDoc: DocumentEntry = {
      id: `doc-${Date.now()}`,
      guest_id: uploadGuestId,
      guest_name: guest.name,
      guest_email: guest.email,
      property_id: "prop-1",
      property_name: "Lighthouse Bay RV Resort",
      type: "signed_agreement",
      label: uploadLabel,
      file_path: `/uploads/agreement-${Date.now()}.pdf`,
      file_url: "#",
      expires_at: null,
      uploaded_at: new Date().toISOString(),
      verified_by: "admin-1",
      verified_at: new Date().toISOString(),
      status: "verified",
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setShowUpload(false);
    setUploadGuestId("");
    setUploadLabel("");
    setUploadFile("");
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const statusBadge = (status: DocStatus) => {
    const styles = {
      pending: "bg-amber-50 text-amber-700",
      verified: "bg-emerald-50 text-emerald-700",
      rejected: "bg-red-50 text-red-700",
    };
    return (
      <span
        className={clsx(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
          styles[status]
        )}
      >
        {status}
      </span>
    );
  };

  const pendingCount = documents.filter((d) => d.status === "pending").length;

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Guest Documents
          </h1>
          <p className="mt-1 text-sm text-sand-500">
            Review, verify, and manage guest document uploads
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
              {pendingCount} pending
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-2 rounded-lg bg-gold-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold-700"
          >
            <Upload className="h-4 w-4" />
            Upload Agreement
          </button>
        </div>
      </div>

      {/* ── Upload Signed Agreement Form ── */}
      {showUpload && (
        <div className="rounded-xl border border-gold-200 bg-gold-50/50 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Upload Signed Agreement to a Guest
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-sand-500 mb-1.5">
                Select Guest
              </label>
              <select
                value={uploadGuestId}
                onChange={(e) => setUploadGuestId(e.target.value)}
                className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
              >
                <option value="">Choose a guest...</option>
                {mockGuests.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-sand-500 mb-1.5">
                Label
              </label>
              <input
                type="text"
                value={uploadLabel}
                onChange={(e) => setUploadLabel(e.target.value)}
                placeholder="e.g. Lease Agreement 2026"
                className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-sand-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-sand-500 mb-1.5">
                File
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) =>
                  setUploadFile(e.target.files?.[0]?.name ?? "")
                }
                className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-gray-900 file:mr-3 file:rounded file:border-0 file:bg-gold-100 file:px-3 file:py-1 file:text-xs file:font-medium file:text-gold-700 focus:border-gold-400 focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleUpload}
              disabled={!uploadGuestId || !uploadLabel}
              className="rounded-lg bg-gold-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload
            </button>
            <button
              type="button"
              onClick={() => setShowUpload(false)}
              className="rounded-lg border border-sand-200 px-4 py-2.5 text-sm font-medium text-sand-600 transition-colors hover:bg-sand-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm text-sand-500">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filters:</span>
        </div>
        <select
          value={filterProperty}
          onChange={(e) => setFilterProperty(e.target.value)}
          className="rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
        >
          <option value="">All Properties</option>
          {mockProperties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
        >
          {docTypes.map((dt) => (
            <option key={dt.value} value={dt.value}>
              {dt.label}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 focus:outline-none transition-colors"
        >
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Documents Table ── */}
      <div className="rounded-xl border border-sand-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-100 text-left">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sand-500">
                  Guest
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sand-500">
                  Document Type
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sand-500">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sand-500">
                  Expires
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sand-500">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sand-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-sand-400"
                  >
                    No documents match the current filters
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => {
                  const isExpired =
                    doc.expires_at &&
                    new Date(doc.expires_at) < new Date();

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-sand-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {doc.guest_name}
                        </p>
                        <p className="text-xs text-sand-400">
                          {doc.guest_email}
                        </p>
                        <p className="text-xs text-sand-400 mt-0.5">
                          {doc.property_name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-sand-100 px-2.5 py-0.5 text-xs font-medium text-sand-700 capitalize">
                          {doc.type.replace("_", " ")}
                        </span>
                        {doc.label && (
                          <p className="text-xs text-sand-400 mt-1">
                            {doc.label}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sand-700 whitespace-nowrap text-xs">
                        {formatDate(doc.uploaded_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        {doc.expires_at ? (
                          <span
                            className={
                              isExpired
                                ? "font-semibold text-red-600"
                                : "text-sand-700"
                            }
                          >
                            {formatDate(doc.expires_at)}
                            {isExpired && " (expired)"}
                          </span>
                        ) : (
                          <span className="text-sand-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">{statusBadge(doc.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={doc.file_url ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-sand-400 hover:bg-sand-100 hover:text-gray-900 transition-colors"
                            title="Preview"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          {doc.status === "pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleVerify(doc.id)}
                                className="flex h-8 items-center gap-1 rounded-lg bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                                title="Verify"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Verify
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(doc.id)}
                                className="flex h-8 items-center gap-1 rounded-lg bg-red-50 px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                                title="Reject"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
